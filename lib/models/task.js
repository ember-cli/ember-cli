'use strict';

const CoreObject = require('core-object');

class Task extends CoreObject {
  run(/*options*/) {
    throw new Error('Task needs to have run() defined.');
  }
}

module.exports = Task;
