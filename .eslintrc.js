'use strict';

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ['node', 'prettier'],
  extends: ['eslint:recommended', 'plugin:node/recommended', 'plugin:prettier/recommended'],
  env: {
    browser: false,
    node: true,
    es6: true,
  },
  globals: {},
  rules: {
    /*** Possible Errors ***/

    'no-console': 'off',
    'no-template-curly-in-string': 'error',
    'no-unsafe-negation': 'error',

    /*** Best Practices ***/

    curly: 'error',
    eqeqeq: 'error',
    'guard-for-in': 'off',
    'no-caller': 'error',
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-new': 'off',
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],
    'wrap-iife': 'off',
    yoda: 'error',

    /*** Strict Mode ***/

    strict: ['error', 'global'],

    /*** Variables ***/

    'no-undef': 'error',
    'no-unused-vars': 'error',
    'no-use-before-define': ['error', 'nofunc'],

    /*** Stylistic Issues ***/

    camelcase: 'error',
    'new-cap': ['error', { properties: false }],
    'no-array-constructor': 'error',
    'no-bitwise': 'error',
    'no-lonely-if': 'error',
    'no-plusplus': 'off',
    'no-unneeded-ternary': 'error',

    /*** ECMAScript 6 ***/

    'no-useless-computed-key': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'symbol-description': 'error',
  },
};
