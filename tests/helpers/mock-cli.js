'use strict';

const path = require('path');
const MockUI = require('console-ui/mock');
const Instrumentation = require('../../lib/models/instrumentation');

class MockCLI {
  constructor(options) {
    options = options || {};

    this.ui = options.ui || new MockUI();
    this.root = path.join(__dirname, '..', '..');
    this.npmPackage = options.npmPackage || 'ember-cli';
    this.instrumentation = options.instrumentation || new Instrumentation({});
  }
}

module.exports = MockCLI;
