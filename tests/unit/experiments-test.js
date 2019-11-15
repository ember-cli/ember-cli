'use strict';

const chalk = require('chalk');
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

describe('experiments', function() {
  describe('isExperimentEnabled', function() {
    let originalProcessEnv, warnings;

    beforeEach(function() {
      originalProcessEnv = Object.assign({}, process.env);

      // reset all experiment flags for these tests, they will be restored in
      // afterEach
      delete process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS;
      delete process.env.EMBER_CLI_MODULE_UNIFICATION;
      delete process.env.EMBER_CLI_PACKAGER;
      delete process.env.EMBER_CLI_DELAYED_TRANSPILATION;
      delete process.env.EMBER_CLI_SYSTEM_TEMP;

      warnings = [];
      console.warn = warning => warnings.push(warning);
    });

    afterEach(function() {
      resetProcessEnv(originalProcessEnv);
      Object.assign(console, ORIGINAL_CONSOLE);
      _deprecatedExperimentsDeprecationsIssued.length = 0;
    });

    it('should return true for all experiments when `EMBER_CLI_ENABLE_ALL_EXPERIMENTS` is set', function() {
      process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS = true;

      expect(isExperimentEnabled('PACKAGER')).to.be.true;
      expect(isExperimentEnabled('SYSTEM_TEMP')).to.be.true;
      expect(isExperimentEnabled('DELAYED_TRANSPILATION')).to.be.true;

      expect(warnings).to.deep.equal([]);
    });

    it('should have SYSTEM_TEMP disabled when environment flag is present', function() {
      process.env.EMBER_CLI_SYSTEM_TEMP = 'false';
      expect(isExperimentEnabled('SYSTEM_TEMP')).to.be.false;

      expect(warnings).to.deep.equal([]);
    });

    it('setting an already disabled feature to false does not enable it', function() {
      process.env.EMBER_CLI_PACKAGER = 'false';
      expect(isExperimentEnabled('PACKAGER')).to.be.false;

      expect(warnings).to.deep.equal([]);
    });

    it('should have MODULE_UNIFICATION disabled by default', function() {
      expect(isExperimentEnabled('MODULE_UNIFICATION')).to.be.false;

      expect(warnings).to.deep.equal([]);
    });

    it('should have MODULE_UNIFICATION enabled when environment variable is set', function() {
      process.env.EMBER_CLI_MODULE_UNIFICATION = 'true';
      expect(isExperimentEnabled('MODULE_UNIFICATION')).to.be.true;

      expect(warnings).to.deep.equal([
        chalk.yellow(`The MODULE_UNIFICATION experiment in ember-cli has been deprecated and will be removed.`),
      ]);
    });

    it('only emits deprecation warnings once', function() {
      process.env.EMBER_CLI_MODULE_UNIFICATION = 'true';
      expect(isExperimentEnabled('MODULE_UNIFICATION')).to.be.true;

      expect(warnings).to.deep.equal([
        chalk.yellow(`The MODULE_UNIFICATION experiment in ember-cli has been deprecated and will be removed.`),
      ]);

      warnings = [];
      expect(isExperimentEnabled('MODULE_UNIFICATION')).to.be.true;

      expect(warnings).to.deep.equal([]);
    });
  });
});
