'use strict';

const expect = require('chai').expect;
const { isExperimentEnabled } = require('../../lib/experiments');

describe('experiments', function() {
  describe('isExperimentEnabled', function() {
    let originalProcessEnv;

    beforeEach(function() {
      originalProcessEnv = Object.assign({}, process.env);
    });

    afterEach(function() {
      process.env = originalProcessEnv;
    });

    it('should have BROCCOLI_2 enabled by default', function() {
      expect(isExperimentEnabled('BROCCOLI_2')).to.be.true;
    });

    it('should have BROCCOLI_2 enabled when environment variable is set', function() {
      process.env.EMBER_CLI_BROCCOLI_2 = 'true';
      expect(isExperimentEnabled('BROCCOLI_2')).to.be.true;
    });

    it('should have BROCCOLI_2 disabled when environment variable is set to false', function() {
      process.env.EMBER_CLI_BROCCOLI_2 = 'false';
      expect(isExperimentEnabled('BROCCOLI_2')).to.be.false;
    });

    it('should have SYSTEM_TEMP disabled when BROCCOLI_2 is disabled', function() {
      process.env.EMBER_CLI_BROCCOLI_2 = 'false';
      expect(isExperimentEnabled('BROCCOLI_2')).to.be.false;
      expect(isExperimentEnabled('SYSTEM_TEMP')).to.be.false;
    });

    it('should have SYSTEM_TEMP disabled when environment flag is present', function() {
      process.env.EMBER_CLI_SYSTEM_TEMP = 'false';
      expect(isExperimentEnabled('SYSTEM_TEMP')).to.be.false;
    });

    it('setting an already disabled feature to false does not enable it', function() {
      process.env.EMBER_CLI_PACKAGER = 'false';
      expect(isExperimentEnabled('PACKAGER')).to.be.false;
    });

    it('should have MODULE_UNIFICATION disabled by default', function() {
      expect(isExperimentEnabled('MODULE_UNIFICATION')).to.be.false;
    });

    it('should have MODULE_UNIFICATION enabled when environment variable is set', function() {
      process.env.EMBER_CLI_MODULE_UNIFICATION = 'true';
      expect(isExperimentEnabled('MODULE_UNIFICATION')).to.be.true;
    });
  });
});
