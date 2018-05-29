module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
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
        'ember-cli-build.js',<% if (blueprint !== 'app') { %>
        'index.js',<% } %>
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js'<% if (blueprint === 'app') { %>,
        'lib/*/index.js'<% } %><% if (blueprint !== 'app') { %>,
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
      }<% if (blueprint !== 'app') { %>,
      plugins: ['node'],
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        // add your custom rules and overrides for node files here
      })<% } %>
    },

    // test files
    {
      files: ['tests/**/*.js']<% if (blueprint !== 'app') { %>,
      excludedFiles: ['tests/dummy/**']<% } %>,
      rules: {
        'no-restricted-globals': [
          'error',
          {
            name: 'find',
            message: 'You forgot to import `find`, and we are preventing accidental usage of `window.find`.'
          },
        ]
      }
    }
  ]
};
