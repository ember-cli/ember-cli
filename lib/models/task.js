'use strict';

var CoreObject = require('core-object');

var Task = CoreObject.extend({
  /**
    Default implementation, must be defined in subclasses.

    @public
    @method run
  */
  run: function(/*options*/) {
    throw new Error('Task needs to have run() defined.');
  }
});

module.exports = Task;
