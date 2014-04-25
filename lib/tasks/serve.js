'use strict';

var assign           = require('lodash-node/modern/objects/assign');
var liveReloadServer = require('./server/livereload-server');
var expressServer    = require('./server/express-server');
var broccoli         = require('broccoli');
var Promise          = require('../ext/promise');
var Task             = require('../task');
var buildWatcher     = require('../utilities/build-watcher');

module.exports = new Task({
  run: function(options) {
    process.env.EMBER_ENV = options.environment || 'development';

    var self    = this;
    var tree    = broccoli.loadBrocfile();
    var builder = new broccoli.Builder(tree);
    var watcher = buildWatcher({
      ui: this.ui,
      builder: builder
    });

    options = assign({}, options, { watcher: watcher });

    expressServer.ui      = this.ui;
    liveReloadServer.ui   = this.ui;
    liveReloadServer.leek = this.leek;

    return Promise.all([
      liveReloadServer.start(options),
      expressServer.start(options)
    ]);
  }
});
