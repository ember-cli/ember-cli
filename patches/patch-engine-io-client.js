#!/usr/bin/env node
/*
 * patch engion.io-client to use any XMLHTTPRequest, but then bundle the one it
 * wanted in ember-cli’s tarball
 *
 * pending: https://github.com/socketio/engine.io-client/issues/405
 */

var fs = require('fs');
var packagePath = __dirname + '/../node_modules/testem/node_modules/socket.io/node_modules/socket.io-client/node_modules/engine.io-client/package.json';
var pkg = JSON.parse(fs.readFileSync(packagePath, 'UTF-8'));

if (pkg.dependencies.xmlhttprequest !== 'https://github.com/rase-/node-XMLHttpRequest/archive/a6b6f2.tar.gz') {
  throw new Error('engine.io-clients deps changed, XMLHTTPRequest may be fixed');
}
pkg.dependencies.xmlhttprequest === '*';

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
