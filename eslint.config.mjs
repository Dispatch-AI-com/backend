import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";
import path from "node:path";

const projectRoot = path.resolve();

export default [
  js.configs.recommended,

  {
    ignores: ["eslint.config.mjs", "dist", "node_modules"],
  },

  {
    files: ["src/**/*.ts"],
    plugins: {
      "@typescript-eslint": tseslintPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: [`${projectRoot}/tsconfig.json`],
        tsconfigRootDir: projectRoot,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Type-aware rules
      ...tseslint.configs.recommendedTypeChecked[0].rules,
      ...tseslint.configs.recommendedTypeChecked[1].rules,

      // TypeScript best practices
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/member-ordering": "error",
      "@typescript-eslint/return-await": "error",

      // 新规则取代 ban-types
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            object: {
              message: "Use Record<string, unknown> or a custom interface instead.",
            },
          },
        },
      ],

      // 命名规范
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],

      // Prettier integration
      "prettier/prettier": "error",

      // General JS safety
      "no-console": "error",
      "no-undef": "error",
      "no-empty-function": "error",
    },
  },
];
