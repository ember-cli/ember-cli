'use strict';

var fs = require('fs');
var WINDOWS_ROOT =  /^[A-Z]:\\$/;

function isRootDir(path) {
  return path === '/' || WINDOWS_ROOT.test(path);
}

module.exports = function isEmberCliProject() {
  var originalCwd = process.cwd();
  var inside = false;

  while(!isRootDir(process.cwd())) {
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
