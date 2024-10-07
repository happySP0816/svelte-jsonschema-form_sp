import type { Sample } from "./Sample";

import { GeoField, CustomLayout } from "./components";

const custom: Sample = {
  status: "perfect",
  schema: {
    title: "Custom components",
    type: "object",
    properties: {
      field: {
        title: "Custom field",
        type: "object",
        required: ["lat", "lon"],
        properties: {
          lat: {
            type: "number",
          },
          lon: {
            type: "number",
          },
        },
      },
      layout: {
        title: "Array with custom layout",
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },
  uiSchema: {
    field: {
      "ui:field": GeoField,
    },
    layout: {
      "ui:components": {
        layout: CustomLayout,
      },
    },
  },
  formData: {
    field: {
      lat: 0,
      lon: 0,
    },
    layout: ["svelte", "jsonschema", "form", "array", "of", "strings"],
  },
};

export default custom;
