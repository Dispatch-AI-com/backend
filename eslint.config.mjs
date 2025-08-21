// eslint.config.mjs
// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint, { parser } from "typescript-eslint";
import nestjsTyped from "@darraghor/eslint-plugin-nestjs-typed";
import prettier from "eslint-plugin-prettier";
import importSort from "eslint-plugin-simple-import-sort";   // ← 新增

export default tseslint.config(
  /* 基础推荐 + type‑aware 推荐 */
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  /* ---------- 主代码块 ---------- */
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
    plugins: { prettier, "simple-import-sort": importSort }, // ← 注册导入排序
    rules: {
      /* 代码风格 / 质量 */
      "prettier/prettier": "error",
      "no-console": "warn",
      "no-debugger": "error",

      /* TypeScript 规则（保持不变） */
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

      /* --- 新增导入排序规则 --- */
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },



  /* 关闭 Nest 模块空壳类误报 */
  {
    files: ["src/**/*.module.ts"],
    rules: { "@typescript-eslint/no-extraneous-class": "off" },
  },

  /* NestJS‑typed 官方推荐 */
  nestjsTyped.configs.flatRecommended
);
