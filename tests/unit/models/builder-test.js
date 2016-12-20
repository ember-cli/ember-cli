'use strict';

var fs              = require('fs');
var fse             = require('fs-extra');
var path            = require('path');
var Builder         = require('../../../lib/models/builder');
var BuildCommand    = require('../../../lib/commands/build');
var commandOptions  = require('../../factories/command-options');
var Promise         = require('../../../lib/ext/promise');
var MockProject     = require('../../helpers/mock-project');
var remove          = Promise.denodeify(fse.remove);
var mkTmpDirIn      = require('../../../lib/utilities/mk-tmp-dir-in');
var td              = require('testdouble');
var experiments = require('../../experiments');
var chai = require('../../chai');
var expect = chai.expect;
var file = chai.file;

var root            = process.cwd();
var tmproot         = path.join(root, 'tmp');

var MockUI = require('console-ui/mock');
var Heimdall = require('heimdalljs/heimdall');
var walkSync = require('walk-sync');
var itr2Array = require('../../helpers/itr2array');
var EventEmitter = require('events');
var captureExit = require('capture-exit');

var mockBuildResultsWithHeimdallSubgraph = {
  graph: {
    __heimdall__: {
      toJSONSubgraph: function () {
        return [{
          _id: 1,
          id: { name: 'a' },
          children: [2],
        }, {
          _id: 2,
          id: { name: 'b' },
          children: [],
        }];
      }
    }
  }
};

describe('models/builder.js', function() {
  var addon, builder, buildResults, tmpdir;

  function setupBroccoliBuilder() {
    this.builder = {
      build: function () {
        return Promise.resolve('build results');
      },

      cleanup: function() {
        return Promise.resolve('cleanup result');
      }
    };
  }

  afterEach(function() {
    if (builder) {
      return builder.cleanup();
    }
  });

  describe('process signal listeners', function() {
    var originalListenerCounts;

    function getListenerCount(emitter, event) {
      if (emitter.listenerCount) { // Present in Node >= 4.0
        return emitter.listenerCount(event);
      } else {
        // deprecated in Node 4.0
        return EventEmitter.listenerCount(emitter, event);
      }
    }

    function getListenerCounts() {
      return {
        SIGINT: getListenerCount(process, 'SIGINT'),
        SIGTERM: getListenerCount(process, 'SIGTERM'),
        message: getListenerCount(process, 'message'),
        exit: captureExit.listenerCount()
      };
    }

    beforeEach(function() {
      originalListenerCounts = getListenerCounts();
    });

    it('sets up listeners for signals', function() {
      builder = new Builder({
        setupBroccoliBuilder: setupBroccoliBuilder,
        project: new MockProject()
      });

      var actualListeners = getListenerCounts();

      expect(actualListeners).to.eql({
        SIGINT: originalListenerCounts.SIGINT + 1,
        SIGTERM: originalListenerCounts.SIGTERM + 1,
        message: originalListenerCounts.message + 1,
        exit: originalListenerCounts.exit + 1
      });
    });

    it('cleans up added listeners after `.cleanup`', function() {
      builder = new Builder({
        setupBroccoliBuilder: setupBroccoliBuilder,
        project: new MockProject()
      });

      return builder.cleanup()
        .then(function() {
          var actualListeners = getListenerCounts();
          expect(actualListeners).to.eql(originalListenerCounts);
        })
        .finally(function() {
          // we have already called `.cleanup`, calling it again
          // in the global afterEach triggers an error
          builder = null;
        });
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
      expect(result.summary.buildSteps).to.eql(2); // 2 nodes with broccoliNode: true and broccoliCachedNode: false

      var buildJSON = result.buildTree.toJSON();

      expect(Object.keys(buildJSON)).to.eql(['nodes']);
      expect(buildJSON.nodes.length).to.eql(7);

      expect(buildJSON.nodes.map(function(x) { return x.id; })).to.eql([
        1, 2, 3, 4, 5, 6, 7
      ]);

      expect(buildJSON.nodes.map(function(x) { return x.label; })).to.eql([
        { name: 'a' },
        { name: 'b1', broccoliNode: true, broccoliCachedNode: false },
        { name: 'c1' },
        { name: 'b2' },
        { name: 'c2', broccoliNode: true, broccoliCachedNode: false, },
        { name: 'd1', broccoliNode: true, broccoliCachedNode: true, },
        { name: 'c3' },
      ]);

      expect(buildJSON.nodes.map(function (x) { return x.children;})).to.eql([
        [2, 4],
        [3],
        [],
        [5, 7],
        [6],
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
      expect(depthFirstNames, 'pre order').to.eql([
        'a', 'b1', 'c1', 'b2', 'c2', 'd1', 'c3'
      ]);

      var breadthFirstNames = itr2Array(buildTree.bfsIterator()).map(function (x) { return x.label.name; });
      expect(breadthFirstNames, 'post order').to.eql([
        'c1', 'b1', 'd1', 'c2', 'c3', 'b2', 'a'
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
      var monitor = Builder._enableFSMonitorIfInstrumentationEnabled();
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
      var monitor = Builder._enableFSMonitorIfInstrumentationEnabled();
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
      var monitor = Builder._enableFSMonitorIfInstrumentationEnabled();
      try {
        expect(fs.statSync, 'fs.statSync').to.not.equal(originalStatSync, '[original] fs.statSync');
      } finally {
        if (monitor) {
          monitor.stop();
        }
      }
    });
  });

  describe('Windows CTRL + C Capture', function() {
    var originalPlatform, originalStdin;

    before(function() {
      originalPlatform = process.platform;
      originalStdin = process.platform;
    });

    after(function () {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });

      Object.defineProperty(process, 'stdin', {
        value: originalStdin
      });
    });

    it('enables raw capture on Windows', function() {
      Object.defineProperty(process, 'platform', {
        value: 'win'
      });

      Object.defineProperty(process, 'stdin', {
        value: {
          isTTY: true
        }
      });

      var trapWindowsSignals = td.function();

      builder = new Builder({
        setupBroccoliBuilder: setupBroccoliBuilder,
        trapWindowsSignals: trapWindowsSignals,
        project: new MockProject()
      });

      builder.trapSignals();
      td.verify(trapWindowsSignals());
    });

    it('does not enable raw capture on non-Windows', function() {
      Object.defineProperty(process, 'platform', {
        value: 'mockOS'
      });

      Object.defineProperty(process, 'stdin', {
        value: {
          isTTY: true
        }
      });

      var trapWindowsSignals = td.function();

      builder = new Builder({
        setupBroccoliBuilder: setupBroccoliBuilder,
        trapWindowsSignals: trapWindowsSignals,
        project: new MockProject()
      });

      builder.trapSignals();
      td.verify(trapWindowsSignals(), {times: 0, ignoreExtraArgs: true});

      return builder.cleanup();
    });
  });

  describe('copyToOutputPath', function() {
    beforeEach(function() {
      return mkTmpDirIn(tmproot).then(function(dir) {
        tmpdir = dir;
        builder = new Builder({
          setupBroccoliBuilder: setupBroccoliBuilder,
          project: new MockProject()
        });
      });
    });

    afterEach(function() {
      return remove(tmproot);
    });

    it('allows for non-existent output-paths at arbitrary depth', function() {
      builder.outputPath = path.join(tmpdir, 'some', 'path', 'that', 'does', 'not', 'exist');

      builder.copyToOutputPath('tests/fixtures/blueprints/basic_2');
      expect(file(path.join(builder.outputPath, 'files', 'foo.txt'))).to.exist;
    });

    var command;

    var parentPath = '..' + path.sep + '..' + path.sep;

    before(function() {
      command = new BuildCommand(commandOptions());

      builder = new Builder({
        setupBroccoliBuilder: setupBroccoliBuilder,
        project: new MockProject()
      });
    });

    it('when outputPath is root directory ie., `--output-path=/` or `--output-path=C:`', function() {
      var outputPathArg = '--output-path=.';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      outputPath = outputPath.split(path.sep)[0] + path.sep;
      builder.outputPath = outputPath;

      expect(builder.canDeleteOutputPath(outputPath)).to.equal(false);
    });

    it('when outputPath is project root ie., `--output-path=.`', function() {
      var outputPathArg = '--output-path=.';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      builder.outputPath = outputPath;

      expect(builder.canDeleteOutputPath(outputPath)).to.equal(false);
    });

    it('when outputPath is a parent directory ie., `--output-path=' + parentPath + '`', function() {
      var outputPathArg = '--output-path=' + parentPath;
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      builder.outputPath = outputPath;

      expect(builder.canDeleteOutputPath(outputPath)).to.equal(false);
    });

    it('allow outputPath to contain the root path as a substring, as long as it is not a parent', function() {
      var outputPathArg = '--output-path=.';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      outputPath = outputPath.substr(0, outputPath.length - 1);
      builder.outputPath = outputPath;

      expect(builder.canDeleteOutputPath(outputPath)).to.equal(true);
    });
  });

  describe('build', function() {
    before(function () {
      var command = new BuildCommand(commandOptions());

      builder = new Builder({
        setupBroccoliBuilder: setupBroccoliBuilder,
        project: new MockProject(),
        processBuildResult: function(buildResults) { return Promise.resolve(buildResults); },
      });
    });

    afterEach(function () {
      delete process._heimdall;
      delete process.env.BROCCOLI_VIZ;
      builder.project.ui.output = '';
    });

    it('prints a deprecation warning if it discovers a < v0.1.4 version of heimdalljs', function() {
      process._heimdall = {};

      return builder.build().then(function () {
        var output = builder.project.ui.output;

        expect(output).to.include('Heimdalljs < 0.1.4 found.  Please remove old versions');
      });
    });

    it('does not print a deprecation warning if it does not discover a < v0.1.4 version of heimdalljs', function() {
      expect(process._heimdall).to.equal(undefined);

      return builder.build().then(function () {
        var output = builder.project.ui.output;

        expect(output).to.not.include('Heimdalljs < 0.1.4 found.  Please remove old versions');
      });
    });
  });

  describe('addons', function() {
    var hooksCalled;
    var instrumentationArg;

    beforeEach(function() {
      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
      instrumentationArg = undefined;
      hooksCalled = [];
      addon = {
        name: 'TestAddon',
        preBuild: function() {
          hooksCalled.push('preBuild');

          return Promise.resolve();
        },

        postBuild: function() {
          hooksCalled.push('postBuild');

          return Promise.resolve();
        },

        outputReady: function() {
          hooksCalled.push('outputReady');
        },

        buildError: function() {
          hooksCalled.push('buildError');
        },
      };

      if (experiments.BUILD_INSTRUMENTATION) {
        addon[experiments.BUILD_INSTRUMENTATION] = function (instrumentation) {
          hooksCalled.push('buildInstrumentation');
          instrumentationArg = instrumentation;
        };
      }

      var project = new MockProject();
      project.addons = [addon];

      builder = new Builder({
        setupBroccoliBuilder: function() {},
        builder: {
          build: function() {
            hooksCalled.push('build');

            return Promise.resolve(buildResults);
          },

          cleanup: function() {
            return Promise.resolve('cleanup results');
          }
        },
        processBuildResult: function(buildResults) { return Promise.resolve(buildResults); },
        project: project
      });

      buildResults = 'build results';
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

    it('allows addons to add promises preBuild', function() {
      var preBuild = td.replace(addon, 'preBuild', td.function());
      td.when(preBuild(), {ignoreExtraArgs: true, times: 1}).thenReturn(Promise.resolve());

      return builder.build();
    });

    it('allows addons to add promises postBuild', function() {
      var postBuild = td.replace(addon, 'postBuild', td.function());

      return builder.build().then(function() {
        td.verify(postBuild(buildResults), {times: 1});
      });
    });

    it('allows addons to add promises outputReady', function() {
      var outputReady = td.replace(addon, 'outputReady', td.function());

      return builder.build().then(function() {
        td.verify(outputReady(buildResults), {times: 1});
      });
    });

    it('hooks are called in the right order without visualization', function() {
      return builder.build().then(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady']);
      });
    });

    if (experiments.BUILD_INSTRUMENTATION) {
      it('hooks are called in the right order with visualization', function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';
        buildResults = mockBuildResultsWithHeimdallSubgraph;

        return builder.build(null, {}).then(function() {
          expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'buildInstrumentation', 'outputReady']);
        });
      });
    }

    it('should call postBuild before processBuildResult', function() {
      var called = [];

      addon.postBuild = function() {
        called.push('postBuild');
      };

      builder.processBuildResult = function() {
        called.push('processBuildResult');
      };

      return builder.build().then(function() {
        expect(called).to.deep.equal(['postBuild', 'processBuildResult']);
      });
    });

    it('should call outputReady after processBuildResult', function() {
      var called = [];

      builder.processBuildResult = function() {
        called.push('processBuildResult');
      };

      addon.outputReady = function() {
        called.push('outputReady');
      };

      return builder.build().then(function() {
        expect(called).to.deep.equal(['processBuildResult', 'outputReady']);
      });
    });

    it('buildError receives the error object from the errored step', function() {
      var thrownBuildError = new Error('buildError');
      var receivedBuildError;

      addon.buildError = function(errorThrown) {
        receivedBuildError = errorThrown;
      };

      builder.builder.build = function() {
        hooksCalled.push('build');

        return Promise.reject(thrownBuildError);
      };

      return builder.build().then(function() {
        expect(false, 'should not succeed').to.be.ok;
      }).catch(function() {
        expect(receivedBuildError).to.equal(thrownBuildError);
      });
    });

    it('calls buildError and does not call build, postBuild or outputReady when preBuild fails', function() {
      addon.preBuild = function() {
        hooksCalled.push('preBuild');

        return Promise.reject(new Error('preBuild Error'));
      };

      return builder.build().then(function() {
        expect(false, 'should not succeed').to.be.ok;
      }).catch(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'buildError']);
      });
    });

    it('calls buildError and does not call postBuild or outputReady when build fails', function() {
      builder.builder.build = function() {
        hooksCalled.push('build');

        return Promise.reject(new Error('build Error'));
      };

      return builder.build().then(function() {
        expect(false, 'should not succeed').to.be.ok;
      }).catch(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'buildError']);
      });
    });

    it('calls buildError when postBuild fails', function() {
      addon.postBuild = function() {
        hooksCalled.push('postBuild');

        return Promise.reject(new Error('preBuild Error'));
      };

      return builder.build().then(function() {
        expect(false, 'should not succeed').to.be.ok;
      }).catch(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'buildError']);
      });
    });

    it('calls buildError when outputReady fails', function() {
      addon.outputReady = function() {
        hooksCalled.push('outputReady');

        return Promise.reject(new Error('outputReady Error'));
      };

      return builder.build().then(function() {
        expect(false, 'should not succeed').to.be.ok;
      }).catch(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady', 'buildError']);
      });
    });
  });
});
