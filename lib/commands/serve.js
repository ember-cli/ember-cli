'use strict';

var assign  = require('lodash-node/modern/objects/assign');
var Command = require('../models/command');

module.exports = Command.extend({
  name: 'serve',
  aliases: ['server', 's'],

  availableOptions: [
    { name: 'port', type: Number, default: 4200 },
    { name: 'host', type: String, default: '0.0.0.0' },
    { name: 'proxy',  type: String },
    { name: 'live-reload',  type: Boolean, default: true },
    { name: 'environment', type: String, default: 'development' }
  ],

  run: function(commandOptions) {
    commandOptions = assign({}, commandOptions, {
      liveReloadPort: commandOptions.port - 4200 + 35729
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
