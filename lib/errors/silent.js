'use strict';

function SilentError(message) {
  this.name     = 'SilentError';
  this.message  = message;

  this.suppressStacktrace = true;
}
SilentError.prototype = new Error();
SilentError.prototype.constructor = SilentError;

module.exports = SilentError;
