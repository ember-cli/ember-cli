var instrumentation = require('../../../lib/utilities/instrumentation');
var chai = require('../../chai');

var expect = chai.expect;
var vizEnabled = instrumentation.vizEnabled;
var instrumentationEnabled = instrumentation.instrumentationEnabled;

describe('instrumentation helpers', function() {
  describe('.vizEnabled', function() {
    var originalWarn = console.warn;
    var warnInvocations;

    beforeEach(function() {
      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
      warnInvocations = [];
      console.warn = function () {
        warnInvocations.push.apply(warnInvocations, Array.prototype.slice.call(arguments));
      };
    });

    it('is true and does not warn if BROCCOLI_VIZ=1', function() {
      process.env.BROCCOLI_VIZ = '1';
      expect(vizEnabled()).to.eql(true);
      expect(warnInvocations).to.eql([]);
    });

    it('is true and warns at most once if BROCCOLI_VIZ is set but not 1', function() {
      process.env.BROCCOLI_VIZ = 'on';
      expect(vizEnabled()).to.eql(true);
      expect(vizEnabled()).to.eql(true);
      expect(warnInvocations).to.eql([
        "Please set BROCCOLI_VIZ=1 to enable visual instrumentation, rather than 'on'"
      ]);
    });

    it('is false if BROCCOLI_VIZ is unset', function() {
      expect('BROCCOLI_VIZ' in process.env).to.eql(false);
      expect(vizEnabled()).to.eql(false);
      expect(warnInvocations).to.eql([]);
    });
  });

  describe('.instrumentationEnabled', function() {
    beforeEach(function() {
      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
    });

    it('is true if BROCCOLI_VIZ=1', function() {
      process.env.BROCCOLI_VIZ = '1';
      expect(instrumentationEnabled()).to.eql(true);
    });

    it('is true if EMBER_CLI_INSTRUMENTATION=1', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
      expect(instrumentationEnabled()).to.eql(true);
    });

    it('is false if EMBER_CLI_INSTRUMENTATION != 1', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = 'on';
      expect(instrumentationEnabled()).to.eql(false);
    });

    it('is false if both BROCCOLI_VIZ and EMBER_CLI_INSTRUMENTATION are unset', function() {
      expect('BROCCOLI_VIZ' in process.env).to.eql(false);
      expect('EMBER_CLI_INSTRUMENTATION' in process.env).to.eql(false);
      expect(instrumentationEnabled()).to.eql(false);
    });
  });
});
