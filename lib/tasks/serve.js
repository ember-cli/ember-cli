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
    process.env.BROCCOLI_ENV = options.environment || 'development';

    var tree    = broccoli.loadBrocfile();

    var builder = new broccoli.Builder(tree);
    var watcher = buildWatcher({
      ui: environment,
      builder: builder
    });

    options = assign({}, options, { watcher: watcher });

    return Promise.all([
        liveReloadServer.start(environment, options),
        expressServer.start(environment, options)
      ]);
  }
});
