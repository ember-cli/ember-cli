'use strict';
/*
  This file is only needed until https://github.com/joliss/broccoli-static-compiler/pull/8
  is merged and being used by Ember CLI.
*/

var StaticCompiler   = require('broccoli-static-compiler');

function CustomStaticCompiler (inputTree, options) {
  if (!(this instanceof CustomStaticCompiler)) {
    return new CustomStaticCompiler(inputTree, options);
  }

  this.inputTree = inputTree;
  this.options = options || {};
}

CustomStaticCompiler.prototype = Object.create(StaticCompiler.prototype);
CustomStaticCompiler.prototype.constructor = CustomStaticCompiler;

CustomStaticCompiler.prototype.write = function () {
  var self = this;

  return StaticCompiler.prototype.write.apply(this, arguments)
    .catch(function(error) {
      // `helpers.multiglob` throws an error if no files are found.
      if (self.options.allowEmpty && error.message.match(/did not match any files/)) {
        // if allowEmpty was specified, swallow that error
      } else {
        throw error;
      }
    });
};

module.exports = CustomStaticCompiler;
