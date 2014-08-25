'use strict';

var resolve = require('resolve');

function instantiate(name, path, options) {
  // Provide a title to the process in `ps`
  process.title = name;

  resolve(name, {
    basedir: path
  }, function(error, projectLocalCli) {
    var cli;
    if (error) {
      // If there is an error, resolve could not find the ember-cli
      // library from a package.json. Instead, include it from a relative
      // path to this script file (which is likely a globally installed
      // npm package). Most common cause for hitting this is `ember new`
      cli = require('../cli');
    } else {
      // No error implies a projectLocalCli, which will load whatever
      // version of ember-cli you have installed in a local package.json
      cli = require(projectLocalCli);
    }

    cli(options).then(process.exit);
  });
}

module.exports = instantiate;
