'use strict';

var Blueprint   = require('../blueprint');
var stringUtil  = require('../utilities/string');
var Task        = require('../models/task');

module.exports = Task.extend({
  // Options: Boolean dryRun
  run: function(options) {
    var cwd     = process.cwd();
    var rawName = options.rawName;
    var blueprintPath = options.blueprint || Blueprint.main;

    var name      = stringUtil.dasherize(rawName);
    var namespace = stringUtil.classify(rawName);

    var blueprint = new Blueprint(blueprintPath, this.ui);

    var locals = {
      name: name,
      modulePrefix: name,
      namespace: namespace,
      emberCLIVersion: require('../../package').version
    };

    return blueprint.install(cwd, locals, options.dryRun);
  }
});
