var SilentError = require('../../lib/errors/silent');
var chalk       = require('chalk');

var TYPE_MAP = {
  array: 'ArrayController',
  object: 'ObjectController',
  basic: 'Controller'
};

module.exports = {
  description: 'Generates a controller of the given type.',

  availableOptions: [
    { name: 'type', values: ['basic', 'object', 'array'], default: 'basic' }
  ],

  beforeInstall: function(options) {
    var type = options.type;

    if (options.type && !TYPE_MAP[options.type]) {
      throw new SilentError('Unknown controller type "' + type + '". Should be "basic", "object", or "array".');
    }
  },

  locals: function(options) {
    var baseClass;

    if (options.type) {
      baseClass = TYPE_MAP[options.type];
    } else {
      this.ui.writeLine(chalk.yellow('Warning: no controller type was specified, defaulting to basic.'));
      baseClass = TYPE_MAP.basic;
    }

    return {
      baseClass: baseClass
    };
  }
};
