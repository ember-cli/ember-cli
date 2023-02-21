'use strict';

module.exports = {
  root: true,
  parser: '<%= typescript ? '@typescript-eslint/parser' : '@babel/eslint-parser' %>',
  parserOptions: {
    ecmaVersion: 'latest',<% if (!typescript) { %>
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      plugins: [
        ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
      ],
    },<% } %>
  },
  plugins: ['ember'<% if (typescript) { %>, '@typescript-eslint'<% } %>],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
  },
  rules: {},
  overrides: [
<% if (typescript) { %>    // ts files
    {
      files: ['**/*.ts'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {},
    },
<% } %>    // node files
    {
      files: [
        './.eslintrc.js',
        './.prettierrc.js',
        './.stylelintrc.js',
        './.template-lintrc.js',
        './ember-cli-build.js',<% if (blueprint !== 'app') { %>
        './index.js',<% } %>
        './testem.js',
        './blueprints/*/index.js',
        './config/**/*.js',<% if (blueprint === 'app') { %>
        './lib/*/index.js',
        './server/**/*.js',<% } else { %>
        './tests/dummy/config/**/*.js',<% } %>
      ],
<% if (!typescript) { %>      parserOptions: {
        sourceType: 'script',
      },
<% } %>      env: {
        browser: false,
        node: true,
      },
      extends: ['plugin:n/recommended'],
    },
    {
      // test files
      files: ['tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended'],
    },
  ],
};
