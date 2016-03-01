module.exports = {
  root: true,
  plugins: [
    'chai-expect',
  ],
  extends: 'eslint:recommended',
  env: {
    browser: false,
    node: true,
  },
  globals: {
  },
  rules: {
    // JSHint "expr"
    'no-unused-expressions': [2, {
      allowShortCircuit: true,
      allowTernary: true,
    }],

    // JSHint "proto", disabled due to warnings
    'no-proto': 0,

    // JSHint "strict"
    'strict': [2, 'global'],

    // JSHint "indent"
    'indent': [2, 2, {
      'SwitchCase': 1,
      'VariableDeclarator': { 'var': 2, 'let': 2, 'const': 3 }
    }],

    // JSHint "camelcase"
    camelcase: 2,

    // JSHint "boss"
    'no-cond-assign': [2, 'except-parens'],

    // JSHint "curly"
    curly: 2,

    // JSHint "latedef"
    'no-use-before-define': [2, 'nofunc'],

    // JSHint "debug", disabled already in .jshintrc
    'no-debugger': 0,

    // JSHint "eqeqeq"
    eqeqeq: 2,

    // JSHint "evil"
    'no-eval': 2,

    // JSHint "forin", disabled already in .jshintrc
    'guard-for-in': 0,

    // JSHint "immed", disabled already in .jshintrc
    'wrap-iife': 0,

    // JSHint "laxbreak"
    'linebreak-style': [2, 'unix'],

    // JSHint "newcap
    'new-cap': [2, {
      properties: false,
    }],

    // JSHint "noarg"
    'no-caller': 2,

    // JSHint "noempty", JSCS "disallowEmptyBlocks"
    'no-empty': 2,

    // JSHint "quotmark"
    quotes: [2, 'single'],

    // JSHint "nonew", disabled already in .jshintrc
    'no-new': 0,

    // JSHint "plusplus", disabled already in .jshintrc
    'no-plusplus': 0,

    // JSHint "undef"
    'no-undef': 2,

    // JSHint "unused"
    'no-unused-vars': 2,

    // JSHint "trailing"
    'no-trailing-spaces': 2,

    // JSHint "eqnull"
    'no-eq-null': 2,

    'no-console': 0,
    'comma-dangle': 0,

    'chai-expect/missing-assertion': 2,
    'chai-expect/terminating-properties': 2,
    'chai-expect/no-inner-compare': 2,
  },
};
