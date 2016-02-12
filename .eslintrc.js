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
  },
};
