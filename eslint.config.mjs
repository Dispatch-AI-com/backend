// eslint.config.mjs
// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint, { parser } from "typescript-eslint";
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
    plugins: { 
      prettier, 
      "simple-import-sort": importSort,
    },
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

  /* ---------- 测试文件块 ---------- */
  {
    files: ["test/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: ["./tsconfig.test.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { prettier, "simple-import-sort": importSort },
    rules: {
      /* 代码风格 / 质量 */
      "prettier/prettier": "error",
      "no-console": "off", // Allow console in tests
      "no-debugger": "error",

      /* TypeScript 规则（宽松版本） */
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/member-ordering": "off",

      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",

      /* Disable type-aware rules for test files */
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-array-delete": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/prefer-readonly": "off",
      "@typescript-eslint/prefer-readonly-parameter-types": "off",
      "@typescript-eslint/prefer-reduce-type-parameter": "off",
      "@typescript-eslint/prefer-string-starts-ends-with": "off",
      "@typescript-eslint/require-array-sort-compare": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-import-type-side-effects": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "@typescript-eslint/no-unsafe-unary-negation": "off",
      "@typescript-eslint/prefer-function-type": "off",
      "@typescript-eslint/prefer-ts-expect-error": "off",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-implied-eval": "off",
      "@typescript-eslint/no-meaningless-void-operator": "off",
      "@typescript-eslint/no-misused-spread": "off",
      "@typescript-eslint/no-mixed-enums": "off",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/no-unnecessary-template-expression": "off",
      "@typescript-eslint/no-unnecessary-type-arguments": "off",
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "off",
      "@typescript-eslint/prefer-return-this-type": "off",
      "@typescript-eslint/related-getter-setter-pairs": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/return-await": "off",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@typescript-eslint/prefer-find": "off",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@darraghor/nestjs-typed/api-enum-property-best-practices": "off",
      "@darraghor/nestjs-typed/api-property-matches-property-optionality": "off",

      /* --- 导入排序规则 --- */
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

);
