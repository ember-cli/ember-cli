'use strict';

var Task    = require('../models/task');
var Promise = require('../ext/promise');
var rimraf  = Promise.denodeify(require('rimraf'));
var chalk   = require('chalk');
var ExpressServer    = require('./server/express-server');

module.exports = Task.extend({
  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },
  run: function(options) {
    var testemOptions = {
      file: options.configFile,
      port: options.port,
      cwd: options.outputPath
    };

    var ui = this.ui;
    var testem = this.testem;
    var watcher = options.watcher;

    // The building has actually started already, but we want some output while we wait for the server
    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    var expressServerOptions = {
      enabledInTest: this.project.config('test').mockApiEnabled || false,
      host: this.project.config('test').mockApiHost || '0.0.0.0',
      port: this.project.config('test').mockApiPort || 4200,
      baseURL: this.project.config('test').baseURL || '/',
      testRunnerPort: options.port
    };

    var expressServer = new ExpressServer({
      ui: this.ui,
      project: this.project
    });

    var started = false;
    return new Promise(function() {

      // Wait for a build and then either start or restart testem
      watcher.on('change', function() {
        if (started) {
          testem.restart();
        } else {
          started = true;

          ui.pleasantProgress.stop();

          if (expressServerOptions.enabledInTest) {
            expressServer.start(expressServerOptions).then(function(){
              testem.startDev(testemOptions, function(code) {
                rimraf(options.outputPath)
                  .finally(function() {
                    process.exit(code);
                  });
              });
            });
          } else {
            testem.startDev(testemOptions, function(code) {
              rimraf(options.outputPath)
                .finally(function() {
                  process.exit(code);
                });
            });
          }
        }
      });
    });
  }
});
