// eslint.config.mjs
import * as tseslint from 'typescript-eslint';
import eslintPluginNest from '@darraghor/eslint-plugin-nestjs-typed';
import globals from 'globals';
import parser from '@typescript-eslint/parser';


export default tseslint.config(
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parser,
      parserOptions: {
        project: [new URL('./tsconfig.json', import.meta.url).pathname],
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  eslintPluginNest.configs.flatRecommended
);
