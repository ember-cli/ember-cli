#!/usr/bin/env node
'use strict';

/*
 * patch engion.io-client to use any XMLHTTPRequest, but then bundle the one it
 * wanted in ember-cli’s tarball
 *
 * pending: https://github.com/socketio/engine.io-client/issues/405
 */

var fs = require('fs');
var paths = [
  __dirname + '/../node_modules/testem/node_modules/socket.io/node_modules/engine.io/node_modules/ws/package.json',
  __dirname + '/../node_modules/testem/node_modules/socket.io/node_modules/socket.io-client/node_modules/engine.io-client/node_modules/ws/package.json'
];

function patchPkg(packagePath) {
  console.log('  patching: ' + packagePath);
  var pkg = JSON.parse(fs.readFileSync(packagePath, 'UTF-8'));

  delete pkg.optionalDependencies;

  if (!pkg.dependencies['bufferutil'])     { throw new Error('patch invalid ws.bufferutil is not a dependency'); }
  if (!pkg.dependencies['utf-8-validate']) { throw new Error('patch invalid ws.utf-8-validate is not a dependency'); }

  delete pkg.dependencies['bufferutil'];
  delete pkg.dependencies['utf-8-validate'];

  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
};

paths.forEach(patchPkg);
