'use strict';

var Blueprint   = require('../blueprint');
var stringUtil  = require('../utilities/string');
var path        = require('path');

module.exports = {
  // Options: Boolean dryRun
  run: function(environment, options) {
    var cwd     = process.cwd();
    var rawName = path.basename(cwd);
    var ui      = environment.ui;

    if (rawName === 'test') {
      ui.write('Due to an issue with `compileES6` an application name of `test` cannot be used.');
      throw undefined;
    }

    var name      = stringUtil.dasherize(rawName);
    var namespace = stringUtil.classify(rawName);

    var blueprint = new Blueprint(Blueprint.main, ui);
    var locals = {
      name: name,
      modulePrefix: name,
      namespace: namespace
    };

    return blueprint.install(cwd, locals, options.dryRun);
  }
};
