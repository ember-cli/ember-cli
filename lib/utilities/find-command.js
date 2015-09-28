'use strict';

/**
  Walk through the commands tree and search appropriate command.
  You can find `npm cache clean` in the following way:

  ```
  var cacheClean = findCommand(npm.commands, 'cache clean');
  ```

  @param {object} [commands] `npm.commands`, `bower.commands`...
  @param {string} [commandText] `cache clean`, `install`, `uninstall`
  @return {function}
*/
function findCommand(commands, commandText) {
    var commandPath = commandText.trim().split(/\s+/);
    var namespace = commands;
    var word;

    do {
      word = commandPath.shift();

      if (typeof namespace[word] === 'undefined') {
        return;
      }

      namespace = namespace[word];
    } while (commandPath.length > 0);

    return namespace;
}

module.exports = findCommand;
