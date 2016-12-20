var heimdall = require('heimdalljs');
var chai = require('../../chai');
var td = require('testdouble');
var fs = require('fs');
var MockUI = require('console-ui/mock');
var chalk = require('chalk');
var Instrumentation = require('../../../lib/models/instrumentation');

var expect = chai.expect;

var instrumentation;

describe('models/instrumentation.js', function() {
  describe('._enableFSMonitorIfInstrumentationEnabled', function() {
    var originalBroccoliViz = process.env.BROCCOLI_VIZ;
    var originalStatSync = fs.statSync;

    beforeEach(function () {
      expect(!!process.env.BROCCOLI_VIZ).to.eql(false);
    });

    afterEach(function() {
      td.reset();
      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
    });

    it('if VIZ is NOT enabled, do not monitor', function() {
      var monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled();
      try {
        expect(fs.statSync).to.equal(originalStatSync);
        expect(monitor).to.eql(undefined);
      } finally {
        if (monitor) {
          monitor.stop();
        }
      }
    });

    it('if VIZ is enabled, monitor', function() {
      process.env.BROCCOLI_VIZ = '1';
      var monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled();
      try {
        expect(fs.statSync).to.not.equal(originalStatSync);
      } finally {
        if (monitor) {
          monitor.stop();
        }
      }
    });

    it('if instrumentation is enabled, monitor', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
      var monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled();
      try {
        expect(fs.statSync, 'fs.statSync').to.not.equal(originalStatSync, '[original] fs.statSync');
      } finally {
        if (monitor) {
          monitor.stop();
        }
      }
    });
  });


  describe('constructor', function() {
    var heimdallStart;

    beforeEach( function() {
      heimdallStart = td.replace(heimdall, 'start');
    });

    afterEach( function() {
      delete process.env.EMBER_CLI_INSTRUMENTATION;
    });

    describe('when instrumentation is enabled', function() {
      beforeEach( function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';
      });

      it('starts an init node if init instrumentation is missing', function() {
        var mockCookie = {};

        td.when(heimdallStart('init')).thenReturn(mockCookie);

        var instrumentation = new Instrumentation({
          ui: new MockUI(),
        });

        expect(instrumentation.instrumentations.init).to.not.eql(undefined);
        expect(instrumentation.instrumentations.init.cookie).to.eql(mockCookie);
        expect(instrumentation.instrumentations.init.node).to.not.eql(undefined);
      });

      it('does not create an init node if init instrumentation is included', function() {
        var mockCookie = {};
        var mockInstrumentation = {};

        td.when(heimdallStart('init')).thenReturn(mockCookie);

        var instrumentation = new Instrumentation({
          initInstrumentation: mockInstrumentation,
        });

        expect(instrumentation.instrumentations.init).to.eql(mockInstrumentation);
        td.verify(heimdallStart(), { times: 0, ignoreExtraArgs: true });
      });

      it('warns if no init instrumentation is included', function() {
        td.when(heimdallStart('init'));

        var ui = new MockUI();
        var instrumentation = new Instrumentation({
          ui: ui,
        });

        expect(ui.output).to.eql(chalk.yellow(
          'No init instrumentation passed to CLI.  Please update your global ember or ' +
          'invoke ember via the local executable within node_modules.  Init ' +
          'instrumentation will still be recorded, but some bootstraping will be ' +
          'omitted.'
        ) + '\n');
      });

      it('does not warn if init instrumentation is included', function() {
        td.when(heimdallStart('init'));

        var mockInstrumentation = {};

        var ui = new MockUI();
        var instrumentation = new Instrumentation({
          ui: ui,
          initInstrumentation: mockInstrumentation,
        });

        expect(ui.output.trim()).to.eql('');
      });
    });

    describe('when instrumentation is not enabled', function() {
      beforeEach( function() {
        expect(process.env.EMBER_CLI_INSTRUMENTATION).to.eql(undefined);
      });

      it('does not create an init node if init instrumentation is missing', function() {
        var mockCookie = {};
        var mockInstrumentation = {};

        td.when(heimdallStart('init')).thenReturn(mockCookie);

        var instrumentation = new Instrumentation({});

        expect(instrumentation.instrumentations.init).to.eql(undefined);
        td.verify(heimdallStart(), { times: 0, ignoreExtraArgs: true });
      });

      it('does not warn when init instrumentation is missing', function() {
        td.when(heimdallStart('init'));

        var ui = new MockUI();
        var instrumentation = new Instrumentation({
          ui: ui,
        });

        expect(ui.output.trim()).to.eql('');
      });
    });
  });

  describe('.isVizEnabled', function() {
    var originalWarn = console.warn;
    var warnInvocations;

    beforeEach(function() {
      instrumentation = new Instrumentation({
        ui: new MockUI(),
      });

      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
      warnInvocations = [];
      console.warn = function () {
        warnInvocations.push.apply(warnInvocations, Array.prototype.slice.call(arguments));
      };
    });

    it('is true and does not warn if BROCCOLI_VIZ=1', function() {
      process.env.BROCCOLI_VIZ = '1';
      expect(instrumentation.isVizEnabled()).to.eql(true);
      expect(warnInvocations).to.eql([]);
    });

    it('is true and warns at most once if BROCCOLI_VIZ is set but not 1', function() {
      process.env.BROCCOLI_VIZ = 'on';
      expect(instrumentation.isVizEnabled()).to.eql(true);
      expect(instrumentation.isVizEnabled()).to.eql(true);
      expect(warnInvocations).to.eql([
        "Please set BROCCOLI_VIZ=1 to enable visual instrumentation, rather than 'on'"
      ]);
    });

    it('is false if BROCCOLI_VIZ is unset', function() {
      expect('BROCCOLI_VIZ' in process.env).to.eql(false);
      expect(instrumentation.isVizEnabled()).to.eql(false);
      expect(warnInvocations).to.eql([]);
    });
  });

  describe('.isEnabled', function() {
    beforeEach(function() {
      instrumentation = new Instrumentation({
        ui: new MockUI(),
      });
      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
    });

    it('is true if BROCCOLI_VIZ=1', function() {
      process.env.BROCCOLI_VIZ = '1';
      expect(instrumentation.isEnabled()).to.eql(true);
    });

    it('is true if EMBER_CLI_INSTRUMENTATION=1', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
      expect(instrumentation.isEnabled()).to.eql(true);
    });

    it('is false if EMBER_CLI_INSTRUMENTATION != 1', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = 'on';
      expect(instrumentation.isEnabled()).to.eql(false);
    });

    it('is false if both BROCCOLI_VIZ and EMBER_CLI_INSTRUMENTATION are unset', function() {
      expect('BROCCOLI_VIZ' in process.env).to.eql(false);
      expect('EMBER_CLI_INSTRUMENTATION' in process.env).to.eql(false);
      expect(instrumentation.isEnabled()).to.eql(false);
    });
  });
});
