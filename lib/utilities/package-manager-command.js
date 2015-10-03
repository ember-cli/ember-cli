'use strict';

var _ = require('lodash');

/**
  Looks up for a npm/bower command by name.

  ```
  var cacheClean = findCommand(npm, 'cache clean');
  ```

  @param {object} [packageManagerInstance] Currently designed for `npm` or `bower` which store commands in nested object
  @param {string} [commandText] `install`, `uninstall`, `cache clean`,
  @return {function}
*/
function findCommand(packageManagerInstance, commandText) {
    if (!packageManagerInstance || !packageManagerInstance.commands) {
      throw new Error('No commands container specified');
    }

    var commandPath = commandText.trim().split(/\s+/).join('.');
    var commands = packageManagerInstance.commands;

    var command = _.get(commands, commandPath);

    return typeof command === 'function' ? command : undefined;
}

module.exports = findCommand;
