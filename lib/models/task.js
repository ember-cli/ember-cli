'use strict';

var CoreObject = require('core-object');

var Task = CoreObject.extend({
  run: function(/*options*/) {
    throw new Error('Task needs to have run() defined.');
  }
});

module.exports = Task;
