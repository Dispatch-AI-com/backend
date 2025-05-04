// eslint.config.mjs  —— 100% 可运行版本
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
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "no-console": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "error",
    },
  },

  {
    files: ["src/**/*.module.ts"],
    rules: { "@typescript-eslint/no-extraneous-class": "off" },
  },

  nestjsTyped.configs.flatRecommended
);
