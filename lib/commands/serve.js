'use strict';

var path    = require('path');
var assign  = require('lodash-node/modern/objects/assign');
var Command = require('../models/command');

module.exports = Command.extend({
  name: 'serve',
  description: 'Builds and serves your app, rebuilding on file changes.',
  aliases: ['server', 's'],

  availableOptions: [
    { name: 'port', type: Number, default: 4200, aliases: ['p'] },
    { name: 'host', type: String, default: '0.0.0.0', aliases: ['h'] },
    { name: 'proxy',  type: String, aliases: ['pr','pxy'] },
    { name: 'watcher',  type: String, default: 'events', aliases: ['w'] },
    { name: 'live-reload',  type: Boolean, default: true, aliases: ['lr'] },
    { name: 'live-reload-port', type: Number, description: '(Defaults to port number + 31529)', aliases: ['lrp']},
    { name: 'environment', type: String, default: 'development', aliases: ['e', {'dev' : 'development'}, {'prod' : 'production'}] },
    { name: 'output-path', type: path, default: 'dist/', aliases: ['op', 'out'] }
  ],

  run: function(commandOptions) {
    commandOptions = assign({}, commandOptions, {
      liveReloadPort: commandOptions.liveReloadPort  || (commandOptions.port + 31529),
      baseURL: this.project.config(commandOptions.environment).baseURL || '/'
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
