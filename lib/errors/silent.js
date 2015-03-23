'use strict';

function SilentError(message) {
  this.name     = 'SilentError';
  this.message  = message;

  if (process.env.EMBER_VERBOSE_ERRORS === 'true') {
    this.stack = (new Error()).stack;
    this.suppressedStacktrace = false;
  } else {
    this.suppressedStacktrace = true;
  }
}

SilentError.prototype = Object.create(Error.prototype);
SilentError.prototype.constructor = SilentError;

module.exports = SilentError;
