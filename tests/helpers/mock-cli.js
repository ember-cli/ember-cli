'use strict';

var path = require('path');
var MockUI = require('console-ui/mock');
var Instrumentation = require('../../lib/models/instrumentation');

module.exports = MockCLI;
function MockCLI(options) {
  options = options || {};

  this.ui = options.ui || new MockUI();
  this.root = path.join(__dirname, '..', '..');
  this.npmPackage = options.npmPackage || 'ember-cli';
  this.instrumentation = options.instrumentation || new Instrumentation({});
}
