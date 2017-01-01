'use strict';

var Heimdall = require('heimdalljs/heimdall');
var heimdallGraph = require('heimdalljs-graph');
var chai = require('../../chai');
var td = require('testdouble');
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
var MockUI = require('console-ui/mock');
var chalk = require('chalk');
var EOL   = require('os').EOL;

var itr2Array = require('../../helpers/itr2array');
var Promise = require('../../../lib/ext/promise');
var MockProject = require('../../helpers/mock-project');
var mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
var experiments = require('../../../lib/experiments/');
var Instrumentation = require('../../../lib/models/instrumentation');

var expect = chai.expect;
var any = td.matchers.anything;
var contains = td.matchers.contains;

var remove = Promise.denodeify(fse.remove);
var root = process.cwd();
var tmproot = path.join(root, 'tmp');

var instrumentation;

describe('models/instrumentation.js', function() {
  afterEach(function() {
    delete process.env.BROCCOLI_VIZ;
    delete process.env.EMBER_CLI_INSTRUMENTATION;

    process.chdir(root);
    return remove(tmproot);
  });

  describe('._enableFSMonitorIfInstrumentationEnabled', function() {
    var originalBroccoliViz = process.env.BROCCOLI_VIZ;
    var originalStatSync = fs.statSync;

    beforeEach(function () {
      expect(!!process.env.BROCCOLI_VIZ).to.eql(false);
      expect(!!process.env.EMBER_CLI_INSTRUMENTATION).to.eql(false);
    });

    afterEach(function() {
      td.reset();
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
    var heimdall = require('heimdalljs');
    var heimdallStart;

    beforeEach(function() {
      heimdallStart = td.replace(heimdall, 'start');
    });

    afterEach(function() {
      delete process.env.EMBER_CLI_INSTRUMENTATION;
      td.reset();
    });

    describe('when instrumentation is enabled', function() {
      beforeEach(function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';
      });

      it('starts an init node if init instrumentation is missing', function() {
        var mockToken = {};

        td.when(heimdallStart(contains({
          name: 'init',
          emberCLI: true,
        }))).thenReturn(mockToken);

        var instrumentation = new Instrumentation({
          ui: new MockUI(),
        });

        expect(instrumentation.instrumentations.init).to.not.equal(undefined);
        expect(instrumentation.instrumentations.init.token).to.equal(mockToken);
        expect(instrumentation.instrumentations.init.node).to.not.equal(undefined);
      });

      it('does not create an init node if init instrumentation is included', function() {
        var mockToken = {};
        var mockInstrumentation = {};

        td.when(heimdallStart('init')).thenReturn(mockToken);

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
        ) + EOL);
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
      beforeEach(function() {
        expect(process.env.EMBER_CLI_INSTRUMENTATION).to.eql(undefined);
      });

      it('does not create an init node if init instrumentation is missing', function() {
        var mockToken = {};
        var mockInstrumentation = {};

        td.when(heimdallStart('init')).thenReturn(mockToken);

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
        "Please set BROCCOLI_VIZ=1 to enable visual instrumentation, rather than 'on'",
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

  describe('.start', function() {
    var project;
    var instrumentation;
    var heimdall;

    beforeEach(function() {
      project = new MockProject();
      instrumentation = project._instrumentation;
      instrumentation._heimdall = heimdall = new Heimdall();
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
    });

    it('starts a new subtree for name', function() {
      var heimdallStart = td.replace(heimdall, 'start');

      instrumentation.start('init');

      td.verify(heimdallStart(td.matchers.contains({
        name: 'init',
        emberCLI: true,
      })));

      instrumentation.start('build');

      td.verify(heimdallStart(td.matchers.contains({
        name: 'build',
        emberCLI: true,
      })));

      instrumentation.start('command');

      td.verify(heimdallStart(td.matchers.contains({
        name: 'command',
        emberCLI: true,
      })));

      instrumentation.start('shutdown');

      td.verify(heimdallStart(td.matchers.contains({
        name: 'shutdown',
        emberCLI: true,
      })));
    });

    it('does not start a subtree if instrumentation is disabled', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = 'no thanks';

      var heimdallStart = td.replace(heimdall, 'start');

      instrumentation.start('init');

      td.verify(heimdallStart(), { times: 0, ignoreExtraArgs: true });
    });

    it('throws if name is unexpected', function() {
      expect(function () {
        instrumentation.start('a party!');
      }).to.throw('No such instrumentation "a party!"');
    });
  });

  describe('.stopAndReport', function() {
    var project;
    var instrumentation;
    var heimdall;
    var addon;

    beforeEach(function() {
      project = new MockProject();
      instrumentation = project._instrumentation;
      heimdall = instrumentation._heimdall = new Heimdall();
      process.env.EMBER_CLI_INSTRUMENTATION = '1';

      addon = {
        name: 'Test Addon',
      };
      project.addons = [{
        name: 'Some Other Addon',
      }, addon];
    });

    it('throws if name is unexpected', function() {
      expect(function () {
        instrumentation.stopAndReport('the weather');
      }).to.throw('No such instrumentation "the weather"');
    });

    it('throws if name has not yet started', function() {
      expect(function () {
        instrumentation.stopAndReport('init');
      }).to.throw('Cannot stop instrumentation "init".  It has not started.');
    });

    it('computes summary for name', function() {
      var buildSummary = td.replace(instrumentation, '_buildSummary');
      var initSummary = td.replace(instrumentation, '_initSummary');
      var treeFor = td.replace(instrumentation, '_instrumentationTreeFor');

      var invokeAddonHook = td.replace(instrumentation, '_invokeAddonHook');
      var writeInstrumentation = td.replace(instrumentation, '_writeInstrumentation');

      var mockInitSummary = 'init summary';
      var mockBuildSummary = 'build summary';
      var mockInitTree = 'init tree';
      var mockBuildTree = 'build tree';

      td.when(initSummary(any(), 'a', 'b')).thenReturn(mockInitSummary);
      td.when(buildSummary(any(), 'a', 'b')).thenReturn(mockBuildSummary);
      td.when(treeFor('init')).thenReturn(mockInitTree);
      td.when(treeFor('build')).thenReturn(mockBuildTree);

      td.verify(invokeAddonHook(), { ignoreExtraArgs: true, times: 0 });
      td.verify(writeInstrumentation(), { ignoreExtraArgs: true, times: 0 });

      instrumentation.start('init');
      instrumentation.stopAndReport('init', 'a', 'b');

      td.verify(invokeAddonHook('init', {
        summary: mockInitSummary,
        tree: mockInitTree,
      }), { ignoreExtraArgs: true, times: 1 });

      td.verify(writeInstrumentation('init', {
        summary: mockInitSummary,
        tree: mockInitTree,
      }), { ignoreExtraArgs: true, times: 1 });


      td.verify(invokeAddonHook(), { ignoreExtraArgs: true, times: 1 });
      td.verify(writeInstrumentation(), { ignoreExtraArgs: true, times: 1 });

      instrumentation.start('build');
      instrumentation.stopAndReport('build', 'a', 'b');

      td.verify(invokeAddonHook('build', {
        summary: mockBuildSummary,
        tree: mockBuildTree,
      }), { ignoreExtraArgs: true, times: 1 });

      td.verify(writeInstrumentation('build', {
        summary: mockBuildSummary,
        tree: mockBuildTree,
      }), { ignoreExtraArgs: true, times: 1 });
    });

    describe('writes to disk', function() {
      beforeEach(function() {
        var buildSummary = td.replace(instrumentation, '_buildSummary');
        var initSummary = td.replace(instrumentation, '_initSummary');
        var treeFor = td.replace(instrumentation, '_instrumentationTreeFor');

        var mockInitSummary = { ok: 'init dokie' };
        var mockInitTree = {
          toJSON: function () {
            return { nodes: [{ i: 'can init json' }] };
          },
        };
        var mockBuildSummary = { ok: 'build dokie' };
        var mockBuildTree = {
          toJSON: function () {
            return { nodes: [{ i: 'can build json' }] };
          },
        };

        td.when(initSummary(any(), 'a', 'b')).thenReturn(mockInitSummary);
        td.when(buildSummary(any(), 'a', 'b')).thenReturn(mockBuildSummary);
        td.when(treeFor('init')).thenReturn(mockInitTree);
        td.when(treeFor('build')).thenReturn(mockBuildTree);

        process.env.EMBER_CLI_INSTRUMENTATION = '1';
      });

      it('writes instrumentation info if viz is enabled', function() {
        process.env.BROCCOLI_VIZ = '1';

        return mkTmpDirIn(tmproot)
          .then(function () {
            process.chdir(tmproot);

            instrumentation.start('init');
            instrumentation.stopAndReport('init', 'a', 'b');

            expect(fs.existsSync('instrumentation.init.json')).to.equal(true);
            expect(fse.readJsonSync('instrumentation.init.json')).to.eql({
              summary: { ok: 'init dokie' },
              nodes: [{ i: 'can init json' }],
            });

            instrumentation.start('build');
            instrumentation.stopAndReport('build', 'a', 'b');

            expect(fs.existsSync('instrumentation.build.0.json')).to.equal(true);
            expect(fse.readJsonSync('instrumentation.build.0.json')).to.eql({
              summary: { ok: 'build dokie' },
              nodes: [{ i: 'can build json' }],
            });

            instrumentation.start('build');
            instrumentation.stopAndReport('build', 'a', 'b');

            expect(fs.existsSync('instrumentation.build.1.json')).to.equal(true);
            expect(fse.readJsonSync('instrumentation.build.1.json')).to.eql({
              summary: { ok: 'build dokie' },
              nodes: [{ i: 'can build json' }],
            });
          });
      });

      it('does not write instrumentation info if viz is disabled', function() {
        delete process.env.BROCCOLI_VIZ;

        return mkTmpDirIn(tmproot)
          .then(function () {
            process.chdir(tmproot);

            instrumentation.start('init');
            instrumentation.stopAndReport('init');

            expect(fs.existsSync('instrumentation.init.json')).to.equal(false);

            instrumentation.start('build');
            instrumentation.stopAndReport('build');

            expect(fs.existsSync('instrumentation.build.0.json')).to.equal(false);

            instrumentation.start('build');
            instrumentation.stopAndReport('build');

            expect(fs.existsSync('instrumentation.build.1.json')).to.equal(false);
          });
      });
    });

    describe('addons', function() {
      var mockInitSummary;
      var mockInitTree;
      var mockBuildSummary;
      var mockBuildTree;

      beforeEach(function() {
        var buildSummary = td.replace(instrumentation, '_buildSummary');
        var initSummary = td.replace(instrumentation, '_initSummary');
        var treeFor = td.replace(instrumentation, '_instrumentationTreeFor');

        mockInitSummary = 'init summary';
        mockInitTree = 'init tree';
        mockBuildSummary = 'build summary';
        mockBuildTree = 'build tree';

        td.when(initSummary(any(), 'a', 'b')).thenReturn(mockInitSummary);
        td.when(buildSummary(any(), 'a', 'b')).thenReturn(mockBuildSummary);
        td.when(treeFor('init')).thenReturn(mockInitTree);
        td.when(treeFor('build')).thenReturn(mockBuildTree);
      });


      if (experiments.INSTRUMENTATION) {
        it('invokes addons that have [INSTRUMENTATION] for init', function() {
          process.env.EMBER_CLI_INSTRUMENTATION = '1';

          var hook = td.function();
          addon[experiments.INSTRUMENTATION] = hook;

          instrumentation.start('init');
          instrumentation.stopAndReport('init', 'a', 'b');

          td.verify(hook('init', { summary: mockInitSummary, tree: mockInitTree }));
        });

        it('invokes addons that have [INSTRUMENTATION] for build', function() {
          process.env.EMBER_CLI_INSTRUMENTATION = '1';

          var hook = td.function();
          addon[experiments.INSTRUMENTATION] = hook;

          instrumentation.start('build');
          instrumentation.stopAndReport('build', 'a', 'b');

          td.verify(hook('build', { summary: mockBuildSummary, tree: mockBuildTree }));
        });

        it('does not invoke addons if instrumentation is disabled', function() {
          process.env.EMBER_CLI_INSTRUMENTATION = 'not right now thanks';

          var hook = td.function();
          addon[experiments.INSTRUMENTATION] = hook;

          instrumentation.start('build');
          instrumentation.stopAndReport('build', 'a', 'b');

          td.verify(hook(), { ignoreExtraArgs: true, times: 0 });
        });
      }

      describe('(build)', function() {
        if (experiments.BUILD_INSTRUMENTATION) {
          it('invokes addons that have [BUILD_INSTRUMENTATION] and not [INSTRUMENTATION]', function() {
            process.env.EMBER_CLI_INSTRUMENTATION = '1';

            var hook = td.function();
            addon[experiments.BUILD_INSTRUMENTATION] = hook;

            instrumentation.start('build');
            instrumentation.stopAndReport('build', 'a', 'b');

            td.verify(hook({ summary: mockBuildSummary, tree: mockBuildTree }));
          });
        }

        if (experiments.BUILD_INSTRUMENTATION && experiments.INSTRUMENTATION) {
          it('prefers [INSTRUMENTATION] to [BUILD_INSTRUMENTATION]', function() {
            process.env.EMBER_CLI_INSTRUMENTATION = '1';

            var instrHook = td.function();
            var buildInstrHook = td.function();
            addon[experiments.INSTRUMENTATION] = instrHook;
            addon[experiments.BUILD_INSTRUMENTATION] = buildInstrHook;

            instrumentation.start('build');
            instrumentation.stopAndReport('build', 'a', 'b');

            td.verify(instrHook('build', { summary: mockBuildSummary, tree: mockBuildTree }));
            td.verify(buildInstrHook(), { ignoreExtraArgs: true, times: 0});
          });
        }
      });
    });
  });

  describe('._instrumenationTreeFor', function() {
    function StatsSchema() {
      this.x = 0;
      this.y = 0;
    }

    function makeTree(name) {
      instrumentation = new Instrumentation({
        ui: new MockUI(),
        initInstrumentation: {
          node: null,
          token: null,
        },
      });
      var heimdall = instrumentation._heimdall = new Heimdall();

      // {init,build,command,shutdown}
      //  └── a
      //      ├── b1
      //      │   └── c1
      //      └── b2
      //          ├── c2
      //          │   └── d1
      //          └── c3
      heimdall.registerMonitor('mystats', StatsSchema);

      instrumentation.start(name);
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
    }

    function assertTreeValidJSON(name, tree) {
      var json = tree.toJSON();

      expect(Object.keys(json)).to.eql(['nodes']);
      expect(json.nodes.length).to.eql(8);

      expect(json.nodes.map(function(x) { return x.id; })).to.eql([
        1, 2, 3, 4, 5, 6, 7, 8,
      ]);

      expect(json.nodes.map(function(x) { return x.label; })).to.eql([
        { name: name, emberCLI: true },
        { name: 'a' },
        { name: 'b1', broccoliNode: true, broccoliCachedNode: false },
        { name: 'c1' },
        { name: 'b2' },
        { name: 'c2', broccoliNode: true, broccoliCachedNode: false },
        { name: 'd1', broccoliNode: true, broccoliCachedNode: true },
        { name: 'c3' },
      ]);

      expect(json.nodes.map(function (x) { return x.children; })).to.eql([
        [2],
        [3, 5],
        [4],
        [],
        [6, 8],
        [7],
        [],
        [],
      ]);

      var stats = json.nodes.map(function (x) { return x.stats; });
      stats.forEach(function (nodeStats) {
        expect('own' in nodeStats).to.eql(true);
        expect('time' in nodeStats).to.eql(true);
        expect(nodeStats.time.self).to.be.within(0, 2000000); //2ms in nanoseconds
      });

      var c1Stats = stats[3];
      expect(c1Stats.mystats).to.eql({
        x: 3,
        y: 4,
      });
    }

    function assertTreeValidAPI(name, tree) {
      var depthFirstNames = itr2Array(tree.dfsIterator()).map(function (x) { return x.label.name; });
      expect(depthFirstNames, 'depth first name order').to.eql([
        name, 'a', 'b1', 'c1', 'b2', 'c2', 'd1', 'c3',
      ]);

      var breadthFirstNames = itr2Array(tree.bfsIterator()).map(function (x) { return x.label.name; });
      expect(breadthFirstNames, 'breadth first name order').to.eql([
        name, 'a', 'b1', 'b2', 'c1', 'c2', 'c3', 'd1',
      ]);

      var c2 = itr2Array(tree.dfsIterator()).filter(function (x) {
        return x.label.name === 'c2';
      })[0];

      var ancestorNames = itr2Array(c2.ancestorsIterator()).map(function (x) { return x.label.name; });
      expect(ancestorNames).to.eql([
        'b2', 'a', name,
      ]);
    }

    function assertTreeValid(name, tree) {
      assertTreeValidJSON(name, tree);
      assertTreeValidAPI(name, tree);
    }

    it('produces a valid tree for init', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
      makeTree('init');
      assertTreeValid('init', instrumentation._instrumentationTreeFor('init'));
    });

    it('produces a valid tree for build', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
      makeTree('build');
      assertTreeValid('build', instrumentation._instrumentationTreeFor('build'));
    });
  });

  describe('summaries', function() {
    var instrTree;
    var instrumentation;

    beforeEach(function() {
      instrumentation = new Instrumentation({ ui: new MockUI() });

      var heimdall = new Heimdall();
      var root;
      var a1 = heimdall.start({ name: 'a1', broccoliNode: true, broccoliCachedNode: false });
      root = heimdall.current;
      var b1 = heimdall.start({ name: 'b1' });
      var c1 = heimdall.start({ name: 'c1', broccoliNode: true, broccoliCachedNode: true });
      c1.stop();
      var c2 = heimdall.start({ name: 'c2', broccoliNode: true, broccoliCachedNode: false });
      c2.stop();
      b1.stop();
      a1.stop();

      instrTree = heimdallGraph.loadFromNode(root);
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
    });

    describe('._buildSummary', function() {
      it('computes inital build sumamries', function() {
        var result = {
          directory: 'tmp/someplace',
          outputChanges: ['assets/foo.js', 'assets/foo.css'],
        };
        var annotation = {
          type: 'initial',
        };

        var summary = instrumentation._buildSummary(instrTree, result, annotation);

        expect(Object.keys(summary)).to.eql([
          'build', 'output', 'totalTime', 'buildSteps',
        ]);

        expect(summary.build).to.eql({
          type: 'initial',
          count: 0,
          outputChangedFiles: ['assets/foo.js', 'assets/foo.css'],
        });

        expect(summary.output).to.eql('tmp/someplace');
        expect(summary.buildSteps).to.eql(2); // 2 uncached broccli nodes
        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
      });

      it('computes rebuild summaries', function() {
        var result = {
          directory: 'tmp/someplace',
          outputChanges: ['assets/foo.js', 'assets/foo.css'],
        };
        var annotation = {
          type: 'rebuild',
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

        instrumentation.start('build');
        instrumentation.stopAndReport('build', result, annotation);
        instrumentation.start('build');
        instrumentation.stopAndReport('build', result, annotation);

        var summary = instrumentation._buildSummary(instrTree, result, annotation);

        expect(Object.keys(summary)).to.eql([
          'build', 'output', 'totalTime', 'buildSteps',
        ]);

        expect(summary.build).to.eql({
          type: 'rebuild',
          count: 2,
          outputChangedFiles: ['assets/foo.js', 'assets/foo.css'],
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

        expect(summary.output).to.eql('tmp/someplace');
        expect(summary.buildSteps).to.eql(2); // 2 uncached broccli nodes
        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
      });
    });

    describe('._initSummary', function() {
      it('computes an init summary', function() {
        var summary = instrumentation._initSummary(instrTree);

        expect(Object.keys(summary)).to.eql(['totalTime']);

        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
      });
    });

    describe('._commandSummary', function() {
      it('computes a command summary', function() {
        var summary = instrumentation._commandSummary(instrTree, 'build', ['--like', '--whatever']);

        expect(Object.keys(summary)).to.eql(['name', 'args', 'totalTime']);

        expect(summary.name).to.equal('build');
        expect(summary.args).to.eql(['--like', '--whatever']);
        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
      });
    });

    describe('._shutdownSummary', function() {
      it('computes a shutdown summary', function() {
        var summary = instrumentation._shutdownSummary(instrTree);

        expect(Object.keys(summary)).to.eql(['totalTime']);

        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
      });
    });
  });
});
