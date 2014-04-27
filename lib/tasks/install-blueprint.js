'use strict';

var Blueprint   = require('../blueprint');
var stringUtil  = require('../utilities/string');
var path        = require('path');
var Task        = require('../task');

module.exports = new Task({
  // Options: Boolean dryRun
  run: function(ui, options) {
    var cwd     = process.cwd();
    var rawName = path.basename(cwd);
    var blueprintPath = options.blueprint || Blueprint.main;

    var name      = stringUtil.dasherize(rawName);
    var namespace = stringUtil.classify(rawName);

    var blueprint = new Blueprint(blueprintPath, ui);
    var locals = {
      name: name,
      modulePrefix: name,
      namespace: namespace
    };

    return blueprint.install(cwd, locals, options.dryRun);
  }
});
