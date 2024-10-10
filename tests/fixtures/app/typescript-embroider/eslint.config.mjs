import globals from 'globals';
import js from '@eslint/js';

import ts from 'typescript-eslint';

import ember from 'eslint-plugin-ember';
import emberRecommended from 'eslint-plugin-ember/configs/recommended';
import gjsRecommended from 'eslint-plugin-ember/configs/recommended-gjs';
import gtsRecommended from 'eslint-plugin-ember/configs/recommended-gts';

import prettier from 'eslint-plugin-prettier/recommended';
import qunit from 'eslint-plugin-qunit';
import n from 'eslint-plugin-n';

import emberParser from 'ember-eslint-parser';
import babelParser from '@babel/eslint-parser';

const parserOptions = {
  esm: {
    js: {
      ecmaFeatures: { modules: true },
      ecmaVersion: 'latest',
    },
    ts: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
};

export default ts.config(
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
      parserOptions: parserOptions.esm.js,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      ember,
    },
    rules: {
      ...emberRecommended.rules,
    },
  },
  {
    files: ['**/*.ts'],
    plugins: { ember },
    languageOptions: {
      parserOptions: parserOptions.esm.ts,
    },
    extends: [...ts.configs.strictTypeChecked, ...emberRecommended],
  },
  {
    files: ['**/*.gjs'],
    languageOptions: {
      parser: emberParser,
      parserOptions: parserOptions.esm.js,
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
    files: ['**/*.gts'],
    plugins: { ember },
    languageOptions: {
      parserOptions: parserOptions.esm.ts,
    },
    extends: [...ts.configs.strictTypeChecked, ...emberRecommended, ...gtsRecommended],
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
      parserOptions: parserOptions.esm.js,
      globals: {
        ...globals.node,
      },
    },
  },
  /**
   * Settings
   */
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '!**/.*'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  }
);
