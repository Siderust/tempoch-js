const js = require('@eslint/js');
const globals = require('globals');

const baseRules = {
  ...js.configs.recommended.rules,
  'no-console': 'off',
};

module.exports = [
  {
    ignores: ['coverage/**', 'node_modules/**', 'target/**', '*.d.ts', '*.node', 'index.js'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: baseRules,
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: baseRules,
  },
];
