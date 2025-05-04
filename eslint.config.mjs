// eslint.config.mjs  —— balanced
// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint, { parser } from "typescript-eslint";
import nestjsTyped from "@darraghor/eslint-plugin-nestjs-typed";
import prettier from "eslint-plugin-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
      parser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { prettier },
    rules: {
      "prettier/prettier": "error",
      "no-console": "warn", 
      "no-debugger": "error",

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
    },
  },

  {
    files: ["src/**/*.module.ts"],
    rules: { "@typescript-eslint/no-extraneous-class": "off" },
  },

  nestjsTyped.configs.flatRecommended
);
