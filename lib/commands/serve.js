'use strict';

var path    = require('path');
var assign  = require('lodash-node/modern/objects/assign');
var Command = require('../models/command');

module.exports = Command.extend({
  name: 'serve',
  description: 'Builds and serves your app, rebuilding on file changes.',
  aliases: ['server', 's'],

  availableOptions: [
    { name: 'port', type: Number, default: 4200 },
    { name: 'host', type: String, default: '0.0.0.0' },
    { name: 'proxy',  type: String },
    { name: 'watcher',  type: String, default: 'events' },
    { name: 'live-reload',  type: Boolean, default: true },
    { name: 'environment', type: String, default: 'development' },
    { name: 'output-path', type: path, default: 'dist/' }
  ],

  run: function(commandOptions) {
    commandOptions = assign({}, commandOptions, {
      liveReloadPort: commandOptions.port - 4200 + 35729,
      baseURL: this.project.config('development').baseURL || '/'
    });

    var ServeTask = this.tasks.Serve;
    var serve = new ServeTask({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return serve.run(commandOptions);
  }
});
