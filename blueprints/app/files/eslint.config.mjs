<% if (!typescript) { %>import babelEslintParser from '@babel/eslint-parser';
<% } %>import eslint from '@eslint/js';
import pluginEmberRecommended from 'eslint-plugin-ember/configs/recommended';
import pluginNode from 'eslint-plugin-n';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginQunitRecommended from 'eslint-plugin-qunit/configs/recommended';
<% if (typescript) { %>import typescriptEslint from 'typescript-eslint';
<% } else { %>import globals from 'globals';
<% } %>
/** @type {import('eslint').Linter.FlatConfig[]} */
export default [<% if (!typescript) { %>
  // Babel:
  {
    languageOptions: {
      globals: globals.browser,
      parser: babelEslintParser,
      parserOptions: {
        babelOptions: {
          plugins: [
            [
              '@babel/plugin-proposal-decorators',
              { decoratorsBeforeExport: true },
            ],
          ],
        },
        ecmaVersion: 'latest',
        requireConfigFile: false,
        sourceType: 'module',
      },
    },
  },
<% } %>
  // ESLint:
  eslint.configs.recommended,

  // Ember:
  ...pluginEmberRecommended,
<% if (typescript) { %>
  // TypeScript:
  ...typescriptEslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
<% } %>
  // Node:
  {
    ...pluginNode.configs['flat/recommended-script'],
    files: [
      'blueprints/*/index.js',
      'config/**/*.js',
      'lib/*/index.js',
      'server/**/*.js',
      '*.js',
    ],
  },
  {
    ...pluginNode.configs['flat/recommended-module'],
    files: ['*.mjs'],
  },

  // Qunit:
  {
    ...pluginQunitRecommended,
    files: ['tests/**/*-test.{js,ts}'],
  },

  // Prettier:
  pluginPrettierRecommended,
];
