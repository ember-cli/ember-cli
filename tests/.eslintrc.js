module.exports = {
  env: {
    mocha: true,
  },
  rules: {
    // JSHint "expr", disabled due to chai expect assertions
    'no-unused-expressions': 0,

    // JSHint "unused"
    'no-unused-vars': 0,

    // disabled for easier asserting of file contents
    'quotes': 0,
  }
};
