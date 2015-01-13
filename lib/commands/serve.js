'use strict';

var assign      = require('lodash-node/modern/objects/assign');
var path        = require('path');
var Command     = require('../models/command');
var Promise     = require('../ext/promise');
var SilentError = require('../errors/silent');

module.exports = Command.extend({
  name: 'serve',
  description: 'Builds and serves your app, rebuilding on file changes.',
  aliases: ['server', 's'],

  availableOptions: [
    { name: 'port', type: Number, default: 4200, aliases: ['p'] },
    { name: 'host', type: String, default: '0.0.0.0', aliases: ['h'] },
    { name: 'proxy',  type: String, aliases: ['pr','pxy'] },
    { name: 'insecure-proxy', type: Boolean, default: false, description: 'Set false to proxy self-signed SSL certificates', aliases: ['inspr'] },
    { name: 'watcher',  type: String, default: 'events', aliases: ['w'] },
    { name: 'live-reload',  type: Boolean, default: true, aliases: ['lr'] },
    { name: 'live-reload-port', type: Number, description: '(Defaults to port number + 31529)', aliases: ['lrp']},
    { name: 'environment', type: String, default: 'development', aliases: ['e', {'dev' : 'development'}, {'prod' : 'production'}] },
    { name: 'output-path', type: path, default: 'dist/', aliases: ['op', 'out'] }
  ],

  run: function(commandOptions) {
    commandOptions = assign({}, commandOptions, {
      liveReloadPort: commandOptions.liveReloadPort  || (parseInt(commandOptions.port, 10) + 31529),
      baseURL: this.project.config(commandOptions.environment).baseURL || '/'
    });

    if (commandOptions.proxy) {
      if (!commandOptions.proxy.match(/^(http:|https:)/)) {
        var message = 'You need to include a protocol with the proxy URL.\nTry --proxy http://' + commandOptions.proxy;

        return Promise.reject(new SilentError(message));
      }
    }

    var ServeTask = this.tasks.Serve;
    var serve = new ServeTask({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return serve.run(commandOptions);
  }
});
