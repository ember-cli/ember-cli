'use strict';

var assign           = require('lodash-node/modern/objects/assign');
var liveReloadServer = require('./server/livereload-server');
var expressServer    = require('./server/express-server');
var broccoli         = require('broccoli');
var Promise          = require('../ext/promise');
var Task             = require('../task');
var buildWatcher     = require('../utilities/build-watcher');

module.exports = new Task({
  run: function(environment, options) {
    process.env.EMBER_ENV = options.environment || 'development';

    var tree    = broccoli.loadBrocfile();

    var builder = new broccoli.Builder(tree);
    var watcher = buildWatcher({
      ui: environment,
      builder: builder
    });

    process.addListener('exit', function () {
      builder.cleanup()
    })

    // We register these so the 'exit' handler removing temp dirs is called
    process.on('SIGINT', function () {
      process.exit(1)
    })
    process.on('SIGTERM', function () {
      process.exit(1)
    })



    options = assign({}, options, { watcher: watcher });

    return Promise.all([
        liveReloadServer.start(environment, options),
        expressServer.start(environment, options)
      ]);
  }
});
