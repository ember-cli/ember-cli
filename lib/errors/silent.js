'use strict';

function SilentError(message) {
  this.name     = 'SilentError';
  this.message  = message;

  if (process.env.EMBER_VERBOSE_ERRORS === 'true') {
    this.stack = (new Error()).stack;
    this.suppressStacktrace = false;
  } else {
    this.suppressStacktrace = true;
  }
}

SilentError.prototype = Error.prototype;
SilentError.prototype.constructor = SilentError;

module.exports = SilentError;
