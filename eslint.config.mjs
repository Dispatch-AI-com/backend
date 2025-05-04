import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";
import path from "node:path";

const projectRoot = path.resolve();

export default defineConfig([
  {
    ignores: ["eslint.config.mjs", "dist", "node_modules"],
  },

  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: [`${projectRoot}/tsconfig.json`],
        tsconfigRootDir: projectRoot,
      },
      globals: globals.browser,
    },
    rules: {
      ...(config.rules ?? {}),
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
    },
  })),

  {
    name: "prettier/rules",
    files: ["src/**/*.ts"],
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "error",
    },
  },

  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);
