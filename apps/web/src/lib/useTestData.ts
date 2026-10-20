import { useState, useEffect } from "react";
import type { DesignSpec } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generates mock data for ListViews and GridViews in a design spec.
 * If Supabase is connected and tables exist, it will try to fetch real data.
 * Otherwise, it creates fake template data.
 */
export function useTestData(
  spec: DesignSpec | null | undefined,
  supabaseClient: SupabaseClient | null,
  schemaPlan: any | null
) {
  const [testData, setTestData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spec) return;

    let mounted = true;
    const generateData = async () => {
      setLoading(true);
      const newData: Record<string, any[]> = {};

      // Find all ListView/GridView widgets
      const listWidgets: any[] = [];
      spec.pages.forEach((page) => {
        page.widgets.forEach((w) => {
          if (w.type === "ListView" || w.type === "GridView") {
            listWidgets.push(w);
          }
        });
      });

      // Try to fetch real data if available
      const tables = schemaPlan?.tables || [];
      const tableDataCache: Record<string, any[]> = {};

      if (supabaseClient && tables.length > 0) {
        for (const table of tables) {
          try {
            const { data } = await supabaseClient.from(table.name).select("*").limit(10);
            if (data && data.length > 0) {
              tableDataCache[table.name] = data;
            }
          } catch (e) {
            console.error(`Error fetching table ${table.name}:`, e);
          }
        }
      }

      // Generate mock data for each list
      for (const w of listWidgets) {
        // Simple heuristic: if we have table data, assign it to the first lists
        const availableTables = Object.keys(tableDataCache);
        if (availableTables.length > 0) {
          // Just pick a table for now (in a real app, this would use data bindings)
          const randomTable = availableTables[Math.floor(Math.random() * availableTables.length)];
          if (tableDataCache[randomTable].length >= 3) {
            newData[w.key] = tableDataCache[randomTable].slice(0, 5);
            continue;
          }
        }

        // Fallback: Generate fake data rows
        newData[w.key] = [
          { id: 1, title: "Item 1", subtitle: "Description for item 1", price: "$10", time: "10:00 AM", status: "Active" },
          { id: 2, title: "Item 2", subtitle: "Description for item 2", price: "$20", time: "11:30 AM", status: "Pending" },
          { id: 3, title: "Item 3", subtitle: "Description for item 3", price: "$30", time: "2:00 PM", status: "Completed" },
          { id: 4, title: "Item 4", subtitle: "Description for item 4", price: "$40", time: "4:15 PM", status: "Active" },
          { id: 5, title: "Item 5", subtitle: "Description for item 5", price: "$50", time: "6:45 PM", status: "Draft" },
        ];
      }

      if (mounted) {
        setTestData(newData);
        setLoading(false);
      }
    };

    generateData();

    return () => {
      mounted = false;
    };
  }, [spec, supabaseClient, schemaPlan]);

  return { testData, loading };
}
