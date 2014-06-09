'use strict';

var reduce = require('lodash-node/compat/collections/reduce');

module.exports = function parseOptions(args) {
  return reduce(args, function(result, arg) {
    var pair = arg.split(':');
    result[pair[0]] = pair[1];
    return result;
  }, {});
};
