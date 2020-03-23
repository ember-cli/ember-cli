'use strict';

const expect = require('chai').expect;
const { isExperimentEnabled, _deprecatedExperimentsDeprecationsIssued } = require('../../lib/experiments');

function resetProcessEnv(originalProcessEnv) {
  for (let key in process.env) {
    if (key in originalProcessEnv) {
      process.env[key] = originalProcessEnv[key];
    } else {
      delete process.env[key];
    }
  }

  for (let key in originalProcessEnv) {
    if (!(key in process.env)) {
      process.env[key] = originalProcessEnv[key];
    }
  }
}

const ORIGINAL_CONSOLE = Object.assign({}, console);

describe('experiments', function () {
  describe('isExperimentEnabled', function () {
    let originalProcessEnv, warnings;

    beforeEach(function () {
      originalProcessEnv = Object.assign({}, process.env);

      // reset all experiment flags for these tests, they will be restored in
      // afterEach
      delete process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS;
      delete process.env.EMBER_CLI_PACKAGER;

      warnings = [];
      console.warn = (warning) => warnings.push(warning);
    });

    afterEach(function () {
      resetProcessEnv(originalProcessEnv);
      Object.assign(console, ORIGINAL_CONSOLE);
      _deprecatedExperimentsDeprecationsIssued.length = 0;
    });

    it('should return true for all experiments when `EMBER_CLI_ENABLE_ALL_EXPERIMENTS` is set', function () {
      process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS = true;

      expect(isExperimentEnabled('PACKAGER')).to.be.true;

      expect(warnings).to.deep.equal([]);
    });

    it('setting an already disabled feature to false does not enable it', function () {
      process.env.EMBER_CLI_PACKAGER = 'false';
      expect(isExperimentEnabled('PACKAGER')).to.be.false;

      expect(warnings).to.deep.equal([]);
    });
  });
});
