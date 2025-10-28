// @ts-check
import { tanstackConfig } from "@tanstack/eslint-config";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import eslintPluginImportX from "eslint-plugin-import-x";
import eslintReactHooks from "eslint-plugin-react-hooks";

export default [
  ...tanstackConfig,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/generated/**"],
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      import: eslintPluginImportX,
      "react-hooks": eslintReactHooks,
    },
    rules: {
      /**
       * Custom rule to ensure useLiveQuery includes a dependency array.
       * This helps prevent bugs related to collections changing without re-running the query.
       */
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.name='useLiveQuery'][arguments.length<2]",
          message: "useLiveQuery must include a dependency array.",
        },
      ],
      /**
       * Warn if useLiveQuery is missing dependencies in its dependency array.
       * This is similar to the built-in react-hooks/exhaustive-deps rule but
       * extended to cover useLiveQuery.
       */
      "react-hooks/exhaustive-deps": [
        "warn",
        {
          additionalHooks: "useLiveQuery",
        },
      ],
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
