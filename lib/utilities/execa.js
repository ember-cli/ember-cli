'use strict';

const execa = require('execa');
const logger = require('heimdalljs-logger')('ember-cli:execa');

function _execa(cmd, args, opts) {
  logger.info('%s %j', cmd, args);
  return execa(cmd, args, opts).then(result => {
    logger.info('%s %j -> code: %d', cmd, args, result.code);
    return result;
  });
}

module.exports = _execa;
