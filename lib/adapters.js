'use strict';

var path = require('path');
var supportedCommands = [
  'build',
  'server'
];

function loadAdapter(name) {
  return supportedCommands.reduce(function(result, command) {
    result[command] = require('./' + path.join('adapters', name, command));
    return result;
  }, {});
}

module.exports = {
  to: loadAdapter
};
