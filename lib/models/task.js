'use strict';
var CoreObject = require('./core-object');

function Task() {
  CoreObject.apply(this, arguments);
}

module.exports = Task;

Task.__proto__ = require('./core-object');

Task.prototype.run = function(/*options*/) {
  throw new Error('Task needs to have run() defined.');
};
