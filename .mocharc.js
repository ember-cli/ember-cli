'use strict';

const ciInfo = require('ci-info');
let reporter = process.env.MOCHA_REPORTER || (ciInfo.isCI ? 'tap' : 'spec');
const chaiJestSnapshot = require('chai-jest-snapshot');

module.exports = {
  timeout: 5000,
  reporter,
  retries: 2,
  rootHooks: {
    beforeEach() {
      chaiJestSnapshot.resetSnapshotRegistry();
      chaiJestSnapshot.configureUsingMochaContext(this);
    },
  },
};
