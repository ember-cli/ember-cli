module.exports = {
  root: true,
  env: {
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

    // JSHint "strict", disabled due to warnings
    'strict': [0, 'function'],

    // JSHint "indent", disabled due to warnings
    'indent': [0, 2, {
      'SwitchCase': 0,
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

    // JSHint "noempty"
    'no-empty': 2,

    // JSHint "quotmark", disabled due to warnings
    quotes: [0, 'single'],

    // JSHint "nonew", disabled already in .jshintrc
    'no-new': 0,
  },
};
