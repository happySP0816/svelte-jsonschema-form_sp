import type { Schema, SchemaType } from "./schema.js";

export function typeOfValue(
  value: null | boolean | number | string | object
): SchemaType {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  const type = typeof value;
  switch (type) {
    case "boolean":
    // TODO: Integer type inference ?
    case "number":
    case "object":
    case "string":
      return type;
    default:
      throw new Error(`Unsupported schema type: ${type}`);
  }
}

export function typeOfSchema(schema: Schema): SchemaType | SchemaType[] {
  if (schema.type) {
    return schema.type;
  }
  if (schema.const !== undefined) {
    return typeOfValue(schema.const);
  }
  if (schema.properties || schema.additionalProperties) {
    return "object";
  }
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return Array.from(new Set(schema.enum.map(typeOfValue)));
  }
  return "null";
}

export function isSchemaNullable(schema: Schema): boolean {
  const type = typeOfSchema(schema);
  return type === "null" || (Array.isArray(type) && type.includes("null"));
}

export function pickSchemaType(types: SchemaType[]): SchemaType {
  if (types.length === 0) {
    throw new Error(`Unsupported schema types: empty type array`);
  }
  const first = types[0]!;
  if (types.length === 1) {
    return first;
  }
  if (first === "null") {
    return types[1]!;
  }
  return first;
}

export const getSimpleSchemaType = (schema: Schema): SchemaType => {
  const type = typeOfSchema(schema);
  return Array.isArray(type) ? pickSchemaType(type) : type;
};
