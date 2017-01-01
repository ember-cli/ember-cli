'use strict';

var CoreObject = require('core-object');

var Task = CoreObject.extend({
  run(/*options*/) {
    throw new Error('Task needs to have run() defined.');
  },
});

module.exports = Task;
