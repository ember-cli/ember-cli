'use strict';
function printVersions(ui, versions, verbose) {
  var alwaysPrint = ['node','npm'];
  for(var module in versions) {
    if(verbose || alwaysPrint.indexOf(module) > -1) {
      ui.writeLine(module + ': ' + versions[module]);
    }
  }
}

function versions() {
  var _versions = process.versions;
  _versions['npm'] = require('npm').version;
  return _versions;
}

module.exports = {
  versions: versions,
  printVersions: printVersions
};

