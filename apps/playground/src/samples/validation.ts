import type { ErrorObject } from "ajv";
import {
  ValidatorErrorType,
  type Schema,
  type SchemaValue,
  type ValidatorError,
} from "@sjsf/form";
import { AjvValidator } from "@sjsf/ajv8-validator";

import type { Sample } from "./Sample";

function customValidate(value: SchemaValue | undefined): ValidatorError<ErrorObject>[] {
  const { pass1, pass2 } = value as {
    pass1: string;
    pass2: string;
  };
  if (pass1 !== pass2) {
    return [
      {
        type: ValidatorErrorType.ValidationError,
        error: {} as ErrorObject,
        instanceId: "root_pass2",
        propertyTitle: "Repeat password",
        message: "Passwords don't match.",
      },
    ];
  }
  return [];
}

class CustomAjvValidator extends AjvValidator {
  override validateFormData(
    schema: Schema,
    formData: SchemaValue | undefined
  ): ValidatorError<ErrorObject>[] {
    const errors = super.validateFormData(schema, formData).map((error) => {
      if (error.type === ValidatorErrorType.SchemaError) {
        return error;
      }
      if (
        error.error.keyword === "minimum" &&
        error.error.schemaPath === "#/properties/age/minimum"
      ) {
        return Object.assign({}, error, {
          message: "You need to be 18 because of some legal thing",
        });
      }
      return error;
    });
    return errors.concat(customValidate(formData))
  }
}

const validation: Sample = {
  status: "perfect",
  schema: {
    title: "Custom validation",
    description:
      "This form defines custom validation rules checking that the two passwords match. There is also a custom validation message when submitting an age < 18, which can only be seen if HTML5 validation is turned off.",
    type: "object",
    properties: {
      pass1: {
        title: "Password",
        type: "string",
        minLength: 3,
      },
      pass2: {
        title: "Repeat password",
        type: "string",
        minLength: 3,
      },
      age: {
        title: "Age",
        type: "number",
        minimum: 18,
      },
    },
  },
  uiSchema: {
    pass1: { "ui:options": { input: { type: "password" } } },
    pass2: { "ui:options": { input: { type: "password" } } },
  },
  formData: {},
  Validator: CustomAjvValidator,
};

export default validation;
