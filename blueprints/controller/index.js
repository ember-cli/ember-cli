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

    if (type && !TYPE_MAP[type]) {
      throw new SilentError('Unknown controller type "' + type + '". Should be "basic", "object", or "array".');
    }

    if (!type && !options.installingTest) {
      this.ui.writeLine(chalk.yellow('Warning: no controller type was specified, defaulting to basic. Specify using --type=basic|object|array'));
    }
  },

  locals: function(options) {
    var baseClass = TYPE_MAP[options.type] || TYPE_MAP.basic;

    return {
      baseClass: baseClass
    };
  }
};
