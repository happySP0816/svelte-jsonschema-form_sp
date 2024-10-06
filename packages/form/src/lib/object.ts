import type { AnyKey, ValuesOf } from "./types";

export type ObjectOf<T> = Record<AnyKey, T>;

export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function isRecord<T>(value: unknown): value is Record<AnyKey, T> {
  return isObject(value) && !Array.isArray(value);
}

export type PropertyPath = AnyKey[];

export function getValueByPath<T, D extends number = 3>(
  from: T,
  key: PropertyPath,
  defaultValue?: ValuesOf<T, D>
): ValuesOf<T, D> | undefined {
  let result = from as unknown;
  for (const k of key) {
    if (
      Array.isArray(result) &&
      typeof k === "number" &&
      k >= 0 &&
      k < result.length
    ) {
      result = result[k];
      continue;
    } else if (isRecord(result) && k in result) {
      result = result[k];
      continue;
    }
    return defaultValue;
  }
  return result as ValuesOf<T, D>;
}
