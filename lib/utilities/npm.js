'use strict';

var Promise = require('../ext/promise');

module.exports = function npm(command, packages, options/*, npm*/) {
  var lib;
  if (arguments.length === 4) {
    lib = arguments[3];
  } else {
    lib = require('npm');
  }

  var load = Promise.denodeify(lib.load);

  return load(options)
    .then(function() {
      // if install is denodeified outside load.then(),
      // it throws "Call npm.load(config, cb) before using this command."
      var operation = Promise.denodeify(lib.commands[command]);

      return operation(packages || []);
    });
};
