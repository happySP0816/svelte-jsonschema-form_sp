import {
  ADDITIONAL_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  CONTAINS_KEY,
  DEFINITIONS_KEY,
  DEFS_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  IF_KEY,
  ITEMS_KEY,
  NOT_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  PROPERTY_NAMES_KEY,
  REQUIRED_KEY,
  THEN_KEY,
  type Schema,
  type SchemaDefinition,
  type SchemaObjectValue,
} from "./schema";
import { isSchemaObjectValue } from "./value";

const SUB_SCHEMAS = [
  // ITEMS_KEY,
  ADDITIONAL_ITEMS_KEY,
  CONTAINS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  PROPERTY_NAMES_KEY,
  IF_KEY,
  THEN_KEY,
  ELSE_KEY,
  NOT_KEY,
] as const;

const RECORDS_OF_SUB_SCHEMAS = [
  DEFS_KEY,
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  // DEPENDENCIES_KEY,
  DEFINITIONS_KEY,
] as const;

const ARRAYS_OF_SUB_SCHEMAS = [
  ALL_OF_KEY,
  ANY_OF_KEY,
  ONE_OF_KEY,
  // ITEMS_KEY,
] as const;

function mergeRecords<T>(
  left: Record<string, T>,
  right: Record<string, T>,
  merge: (l: T, r: T) => T
) {
  const target = Object.assign({}, left);
  for (const [key, value] of Object.entries(right)) {
    if (!(key in left)) {
      target[key] = value;
      continue;
    }
    target[key] = merge(left[key], value);
  }
  return target;
}

function mergeArrays<T>(left: T[], right: T[], unique = false) {
  const merged = left.concat(right);
  return unique ? Array.from(new Set(merged)) : merged;
}

function mergeSchemaDefinitions(
  left: SchemaDefinition,
  right: SchemaDefinition
) {
  if (typeof left === "boolean" || typeof right === "boolean") {
    return right;
  }
  return mergeSchemas(left, right);
}

function mergeSchemaDependencies(
  left: SchemaDefinition | string[],
  right: SchemaDefinition | string[]
) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return right;
  }
  return mergeSchemaDefinitions(left, right);
}

export function mergeSchemas(left: Schema, right: Schema): Schema {
  const merged = Object.assign({}, left, right);
  for (const key of RECORDS_OF_SUB_SCHEMAS) {
    if (!(key in merged)) {
      continue;
    }
    const l = left[key];
    const r = right[key];
    if (l && r) {
      merged[key] = mergeRecords(l, r, mergeSchemaDefinitions);
    }
  }
  if (left[ITEMS_KEY] && right[ITEMS_KEY]) {
    merged[ITEMS_KEY] =
      isSchemaObjectValue(left[ITEMS_KEY]) &&
      isSchemaObjectValue(right[ITEMS_KEY])
        ? mergeSchemas(left[ITEMS_KEY], right[ITEMS_KEY])
        : right[ITEMS_KEY];
  }
  if (left[DEPENDENCIES_KEY] && right[DEPENDENCIES_KEY]) {
    merged[DEPENDENCIES_KEY] = mergeRecords(
      left[DEPENDENCIES_KEY],
      right[DEPENDENCIES_KEY],
      mergeSchemaDependencies
    );
  }
  for (const key of SUB_SCHEMAS) {
    if (!(key in merged)) {
      continue;
    }
    const l = left[key];
    const r = right[key];
    if (l && r) {
      merged[key] = mergeSchemaDefinitions(l, r);
    }
  }
  for (const key of ARRAYS_OF_SUB_SCHEMAS) {
    if (!(key in merged)) {
      continue;
    }
    const l = left[key];
    const r = right[key];
    if (l && r) {
      merged[key] = l.concat(r);
    }
  }
  if (left[REQUIRED_KEY] && right[REQUIRED_KEY]) {
    merged[REQUIRED_KEY] = mergeArrays(
      left[REQUIRED_KEY],
      right[REQUIRED_KEY],
      true
    );
  }
  return merged;
}

export function mergeDefaultsWithFormData<T = any>(
  defaults?: T,
  formData?: T,
  mergeExtraArrayDefaults = false
): T | undefined {
  if (Array.isArray(formData)) {
    const defaultsArray = Array.isArray(defaults) ? defaults : [];
    const mapped = formData.map((value, idx) => {
      if (defaultsArray[idx]) {
        return mergeDefaultsWithFormData<any>(
          defaultsArray[idx],
          value,
          mergeExtraArrayDefaults
        );
      }
      return value;
    });
    // Merge any extra defaults when mergeExtraArrayDefaults is true
    if (mergeExtraArrayDefaults && mapped.length < defaultsArray.length) {
      mapped.push(...defaultsArray.slice(mapped.length));
    }
    return mapped as unknown as T;
  }
  if (isSchemaObjectValue(formData)) {
    const acc: { [key in keyof T]: any } = Object.assign({}, defaults); // Prevent mutation of source object.
    const defaultsAsObject = isSchemaObjectValue(defaults)
      ? defaults
      : undefined;
    for (const [key, value] of Object.entries(formData)) {
      acc[key as keyof T] = mergeDefaultsWithFormData(
        defaultsAsObject?.[key],
        value,
        mergeExtraArrayDefaults
      );
    }
    return acc;
  }
  return formData;
}

export function mergeSchemaObjects<
  A extends SchemaObjectValue,
  B extends SchemaObjectValue
>(obj1: A, obj2: B, concatArrays: boolean | "preventDuplicates" = false) {
  const acc: SchemaObjectValue = Object.assign({}, obj1);
  for (const [key, right] of Object.entries(obj2)) {
    const left = obj1 ? obj1[key] : {};
    if (isSchemaObjectValue(left) && isSchemaObjectValue(right)) {
      acc[key] = mergeSchemaObjects(left, right, concatArrays);
    } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
      acc[key] = left.concat(
        concatArrays === "preventDuplicates"
          ? right.filter((v) => !left.includes(v))
          : right
      );
    } else {
      acc[key] = right;
    }
  }
  return acc as A & B;
}