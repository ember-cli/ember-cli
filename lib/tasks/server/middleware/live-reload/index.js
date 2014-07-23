'use strict';

function LiveReloadAddon(project) {
  this.project = project;
  this.name = 'live-reload-middleware';
}

LiveReloadAddon.prototype.serverMiddleware = function(options) {
  var app = options.app;
  options = options.options;

  if (options.liveReload === true) {
    var livereloadMiddleware = require('connect-livereload');
    app.use(livereloadMiddleware({
      port: options.loveReloadPort
    }));
  }
};

module.exports = LiveReloadAddon;
