'use strict';

// Cleans bower cache

var BowerTask    = require('./bower-task');

module.exports = BowerTask.extend({
  // Message to send to ui.startProgress
  startProgressMessage: 'Cleaning bower cache',
  // Message to send to ui.writeLine on completion
  completionMessage: 'Bower cache cleaned successfully',
});
