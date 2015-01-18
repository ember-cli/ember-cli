'use strict';

var EventEmitter  = require('events').EventEmitter;
var chalk         = require('chalk');
var _             = require('lodash-node');
var Promise       = require('../../ext/promise');
var Task          = require('../../models/task');
var SilentError   = require('../../errors/silent');

var cleanBaseURL = require('../../utilities/clean-base-url');

module.exports = Task.extend({
  init: function() {
    this.emitter = new EventEmitter();
    this.express = this.express || require('express');
    this.http  = this.http  || require('http');

    var serverRestartDelayTime = this.serverRestartDelayTime || 100;
    this.scheduleServerRestart = _.debounce(function(){
      this.restartHttpServer();
    }, serverRestartDelayTime);
  },

  on: function() {
    this.emitter.on.apply(this.emitter, arguments);
  },

  off: function() {
    this.emitter.off.apply(this.emitter, arguments);
  },

  setupHttpServer: function() {
    this.httpServer = this.http.createServer(this.app);

    // We have to keep track of sockets so that we can close them
    // when we need to restart.
    this.sockets = {};
    this.nextSocketId = 0;
    this.httpServer.on('connection', function(socket) {
      var socketId = this.nextSocketId++;
      this.sockets[socketId] = socket;

      socket.on('close', function() {
        delete this.sockets[socketId];
      }.bind(this));
    }.bind(this));
  },

  listen: function(port, host) {
    var server = this.httpServer;
    return new Promise(function(resolve, reject) {
      server.listen(port, host);
      server.on('listening', resolve);
      server.on('error', reject);
    });
  },

  processAddonMiddlewares: function(options) {
    this.project.initializeAddons();
    this.project.addons.forEach(function(addon) {
      if (addon.serverMiddleware) {
        addon.serverMiddleware({
          app: this.app,
          options: options,
          expressServer: this
        });
      }
    }, this);
  },

  start: function(options) {
    options.project       = this.project;
    options.watcher       = this.watcher;
    options.ui            = this.ui;

    this.startOptions = options;

    return this.startHttpServer()
      .then(function () {
        var baseURL = cleanBaseURL(options.baseURL);

        options.ui.writeLine('Serving on http://' + options.host + ':' + options.port + baseURL);
      });
  },

  restartHttpServer: function() {
    if (!this.serverRestartPromise) {
      this.serverRestartPromise =
        this.stopHttpServer()
          .then(function(){
            this.emitter.emit('stop');
          }.bind(this))
          .then(function () {
            return this.startHttpServer();
          }.bind(this))
          .then(function () {
            this.emitter.emit('restart');
            this.ui.writeLine('');
            this.ui.writeLine(chalk.green('Server restarted.'));
            this.ui.writeLine('');
          }.bind(this))
          .catch(function (err) {
            this.ui.writeError(err);
          }.bind(this))
          .finally(function () {
            this.serverRestartPromise = null;
          }.bind(this));
      return this.serverRestartPromise;
    } else {
      return this.serverRestartPromise.then(function () {
        return this.restartHttpServer();
      }.bind(this));
    }
  },

  stopHttpServer: function() {
    return new Promise(function (resolve, reject) {
      if (!this.httpServer) {
        return resolve();
      }
      this.httpServer.close(function (err) {
        if (err) {
          reject(err);
          return;
        }
        this.httpServer = null;
        resolve();
      }.bind(this));

      // We have to force close all sockets in order to get an fast restart
      var sockets = this.sockets;
      for (var socketId in sockets) {
        sockets[socketId].destroy();
      }
    }.bind(this));
  },

  startHttpServer: function() {
    this.app = this.express();
    this.setupHttpServer();

    var options = this.startOptions;
    options.httpServer = this.httpServer;

    this.processAddonMiddlewares(options);

    return this.listen(options.port, options.host)
      .catch(function() {
        throw new SilentError('Could not serve on http://' + options.host + ':' + options.port + '. It is either in use or you do not have permission.');
      });
  }
});
