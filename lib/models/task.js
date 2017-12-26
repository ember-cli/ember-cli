'use strict';

const CoreObject = require('core-object');
const RSVP = require('rsvp');

class Task extends CoreObject {
  run(/*options*/) {
    throw new Error('Task needs to have run() defined.');
  }

  /**
   * Reject all the interrupted tasks by default
   * Called when the process is interrupted from outside(CTRL+C)
   *
   * @private
   * @method onInterrupt
   * @returns RSVP.Promise
   */
  onInterrupt() {
    return RSVP.reject();
  }
}

module.exports = Task;
