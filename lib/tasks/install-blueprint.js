'use strict';

var Blueprint   = require('../blueprint');
var stringUtil  = require('../utilities/string');
var path        = require('path');
var Task        = require('../task');

module.exports = new Task({
  // Options: Boolean dryRun
  run: function(ui, options) {
    try {
      var cwd     = process.cwd();
      var rawName = path.basename(cwd);

      var name      = stringUtil.dasherize(rawName);
      var namespace = stringUtil.classify(rawName);

      var blueprint = new Blueprint(Blueprint.main, ui);
      var locals = {
        name: name,
        modulePrefix: name,
        namespace: namespace
      };
    } catch(e) {
      console.log('shit is broken', e.message);
    }

    return blueprint.install(cwd, locals, options.dryRun).then(function() {
      console.log('zomg works?');
    });
  }
});
