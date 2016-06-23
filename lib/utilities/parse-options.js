'use strict';

module.exports = function parseOptions(args) {
  return args.reduce(function(result, arg) {
    var parts = arg.split(':');
    result[parts[0]] = parts.slice(1).join(':');
    return result;
  }, {});
};
