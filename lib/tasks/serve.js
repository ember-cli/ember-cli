'use strict';

var LiveReloadServer = require('./server/livereload-server');
var ExpressServer    = require('./server/express-server');
var Promise          = require('../ext/promise');
var Task             = require('../models/task');
var Watcher          = require('../models/watcher');
var Builder          = require('../models/builder');

module.exports = Task.extend({
  run: function(options) {
    var env = options.environment || 'development';
    var promises = [];

    process.env.EMBER_ENV = process.env.EMBER_ENV || env;
    var builder = new Builder();

    var watcher = new Watcher({
      ui: this.ui,
      builder: builder,
      analytics: this.analytics
    });

    var expressServer = new ExpressServer({
      ui: this.ui,
      project: this.project,
      watcher: watcher
    });

    promises.push(expressServer.start(options));

    if (options['live-reload'] === true) {

      var liveReloadServer = new LiveReloadServer({
        ui: this.ui,
        analytics: this.analytics,
        watcher: watcher
      });

      promises.push(liveReloadServer.start(options));
    }

    return Promise.all(promises);
  }
});
