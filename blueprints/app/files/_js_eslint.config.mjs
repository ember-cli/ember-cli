/**
 * https://eslint.org/docs/latest/use/configure
 *
 * To understand what your configuration is doing and which files it applies to:
 *
 *   npx eslint --inspect-config
 */
import babelEslintParser from '@babel/eslint-parser';
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginEmber from 'eslint-plugin-ember/recommended';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginQunit from 'eslint-plugin-qunit';
import globals from 'globals';

const parserOptionsJs = {
  babelOptions: {
    plugins: [
      [
        '@babel/plugin-proposal-decorators',
        {
          decoratorsBeforeExport: true,
        },
      ],
    ],
  },
  ecmaFeatures: {
    modules: true,
  },
  ecmaVersion: 'latest',
  requireConfigFile: false,
};

export default [
  eslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginEmber.configs.base,
  eslintPluginEmber.configs.gjs,

  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '!**/.*'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // Ember files
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelEslintParser,
    },
  },
  {
    files: ['**/*.{js,gjs}'],
    languageOptions: {
      parserOptions: parserOptionsJs,
      globals: globals.browser,
    },
  },

  // Test files
  {
    ...eslintPluginQunit.configs.recommended,
    files: ['tests/**/*-test.{js,gjs}'],
    plugins: {
      qunit: eslintPluginQunit,
    },
  },

  // Configuration files
  {
    ...eslintPluginN.configs['flat/recommended-script'],
    files: [
      '**/*.cjs',
      'config/**/*.js',
      'tests/dummy/config/**/*.js',
      'testem.js',
      'testem*.js',
      'index.js',
      '.prettierrc.js',
      '.stylelintrc.js',
      '.template-lintrc.js',
      'ember-cli-build.js',
    ],
    plugins: {
      n: eslintPluginN,
    },
    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: globals.node,
    },
  },
  {
    ...eslintPluginN.configs['flat/recommended-module'],
    files: ['**/*.mjs'],
    plugins: {
      n: eslintPluginN,
    },
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: parserOptionsJs,
      globals: globals.node,
    },
    rules: {
      'n/no-extraneous-import': 'warn',
    },
  },
];
