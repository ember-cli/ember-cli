'use strict';

var assign           = require('lodash-node/modern/objects/assign');
var liveReloadServer = require('./server/livereload-server');
var expressServer    = require('./server/express-server');
var Promise          = require('../ext/promise');
var Task             = require('../models/task');
var buildWatcher     = require('../utilities/build-watcher');

module.exports = Task.extend({
  run: function(options) {
    process.env.EMBER_ENV = options.environment || 'development';

    var ui        = this.ui;
    var analytics = this.analytics;
    var watcher = buildWatcher({
      ui: ui,
      analytics: analytics
    });

    options = assign({}, options, { watcher: watcher });

    expressServer.ui           = ui;
    expressServer.project      = this.project;
    liveReloadServer.ui        = ui;
    liveReloadServer.analytics = analytics;

    return Promise.all([
        liveReloadServer.start(options),
        expressServer.start(options)
      ]);
  }
});
