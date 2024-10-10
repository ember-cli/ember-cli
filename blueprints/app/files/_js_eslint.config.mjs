import globals from 'globals';
import js from '@eslint/js';

import ember from 'eslint-plugin-ember';
import emberRecommended from 'eslint-plugin-ember/configs/recommended';
import gjsRecommended from 'eslint-plugin-ember/configs/recommended-gjs';

import prettier from 'eslint-plugin-prettier/recommended';
import qunit from 'eslint-plugin-qunit';
import n from 'eslint-plugin-n';

import emberParser from 'ember-eslint-parser';
import babelParser from '@babel/eslint-parser';

const esmParserOptions = {
  ecmaFeatures: { modules: true },
  ecmaVersion: 'latest',
};

export default [
  js.configs.recommended,
  prettier,
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '!**/.*'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
      parserOptions: esmParserOptions,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      ember,
    },
    rules: {
      ...emberRecommended.rules,
      ...gjsRecommended.rules,
    },
  },
  {
    files: ['**/*.gjs'],
    languageOptions: {
      parser: emberParser,
      parserOptions: esmParserOptions,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      ember,
    },
    rules: {
      ...emberRecommended.rules,
      ...gjsRecommended.rules,
    },
  },
  {
    files: ['tests/**/*-test.{js,gjs}'],
    plugins: {
      qunit,
    },
  },
  /**
   * CJS node files
   */
  {
    files: [
      '**/*.cjs',
      'config/**/*.js',
      'testem.js',
      'testem*.js',
      '.prettierrc.js',
      '.stylelintrc.js',
      '.template-lintrc.js',
      'ember-cli-build.js',
    ],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },
  /**
   * ESM node files
   */
  {
    files: ['*.mjs'],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: esmParserOptions,
      globals: {
        ...globals.node,
      },
    },
  },
];
