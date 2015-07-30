#!/usr/bin/env node
/*
 * patch engion.io-client to use any XMLHTTPRequest, but then bundle the one it
 * wanted in ember-cli’s tarball
 *
 * pending: https://github.com/socketio/engine.io-client/issues/405
 */

var fs = require('fs');
var packagePath = __dirname + '/../node_modules/testem/node_modules/socket.io/node_modules/engine.io/node_modules/ws/package.json';
var pkg = JSON.parse(fs.readFileSync(packagePath, 'UTF-8'));

delete pkg.optionalDependencies;
delete pkg.dependencies['bufferutil'];
delete pkg.dependencies['utf-8-validate'];
console.log(packagePath);
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
