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

    var tree    = broccoli.loadBrocfile();
    var ui      = this.ui;
    var leek    = this.leek;
    var builder = new broccoli.Builder(tree);
    var watcher = buildWatcher({
      ui:      ui,
      builder: builder
    });

    options = assign({}, options, { watcher: watcher });

    expressServer.ui      = ui;
    liveReloadServer.ui   = ui;
    liveReloadServer.leek = leek;

    return Promise.all([
        liveReloadServer.start(options),
        expressServer.start(options)
      ]);
  }
});
