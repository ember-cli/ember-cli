import globals from 'globals';
import js from '@eslint/js';

import ts from 'typescript-eslint';

import ember from 'eslint-plugin-ember/recommended'

import prettier from 'eslint-plugin-prettier/recommended';
import qunit from 'eslint-plugin-qunit';
import n from 'eslint-plugin-n';

import babelParser from '@babel/eslint-parser';

const parserOptions = {
  esm: {
    js: {
      ecmaFeatures: { modules: true },
      ecmaVersion: 'latest',
      requireConfigFile: false,
      babelOptions: {
        plugins: [
          [
            '@babel/plugin-proposal-decorators',
            { decoratorsBeforeExport: true },
          ],
        ],
      },
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
  gjs,
  gts,
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
      ember: ember.plugin,
    },
    rules: {
      ...ember.base.rules,
    },
  },
  {
    files: ['**/*.ts'],
    plugins: { ember: ember.plugin },
    languageOptions: {
      parserOptions: parserOptions.esm.ts,
    },
    extends: [...ts.configs.strictTypeChecked, ...ember.base],
  },
  {
    files: ['**/*.gjs'],
    languageOptions: {
      parserOptions: parserOptions.esm.js,
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.gts'],
    plugins: { ember: ember.plugin },
    languageOptions: {
      parserOptions: parserOptions.esm.ts,
    },
    extends: [
      ...ts.configs.strictTypeChecked,
      ...ember.gts,,
    ],
  },
  {
    files: ['tests/**/*-test.{js,gjs,ts,gts}'],
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
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '!**/.*'],
  },
);
