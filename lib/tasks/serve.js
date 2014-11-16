'use strict';

var cluster          = require('cluster');
var watch            = require('watch');
var fs               = require('fs');
var LiveReloadServer = require('./server/livereload-server');
var ExpressServer    = require('./server/express-server');
var Promise          = require('../ext/promise');
var Task             = require('../models/task');
var Watcher          = require('../models/watcher');
var Builder          = require('../models/builder');

var watchServer = function(project){
  var worker;

  cluster.on('exit', function() {
    // only restart if we killed the process
    if (worker.suicide === true) {
      worker = cluster.fork();
    }
  });

  worker = cluster.fork();

  var projectRoot = project.root;
  var brocfilePath = projectRoot + '/Brocfile.js';
  fs.watchFile(brocfilePath, {interval: 1500}, function(){
    worker.kill();
  });

  var serverPath = projectRoot + '/server';
  if (fs.existsSync(serverPath)) {
    watch.watchTree(serverPath, function(){
      worker.kill();
    });
  }

  return new Promise(function(){
    // hang until the user exits.
  });
};

var serveApp = function(app, options){
  var builder = new Builder({
    outputPath: options.outputPath,
    project: app.project,
    environment: options.environment
  });

  var watcher = new Watcher({
    ui: app.ui,
    builder: builder,
    analytics: app.analytics,
    options: options
  });

  var expressServer = new ExpressServer({
    ui: app.ui,
    project: app.project,
    watcher: watcher
  });

  var liveReloadServer = new LiveReloadServer({
    ui: app.ui,
    analytics: app.analytics,
    project: app.project,
    watcher: watcher
  });

  return Promise.all([
      liveReloadServer.start(options),
      expressServer.start(options)
    ]).then(function() {
      return new Promise(function() {
        // hang until the user exits.
      });
    });
};

module.exports = Task.extend({
  run: function(options) {
    if (cluster.isMaster) {
      return watchServer(this.project);
    } else {
      return serveApp(this, options);
    }
  }
});
