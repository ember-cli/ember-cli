module.exports = {
  plugins: [
    'chai-expect',
  ],
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

    /*** chai-expect ***/

    'chai-expect/missing-assertion': 2,
    'chai-expect/terminating-properties': 2,
    'chai-expect/no-inner-compare': 2,
  }
};
