'use strict';

var assign           = require('lodash-node/modern/objects/assign');
var liveReloadServer = require('./server/livereload-server');
var expressServer    = require('./server/express-server');
var broccoli         = require('broccoli');
var Promise          = require('../ext/promise');
var Watcher          = require('broccoli/lib/watcher');
var chalk            = require('chalk');
var Task             = require('../task');

module.exports = new Task({
  run: function(environment, options) {
    process.env.BROCCOLI_ENV = options.environment || 'development';

    var tree    = broccoli.loadBrocfile();

    var builder = new broccoli.Builder(tree);
    var watcher = new Watcher(builder);

    var error = null;
    watcher.on('change', function() {
      if (error) {
        environment.write(chalk.green('\n\nBuild successful.\n'));
        error = null;
      }
    });

    watcher.on('error', function(err) {
      error = err;
    });

    options = assign({}, options, { watcher: watcher });

    return Promise.all([
        liveReloadServer.start(environment, options),
        expressServer.start(environment, options)
      ]);
  }
});
