'use strict';

const execa = require('execa');

function _execa(cmd, args, opts) {
  return execa(cmd, args, opts);
}

module.exports = _execa;
