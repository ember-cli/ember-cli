'use strict';

const path = require('path');

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    'ember'
  ],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended'
  ],
  env: {
    browser: true
  },
  rules: {
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'index.js',
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js'
      ],
      parserOptions: {
        sourceType: 'script'
      },
      env: {
        browser: false,
        node: true
      },
      plugins: ['node'],
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        // add your custom rules and overrides for node files here

        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'node/no-unpublished-require': 'off'
      })
    },

    {
      files: ['vendor/**/*.js'],
      parserOptions: {
        ecmaVersion: 5,
        sourceType: 'script'
      },
      env: {
        amd: true
      },
      globals: {
        Ember: 'readonly'
      },
      rules: Object.keys(Object.assign({},
        // eslint-disable-next-line node/no-extraneous-require
        require(path.resolve(path.dirname(require.resolve('eslint')), '../conf/eslint-recommended')).rules,
        require('eslint-plugin-ember').configs.recommended.rules
      )).reduce((rules, rule) => {
        rules[rule] = 'off';
        return rules;
      }, {})
    }
  ]
};
