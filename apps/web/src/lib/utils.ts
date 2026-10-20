/**
 * Shared utility functions for Wiraflow
 */

/**
 * Safely extracts a string from a potentially wrapped AI DSL object.
 * Handles:
 * - Direct strings: "hello" -> "hello"
 * - Wrapped strings: { stringVal: { value: "hello" } } -> "hello"
 * - Fallback for null/undefined/other types.
 */
export const readStr = (val: any, fallback = ""): string => {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && val.stringVal && typeof val.stringVal.value === "string") {
    return val.stringVal.value;
  }
  return fallback;
};
