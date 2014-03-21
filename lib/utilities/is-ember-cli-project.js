'use strict';

var fs = require('fs');

module.exports = function isEmberCliProject() {
  var originalCwd = process.cwd();
  var inside = false;

  while(process.cwd() !== '/') { // is it windows safe?
    if(!fs.existsSync('package.json')) {
      process.chdir('..');
      continue;
    }

    var pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    inside =  'ember-cli' in pkgJson.devDependencies;
    if (inside) {
      break;
    } else {
      process.chdir('..');
    }
  }

  process.chdir(originalCwd);
  return inside;
};
