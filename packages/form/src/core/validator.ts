import type { Schema, SchemaDefinition, SchemaValue } from "./schema.js";

export interface Validator {
  isValid(
    schema: SchemaDefinition,
    rootSchema: Schema,
    formData: SchemaValue | undefined
  ): boolean;
  reset(): void;
}
