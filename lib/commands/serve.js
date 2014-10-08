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
    { name: 'live-reload-port', type: Number, description: '(Defaults to port number + 31529)'},
    { name: 'environment', type: String, default: 'development' },
    { name: 'output-path', type: path, default: 'dist/' }
  ],

  run: function(commandOptions) {
    var project = this.project;
    var tasks = this.tasks;

    var options = {
      ui: this.ui,
      analytics: this.analytics,
      project: project
    };

    var npmValidateTask = new tasks.NpmValidate(options);

    return npmValidateTask.run(commandOptions)
      .then(function() {
        commandOptions = assign({}, commandOptions, {
          liveReloadPort: commandOptions.liveReloadPort || (commandOptions.port + 31529),
          baseURL: project.config('development').baseURL || '/'
        });

        var ServeTask = tasks.Serve;
        var serve = new ServeTask(options);

        return serve.run(commandOptions);
      });
  }
});
