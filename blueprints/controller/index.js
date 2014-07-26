var Blueprint   = require('../../lib/models/blueprint');
var SilentError = require('../../lib/errors/silent');
var chalk       = require('chalk');

var TYPE_MAP = {
  array: 'ArrayController',
  object: 'ObjectController',
  basic: 'Controller'
};

module.exports = Blueprint.extend({
  beforeInstall: function(options) {
    var type = options.type;

    if (options.type && !TYPE_MAP[options.type]) {
      throw new SilentError('Unknown controller type "' + type + '". Should be "basic", "object", or "array".\n');
    }
  },

  locals: function(options) {
    var baseClass;

    if (options.type) {
      baseClass = TYPE_MAP[options.type];
    } else {
      this.ui.write(chalk.yellow('Warning: no controller type was specified, defaulting to basic.\n'));
      baseClass = TYPE_MAP.basic;
    }

    return {
      baseClass: baseClass
    };
  }
});
