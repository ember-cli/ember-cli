'use strict';

let CoreObject = require('core-object');

let Task = CoreObject.extend({
  run(/*options*/) {
    throw new Error('Task needs to have run() defined.');
  },
});

module.exports = Task;
