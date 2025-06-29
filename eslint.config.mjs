// eslint.config.mjs
// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint, { parser } from "typescript-eslint";
import nestjsTyped from "@darraghor/eslint-plugin-nestjs-typed";
import prettier from "eslint-plugin-prettier";
import importSort from "eslint-plugin-simple-import-sort";   // newly added
import jestPlugin from "eslint-plugin-jest";                 // newly added
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export default tseslint.config(
  /* Basic recommended + type‑aware recommended */
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  /* ---------- Main code block ---------- */
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
      parser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
      },
    },
    plugins: { prettier, "simple-import-sort": importSort }, // register import sort
    rules: {
      /* Code style / Quality */
      "prettier/prettier": "error",
      "no-console": "warn",
      "no-debugger": "error",

      /* TypeScript rules (unchanged) */
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/return-await": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/strict-boolean-expressions": "warn",
      "@typescript-eslint/member-ordering": "warn",

      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",

      "@typescript-eslint/await-thenable": "off",

      /* --- New import sort rules --- */
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

  /* ---------- Jest test file block ---------- */
  {
    files: ["tests/**/*.spec.ts", "**/*.test.ts"],
    plugins: { jest: jestPlugin },
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      "jest/no-disabled-tests": "warn",
      "jest/expect-expect": "warn",
    },
  },

  /* Disable false positive for empty Nest module classes */
  {
    files: ["src/**/*.module.ts"],
    rules: { "@typescript-eslint/no-extraneous-class": "off" },
  },

  /* Official recommendation for NestJS‑typed */
  nestjsTyped.configs.flatRecommended
);
