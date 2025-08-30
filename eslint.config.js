//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import eslintPluginImportX from "eslint-plugin-import-x";

export default [
  ...tanstackConfig,
  {
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      import: eslintPluginImportX,
    },
    rules: {
      "@typescript-eslint/array-type": [
        "error",
        {
          default: "array-simple", // Allows T[]
        },
      ],
      "import/order": "warn",
      "sort-imports": "warn",
    },
  },
];
