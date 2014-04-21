'use strict';

function MockUI() {
  this.output = [];
}

module.exports = MockUI;

MockUI.prototype.write = function(message) {
  this.output.push(message);
};

MockUI.prototype.reset = function() {
  this.output = [];
};
