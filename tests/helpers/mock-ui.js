'use strict';

var UI      = require('../../lib/ui');
var through = require('through');

module.exports = MockUI;
function MockUI() {
  this.output = '';

  UI.call(this, {
    inputStream: through(),
    outputStream: through(function(data) {
      this.output += data;
    }.bind(this))
  });
}

MockUI.prototype = Object.create(UI.prototype);
MockUI.prototype.constructor = MockUI;
