'use strict';

function findCommand(commands, commandText) {
    var commandPath = commandText.trim().split(/\s+/);
    var namespace = commands;
    var word;

    // @todo: Avoid this ugly cycle. Something like Ember.get but with whitespace separator
    do { // search nested commands e.g. cache clean which is stored under `bower.commands.cache.clean`
      word = commandPath.shift();

      if (typeof namespace[word] === 'undefined') {
        return;
      }

      namespace = namespace[word];
    } while (commandPath.length > 0);

    return namespace;
}

module.exports = findCommand;
