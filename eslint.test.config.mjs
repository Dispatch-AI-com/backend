// eslint.test.config.mjs
// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint, { parser } from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import jestPlugin from "eslint-plugin-jest";

export default tseslint.config(
  /* 基础推荐 */
  eslint.configs.recommended,
  tseslint.configs.recommended,

  /* ---------- Test 文件配置 ---------- */
  {
    files: ["test/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
      parser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { prettier, jest: jestPlugin },
    rules: {
      /* 代码风格 */
      "prettier/prettier": "error",
      "no-console": "warn",
      "no-debugger": "error",

      /* Jest 规则 */
      "jest/no-disabled-tests": "warn",
      "jest/expect-expect": "warn",

      /* 关闭严格的 TypeScript 规则，因为测试文件经常需要使用 any */
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/return-await": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/member-ordering": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@darraghor/nestjs-typed/should-specify-forbid-unknown-values": "off",
    },
  },
);
