'use strict';

var loadBrocfile = require('../utilities/load-brocfile');
var broccoli     = require('broccoli');
var Task         = require('./task');

var signalsTrapped = false;

module.exports = Task.extend({
  init: function() {
    this.tree = loadBrocfile(this.liveOutputDir); // TODO:
    this.builder = new broccoli.Builder(this.tree);

    process.addListener('exit', this.onExit.bind(this));

    if (signalsTrapped) {
      process.on('SIGINT',  this.onSIGINT.bind(this));
      process.on('SIGTERM', this.onSIGTERM.bind(this));
      signalsTrapped = true;
    }
  },

  build: function() {
    return this.builder.build.apply(this.builder, arguments);
  },

  onExit: function() {
    this.builder.cleanup();
  },

  onSIGINT: function() {
    process.exit(1);
  },
  onSIGTERM: function() {
    process.exit(1);
  }
});
