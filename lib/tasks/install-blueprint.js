'use strict';

var Blueprint   = require('../blueprint');
var stringUtil  = require('../utilities/string');
var path        = require('path');
var Task        = require('../task');

module.exports = new Task({
  // Options: Boolean dryRun
  run: function(environment, options) {
    var cwd     = process.cwd();
    var rawName = path.basename(cwd);
    var ui      = environment.ui;

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
});
