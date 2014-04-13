'use strict';

var assign           = require('lodash-node/modern/objects/assign');
var liveReloadServer = require('./server/livereload-server');
var expressServer    = require('./server/express-server');
var broccoli         = require('broccoli');
var Promise          = require('rsvp').Promise;
var Watcher          =  require('broccoli/lib/watcher');
var Task             = require('../task');

module.exports = new Task({
  run: function(environment, options) {
    var tree    = broccoli.loadBrocfile();
    var builder = new broccoli.Builder(tree);
    var watcher = new Watcher(builder);

    options = assign({}, options, { watcher: watcher });

    return Promise.all([
        liveReloadServer.start(environment, options),
        expressServer.start(environment, options)
      ]);
  }
});
