/**
 * Supabase Data Fetcher
 *
 * Translates WiringReadBinding descriptors into actual Supabase
 * `.from().select()` query chains. Returns raw data + error.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Simplified binding types (mirrors @wiraflow/contracts without import issues)
// ---------------------------------------------------------------------------

export interface ReadBinding {
  key: string;
  sourceKey: string;           // table name
  accessMode: string;          // single | list | scoped_list | aggregate
  filterInputs?: FilterInput[];
  sortMode?: string;
  paginationMode?: string;
}

export interface FilterInput {
  fieldKey: string;
  operator: string;  // eq | neq | gt | gte | lt | lte | in | like | ilike | is_null | not_null
  literalValue?: unknown;
  sourceKey?: string;
}

export interface MutationBinding {
  key: string;
  targetTableKey: string;
  operation: string;  // insert | update | upsert | delete
}

export interface UploadBinding {
  key: string;
  bucketKey: string;
}

// ---------------------------------------------------------------------------
// Read: fetch data for a read binding
// ---------------------------------------------------------------------------

export async function fetchReadBinding(
  client: SupabaseClient,
  binding: ReadBinding,
  params?: Record<string, unknown>
): Promise<{ data: any[] | null; error: string | null; count?: number }> {
  try {
    let query = client.from(binding.sourceKey).select("*", { count: "exact" });

    // Apply filters
    if (binding.filterInputs) {
      for (const filter of binding.filterInputs) {
        const value = filter.literalValue ?? params?.[filter.sourceKey ?? ""] ?? null;

        switch (filter.operator) {
          case "eq":    query = query.eq(filter.fieldKey, value); break;
          case "neq":   query = query.neq(filter.fieldKey, value); break;
          case "gt":    query = query.gt(filter.fieldKey, value); break;
          case "gte":   query = query.gte(filter.fieldKey, value); break;
          case "lt":    query = query.lt(filter.fieldKey, value); break;
          case "lte":   query = query.lte(filter.fieldKey, value); break;
          case "in":    query = query.in(filter.fieldKey, value as any[]); break;
          case "like":  query = query.like(filter.fieldKey, value as string); break;
          case "ilike": query = query.ilike(filter.fieldKey, value as string); break;
          case "is_null":  query = query.is(filter.fieldKey, null); break;
          case "not_null": query = query.not(filter.fieldKey, "is", null); break;
        }
      }
    }

    // Access mode
    if (binding.accessMode === "single") {
      query = query.limit(1);
    }

    // Pagination (basic offset/limit)
    if (binding.paginationMode === "offset_limit" && params) {
      const offset = (params.page as number ?? 0) * (params.pageSize as number ?? 20);
      const limit = params.pageSize as number ?? 20;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: error.message, count: 0 };
    }

    return { data: data ?? [], error: null, count: count ?? data?.length ?? 0 };
  } catch (err: any) {
    return { data: null, error: err.message || "Unknown fetch error" };
  }
}

// ---------------------------------------------------------------------------
// Mutate: insert / update / upsert / delete
// ---------------------------------------------------------------------------

export async function executeMutation(
  client: SupabaseClient,
  binding: MutationBinding,
  data: Record<string, any>,
  matchKey?: string  // column to match for update/delete (default: "id")
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const table = binding.targetTableKey;
    const idCol = matchKey ?? "id";

    switch (binding.operation) {
      case "insert": {
        const { data: result, error } = await client.from(table).insert(data).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data: result };
      }

      case "update": {
        const id = data[idCol];
        if (!id) return { success: false, error: `Missing ${idCol} for update` };
        const { [idCol]: _, ...updateData } = data;
        const { data: result, error } = await client.from(table).update(updateData).eq(idCol, id).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data: result };
      }

      case "upsert": {
        const { data: result, error } = await client.from(table).upsert(data).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, data: result };
      }

      case "delete": {
        const id = data[idCol];
        if (!id) return { success: false, error: `Missing ${idCol} for delete` };
        const { error } = await client.from(table).delete().eq(idCol, id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      default:
        return { success: false, error: `Unknown operation: ${binding.operation}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown mutation error" };
  }
}

// ---------------------------------------------------------------------------
// Upload: file to storage bucket
// ---------------------------------------------------------------------------

export async function executeUpload(
  client: SupabaseClient,
  bucketName: string,
  file: File,
  path?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const filePath = path ?? `${Date.now()}-${file.name}`;
    const { data, error } = await client.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) return { success: false, error: error.message };

    // Get public URL
    const { data: urlData } = client.storage.from(bucketName).getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Upload failed" };
  }
}
