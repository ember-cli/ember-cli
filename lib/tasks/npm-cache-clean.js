'use strict';

// Runs `npm cache clean` in cwd

var NpmTask = require('./npm-task');

module.exports = NpmTask.extend({
    command: 'cache clean',
    startProgressMessage: 'Cleaning Npm cache',
    completionMessage: 'Npm cache cleaned successfully',
});

