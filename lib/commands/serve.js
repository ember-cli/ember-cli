'use strict';

var chalk   = require('chalk');
var assign  = require('lodash-node/modern/objects/assign');
var Command = require('../command');

module.exports = new Command({
  aliases: ['server', 's'],

  availableOptions: [
    { name: 'port', type: Number, default: 4200 },
    { name: 'host', type: String, default: '0.0.0.0' },
    { name: 'proxy-port',  type: Number },
    { name: 'proxy-host',  type: String },
    { name: 'environment', type: ['development', 'production'] },
  ],

  run: function(environment, options) {
    options = assign({}, options, {
      liveReloadPort: options.port - 4200 + 35729
    });
    return environment.tasks.serve.run(environment, options);
  },

  usageInstructions: function() {
    return 'ember serve\n' +
    '    --port        ' + chalk.green('[default: 4200]') + '\n' +
    '    --host        ' + chalk.green('[default: 0.0.0.0]') + '\n' +
    '    --environment ' + chalk.green('[default: development] ') +
                                       ' [development|production]\n' +
    '    --proxy-port  ' + chalk.green('[default: none]') + '\n' +
    '    --proxy-host  ' + chalk.green('[default: none]') + '\n';
  }
});
