'use strict';

var reduce = require('lodash/collection/reduce');

module.exports = function parseOptions(args) {
  return reduce(args, function(result, arg) {
    var pair = arg.split(':');
    result[pair[0]] = pair[1];
    return result;
  }, {});
};
