'use strict';

var MockUI          = require('console-ui/mock');
var Instrumentation = require('../../lib/models/instrumentation');

function MockCLI(options) {
  options = options || {};

  this.ui = options.ui || new MockUI();
  this.instrumentation = options.instrumentation || new Instrumentation({});
}

module.exports = MockCLI;
