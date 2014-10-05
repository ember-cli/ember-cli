'use strict';

var fs        = require('fs');
var path      = require('path');
var Promise   = require('../ext/promise');
var readFile  = Promise.denodeify(fs.readFile);

module.exports = function(root, name) {
  var nodePackage = path.join(root, 'node_modules', name, 'package.json');

  return readFile(nodePackage, { encoding: 'utf8' })
    .then(function(pkg) {
      return JSON.parse(pkg).version;
    }).catch(function() {
      return null;
    });
};
