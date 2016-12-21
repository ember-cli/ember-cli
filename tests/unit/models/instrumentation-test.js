var heimdall = require('heimdalljs');
var chai = require('../../chai');
var td = require('testdouble');
var fs = require('fs');
var MockUI = require('console-ui/mock');
var chalk = require('chalk');
var experiments = require('../../../lib/experiments/');
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


  if (experiments.BUILD_INSTRUMENTATION) {
    describe('._reportVizInfo', function() {
      var builder;
      var instrumentationWasCalled;
      var info = {};
      var ui;
      beforeEach(function() {
        var addon1 = { };
        var addon2 = { };

        instrumentationWasCalled = 0;

        addon2[experiments.BUILD_INSTRUMENTATION] = function(actualInfo) {
          instrumentationWasCalled++;
          expect(actualInfo).to.eql(info);
        };

        builder = new Builder({
          project: {
            addons: [ addon1, addon2 ],
            ui: new MockUI()
          },
          setupBroccoliBuilder: setupBroccoliBuilder
        });
      });

      it('invokes on addons that have [BUILD_INSTRUMENTATION]', function() {
        expect(builder.project.addons.length).to.eql(2);
        expect(instrumentationWasCalled).to.eql(0);
        builder._reportVizInfo(info);
        expect(instrumentationWasCalled).to.eql(1);
      });
    });
  }

  describe('._computeVizInfo', function() {
    function StatsSchema() {
      this.x = 0;
      this.y = 0;
    }

    var buildResults;
    var resultAnnotation;

    beforeEach(function() {
      var heimdall = new Heimdall();

      // a
      // ├── b1
      // │   └── c1
      // └── b2
      //     ├── c2
      //     │   └── d1
      //     └── c3
      heimdall.registerMonitor('mystats', StatsSchema);
      var a = heimdall.start('a');
      var b1 = heimdall.start({ name: 'b1', broccoliNode: true, broccoliCachedNode: false });
      var c1 = heimdall.start('c1');
      heimdall.statsFor('mystats').x = 3;
      heimdall.statsFor('mystats').y = 4;
      c1.stop();
      b1.stop();
      var b2 = heimdall.start('b2');
      var c2 = heimdall.start({ name: 'c2', broccoliNode: true, broccoliCachedNode: false });
      var d1 = heimdall.start({ name: 'd1', broccoliNode: true, broccoliCachedNode: true });
      d1.stop();
      c2.stop();
      var c3 = heimdall.start('c3');
      c3.stop();
      b2.stop();
      a.stop();

      buildResults = {
        outputChanges: [
          'assets/app.js',
          'assets/app.css'
        ],
        graph: {
          __heimdall__: heimdall.root._children[0],
        },
        directory: 'tmp/something-abc',
      };
    });

    it('returns a pojo with the expected JSON format for initial builds', function() {
      resultAnnotation = {
        type: 'initial'
      };

      var result = Builder._computeVizInfo(0, buildResults, resultAnnotation);

      expect(result.summary.build).to.eql({
        type: 'initial',
        count: 0,
        outputChangedFiles: [
          'assets/app.js',
          'assets/app.css'
        ],
      });

      expect(result.summary.output).to.eql('tmp/something-abc');
      expect(result.summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
      expect(result.summary.buildSteps).to.eql(2); // 2 nodes with broccoliNode: true

      var buildJSON = result.buildTree.toJSON();

      expect(Object.keys(buildJSON)).to.eql(['nodes']);
      expect(buildJSON.nodes.length).to.eql(6);

      expect(buildJSON.nodes.map(function(x) { return x.id; })).to.eql([
        1, 2, 3, 4, 5, 6
      ]);

      expect(buildJSON.nodes.map(function(x) { return x.label; })).to.eql([
        { name: 'a' },
        { name: 'b1', broccoliNode: true },
        { name: 'c1' },
        { name: 'b2' },
        { name: 'c2', broccoliNode: true },
        { name: 'c3' },
      ]);

      expect(buildJSON.nodes.map(function (x) { return x.children;})).to.eql([
        [2, 4],
        [3],
        [],
        [5, 6],
        [],
        []
      ]);

      var stats = buildJSON.nodes.map(function (x) { return x.stats; });
      stats.forEach(function (nodeStats) {
        expect('own' in nodeStats).to.eql(true);
        expect('time' in nodeStats).to.eql(true);
        expect(nodeStats.time.self).to.be.within(0, 2000000); //2ms in nanoseconds
      });

      var c1Stats = stats[2];
      expect(c1Stats.mystats).to.eql({
        x: 3,
        y: 4,
      });
    });

    it('returns a pojo with the extra summary information for rebuilds', function() {
      resultAnnotation = {
        type: 'rebuild',
        changedFileCount: 7,
        primaryFile: 'a',
        changedFiles: [
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
          'h',
          'i',
          'j',
          'k',
        ],
      };
      var result = Builder._computeVizInfo(0, buildResults, resultAnnotation);

      expect(result.summary.build).to.eql({
        type: 'rebuild',
        count: 0,
        outputChangedFiles: [
          'assets/app.js',
          'assets/app.css'
        ],
        primaryFile: 'a',
        changedFileCount: 11,
        changedFiles: [
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
          'h',
          'i',
          'j',
        ],
      });
    });

    it('returns an object with buildTree that supports the expected API', function() {
      resultAnnotation = {
        type: 'initial'
      };
      var result = Builder._computeVizInfo(0, buildResults, resultAnnotation);
      var buildTree = result.buildTree;

      var depthFirstNames = itr2Array(buildTree.dfsIterator()).map(function (x) { return x.label.name; });
      expect(depthFirstNames).to.eql([
        'a', 'b1', 'c1', 'b2', 'c2', 'c3'
      ]);

      var breadthFirstNames = itr2Array(buildTree.bfsIterator()).map(function (x) { return x.label.name; });
      expect(breadthFirstNames).to.eql([
        'a', 'b1', 'b2', 'c1', 'c2', 'c3', 'd1'
      ]);

      var c2 = itr2Array(buildTree.dfsIterator()).filter(function (x) {
        return x.label.name === 'c2';
      })[0];

      var ancestorNames = itr2Array(c2.ancestorsIterator()).map(function (x) { return x.label.name;});
      expect(ancestorNames).to.eql([
        'b2', 'a'
      ]);
    });
  });

  describe('instrumentation', function() {
    beforeEach(function() {
      return mkTmpDirIn(tmproot).then(function (dir) {
        process.chdir(dir);
      });
    });

    afterEach(function() {
      delete process.env.EMBER_CLI_INSTRUMENTATION;

      process.chdir(root);
      return remove(tmproot);
    });

    if (experiments.BUILD_INSTRUMENTATION) {
      it('invokes build instrumentation hook when EMBER_CLI_INSTRUMENTATION=1', function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';
        var mockVizInfo = Object.create(null);
        var mockResultAnnotation = Object.create(null);

        var computeVizInfo = td.function();
        builder._computeVizInfo = computeVizInfo;

        td.when(
          computeVizInfo(td.matchers.isA(Number), buildResults, mockResultAnnotation)
        ).thenReturn(mockVizInfo);

        return builder.build(null, mockResultAnnotation).then(function() {
          expect(hooksCalled).to.include('buildInstrumentation');
          expect(instrumentationArg).to.equal(mockVizInfo);
        });
      });
    }

    it('writes and invokes build instrumentation hook when BROCCOLI_VIZ=1', function() {
      process.env.BROCCOLI_VIZ = '1';
      var mockVizInfo = Object.create(null);
      var mockResultAnnotation = Object.create(null);

      buildResults = mockBuildResultsWithHeimdallSubgraph;

      var computeVizInfo = td.function();
      td.when(
        computeVizInfo(td.matchers.isA(Number), buildResults, mockResultAnnotation)
      ).thenReturn(mockVizInfo);

      builder._computeVizInfo = computeVizInfo;

      return builder.build(null, mockResultAnnotation).then(function() {
        if (experiments.BUILD_INSTRUMENTATION) {
          expect(hooksCalled).to.include('buildInstrumentation');
          expect(instrumentationArg).to.equal(mockVizInfo);
        }

        var vizFiles = walkSync('.', { globs: ['broccoli-viz.*.json'] });
        expect(vizFiles.length).to.equal(1);
        var vizFile = vizFiles[0];
        var vizInfo = fse.readJSONSync(vizFile);

        expect(Object.keys(vizInfo)).to.eql(['nodes']);
      });
    });

    it('does not invoke build instrumentation hook without BROCCOLI_VIZ or EMBER_CLI_INSTRUMENTATION', function() {
      var mockVizInfo = Object.create(null);
      var mockResultAnnotation = Object.create(null);

      var computeVizInfo = td.function();
      builder._computeVizInfo = computeVizInfo;

      td.when(
        computeVizInfo(td.matchers.isA(Number), buildResults, mockResultAnnotation)
      ).thenReturn(mockVizInfo);

      return builder.build(null, mockResultAnnotation).then(function() {
        expect(hooksCalled).to.not.include('buildInstrumentation');
        expect(instrumentationArg).to.equal(undefined);
      });
    });
  });
});
