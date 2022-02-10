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
      delete process.env.EMBER_CLI_EMBROIDER;
      delete process.env.EMBER_CLI_CLASSIC;

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

      expect(isExperimentEnabled('EMBROIDER')).to.be.true;

      expect(warnings).to.deep.equal([]);
    });

    it('should return true when an experiment is enabled via environment variable', function () {
      process.env.EMBER_CLI_EMBROIDER = 'true';
      process.env.EMBER_CLI_CLASSIC = 'true';

      // classic experiment will disable embroider
      expect(isExperimentEnabled('EMBROIDER')).to.be.false;

      delete process.env.EMBER_CLI_CLASSIC;

      expect(isExperimentEnabled('EMBROIDER')).to.be.true;

      expect(warnings).to.deep.equal([]);
    });
  });
});
