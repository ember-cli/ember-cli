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
        'ember-cli-build.js',<% if (blueprint !== 'app') { %>
        'index.js',<% } %>
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js'<% if (blueprint === 'app') { %>,
        'lib/*/index.js',
        'server/**/*.js'<% } else { %>,
        'tests/dummy/config/**/*.js'<% } %>
      ],<% if (blueprint !== 'app') { %>
      excludedFiles: [
        'addon/**',
        'addon-test-support/**',
        'app/**',
        'tests/dummy/app/**'
      ],<% } %>
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
      env: {
        browser: false,
        node: true
      },
      plugins: ['node'],
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        // add your custom rules and overrides for node files here<% if (blueprint === 'app') { %>

        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'node/no-unpublished-require': 'off'<% } %>
      })
    }
  ]
};
