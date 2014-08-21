'use strict';

var LiveReloadServer = require('./server/livereload-server');
var ExpressServer    = require('./server/express-server');
var Promise          = require('../ext/promise');
var Task             = require('../models/task');
var Watcher          = require('../models/watcher');
var Builder          = require('../models/builder');

module.exports = Task.extend({
  run: function(options) {
    var builder = new Builder({
      outputPath: options.outputPath,
      project: this.project,
      environment: options.environment
    });

    var watcher = new Watcher({
      ui: this.ui,
      builder: builder,
      analytics: this.analytics,
      options: options
    });

    var expressServer = new ExpressServer({
      ui: this.ui,
      project: this.project,
      watcher: watcher
    });

    var liveReloadServer = new LiveReloadServer({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      watcher: watcher
    });

    return Promise.all([
        liveReloadServer.start(options),
        expressServer.start(options)
      ]).then(function() {
        return new Promise(function() {
          // hang until the user exists.
        });
      });
  }
});
