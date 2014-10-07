'use strict';

module.exports = BuildError;

function BuildError(input){
  Error.call(this);
  this.message = input.message;
  this.file = input.file;
  this.line = input.line;
  this.col = input.col;
  this.stack = input.stack;
}

BuildError.prototype = Object.create(Error.prototype);
