// eslint.config.js
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint', '@darraghor/nestjs-typed'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/strict-type-checked',
      'plugin:@typescript-eslint/stylistic-type-checked',
      'plugin:@darraghor/nestjs-typed/recommended',
      'prettier',
    ],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
    ignorePatterns: ['dist/', 'node_modules/'],
  };
  