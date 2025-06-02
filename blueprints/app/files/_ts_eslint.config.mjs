/**
 * Debugging:
 *   https://eslint.org/docs/latest/use/configure/debug
 *  ----------------------------------------------------
 *
 *   Print a file's calculated configuration
 *
 *     npx eslint --print-config path/to/file.js
 *
 *   Inspecting the config
 *
 *     npx eslint --inspect-config
 *
 */
import globals from 'globals';
import eslint from '@eslint/js';

import tseslint from 'typescript-eslint';

import eslintPluginEmber from 'eslint-plugin-ember/recommended';

import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginQunit from 'eslint-plugin-qunit';
import eslintPluginN from 'eslint-plugin-n';

import babelEslintParser from '@babel/eslint-parser';

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

export default tseslint.config(
  eslint.configs.recommended,
  eslintPluginEmber.configs.base,
  eslintPluginEmber.configs.gjs,
  eslintPluginEmber.configs.gts,
  eslintConfigPrettier,
  /**
   * Ignores must be in their own object
   * https://eslint.org/docs/latest/use/configure/ignore
   */
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '!**/.*'],
  },
  /**
   * https://eslint.org/docs/latest/use/configure/configuration-files#configuring-linter-options
   */
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelEslintParser,
    },
  },
  {
    files: ['**/*.{js,gjs}'],
    languageOptions: {
      parserOptions: parserOptions.esm.js,
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.{ts,gts}'],
    languageOptions: {
      parser: eslintPluginEmber.parser,
      parserOptions: parserOptions.esm.ts,
    },
    extends: [...tseslint.configs.recommendedTypeChecked, eslintPluginEmber.configs.gts],
  },
  {
    ...eslintPluginQunit.configs.recommended,
    files: ['tests/**/*-test.{js,gjs,ts,gts}'],
    plugins: {
      qunit: eslintPluginQunit,
    },
  },
  /**
   * CJS node files
   */
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
      globals: {
        ...globals.node,
      },
    },
  },
  /**
   * ESM node files
   */
  {
    ...eslintPluginN.configs['flat/recommended-module'],
    files: ['**/*.mjs'],
    plugins: {
      n: eslintPluginN,
    },
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: parserOptions.esm.js,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'n/no-extraneous-import': 'warn',
      'n/no-unsupported-features/node-builtins': 'warn',
    },
  },
);
