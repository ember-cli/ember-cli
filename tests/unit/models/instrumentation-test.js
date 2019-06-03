'use strict';

const Heimdall = require('heimdalljs/heimdall');
const heimdallGraph = require('heimdalljs-graph');
const chai = require('../../chai');
const td = require('testdouble');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const MockUI = require('console-ui/mock');
const Yam = require('yam');

const MockProject = require('../../helpers/mock-project');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
const hwinfo = require('../../../lib/models/hardware-info');
const Instrumentation = require('../../../lib/models/instrumentation');

const expect = chai.expect;
const any = td.matchers.anything;
const contains = td.matchers.contains;

const root = process.cwd();
const tmproot = path.join(root, 'tmp');

let instrumentation;

describe('models/instrumentation.js', function() {
  afterEach(async function() {
    delete process.env.BROCCOLI_VIZ;
    delete process.env.EMBER_CLI_INSTRUMENTATION;

    process.chdir(root);
    await fse.remove(tmproot);
  });

  describe('._enableFSMonitorIfInstrumentationEnabled', function() {
    let originalStatSync = fs.statSync;

    beforeEach(function() {
      expect(!!process.env.BROCCOLI_VIZ).to.eql(false);
      expect(!!process.env.EMBER_CLI_INSTRUMENTATION).to.eql(false);
      expect(fs.statSync).to.equal(originalStatSync);
    });

    afterEach(function() {
      td.reset();
    });

    it('if VIZ is NOT enabled, do not monitor', function() {
      let monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled();
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
      let monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled();
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
      let monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled();
      try {
        expect(fs.statSync).to.not.equal(originalStatSync);
      } finally {
        if (monitor) {
          monitor.stop();
        }
      }
    });

    it('if enableInstrumentation is NOT enabled in .ember-cli, do not monitor', function() {
      let mockedYam = new Yam('ember-cli', {
        primary: `${process.cwd()}/tests/fixtures/instrumentation-disabled-config`,
      });
      let monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled(mockedYam);
      try {
        expect(fs.statSync).to.equal(originalStatSync);
        expect(monitor).to.eql(undefined);
      } finally {
        if (monitor) {
          monitor.stop();
        }
      }
    });

    it('if enableInstrumentation is enabled in .ember-cli, monitor', function() {
      let mockedYam = new Yam('ember-cli', {
        primary: `${process.cwd()}/tests/fixtures/instrumentation-enabled-config`,
      });
      let monitor = Instrumentation._enableFSMonitorIfInstrumentationEnabled(mockedYam);
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
    const heimdall = require('heimdalljs');
    let heimdallStart;

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
        let mockToken = {};

        td.when(
          heimdallStart(
            contains({
              name: 'init',
              emberCLI: true,
            })
          )
        ).thenReturn(mockToken);

        let instrumentation = new Instrumentation({
          ui: new MockUI(),
        });

        expect(instrumentation.instrumentations.init).to.not.equal(undefined);
        expect(instrumentation.instrumentations.init.token).to.equal(mockToken);
        expect(instrumentation.instrumentations.init.node).to.not.equal(undefined);
      });

      it('does not create an init node if init instrumentation is included', function() {
        let mockToken = {};
        let mockInstrumentation = {};

        td.when(heimdallStart('init')).thenReturn(mockToken);

        let instrumentation = new Instrumentation({
          initInstrumentation: mockInstrumentation,
        });

        expect(instrumentation.instrumentations.init).to.eql(mockInstrumentation);
        td.verify(heimdallStart(), { times: 0, ignoreExtraArgs: true });
      });

      it('does not warn if init instrumentation is included', function() {
        td.when(heimdallStart('init'));

        let mockInstrumentation = {};

        let ui = new MockUI();

        new Instrumentation({
          ui,
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
        let mockToken = {};

        td.when(heimdallStart('init')).thenReturn(mockToken);

        let instrumentation = new Instrumentation({});

        expect(instrumentation.instrumentations.init).to.eql(undefined);
        td.verify(heimdallStart(), { times: 0, ignoreExtraArgs: true });
      });

      it('does not warn when init instrumentation is missing', function() {
        td.when(heimdallStart('init'));

        let ui = new MockUI();

        new Instrumentation({
          ui,
        });

        expect(ui.output.trim()).to.eql('');
      });
    });
  });

  describe('.isVizEnabled', function() {
    let originalWarn = console.warn;
    let warnInvocations;

    beforeEach(function() {
      instrumentation = new Instrumentation({
        ui: new MockUI(),
      });

      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
      warnInvocations = [];
      console.warn = function() {
        warnInvocations.push.apply(warnInvocations, Array.prototype.slice.call(arguments));
      };
    });

    afterEach(function() {
      console.warn = originalWarn;
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
      expect(warnInvocations).to.eql(["Please set BROCCOLI_VIZ=1 to enable visual instrumentation, rather than 'on'"]);
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
    let project;
    let instrumentation;
    let heimdall;

    beforeEach(function() {
      project = new MockProject();
      instrumentation = project._instrumentation;
      instrumentation._heimdall = heimdall = new Heimdall();
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
    });

    it('starts a new subtree for name', function() {
      let heimdallStart = td.replace(heimdall, 'start');

      instrumentation.start('init');

      td.verify(
        heimdallStart(
          td.matchers.contains({
            name: 'init',
            emberCLI: true,
          })
        )
      );

      instrumentation.start('build');

      td.verify(
        heimdallStart(
          td.matchers.contains({
            name: 'build',
            emberCLI: true,
          })
        )
      );

      instrumentation.start('command');

      td.verify(
        heimdallStart(
          td.matchers.contains({
            name: 'command',
            emberCLI: true,
          })
        )
      );

      instrumentation.start('shutdown');

      td.verify(
        heimdallStart(
          td.matchers.contains({
            name: 'shutdown',
            emberCLI: true,
          })
        )
      );
    });

    it('does not start a subtree if instrumentation is disabled', function() {
      process.env.EMBER_CLI_INSTRUMENTATION = 'no thanks';

      let heimdallStart = td.replace(heimdall, 'start');

      instrumentation.start('init');

      td.verify(heimdallStart(), { times: 0, ignoreExtraArgs: true });
    });

    it('throws if name is unexpected', function() {
      expect(() => {
        instrumentation.start('a party!');
      }).to.throw('No such instrumentation "a party!"');
    });

    it('removes any prior instrumentation information to avoid leaks', function() {
      function build() {
        instrumentation.start('build');
        let a = heimdall.start('a');
        let b = heimdall.start('b');
        b.stop();
        a.stop();
        instrumentation.stopAndReport('build');
      }

      function countNodes() {
        let graph = heimdallGraph.loadFromNode(heimdall.root);
        let count = 0;

        // eslint-disable-next-line no-unused-vars
        for (let n of graph.dfsIterator()) {
          ++count;
        }

        return count;
      }

      td.replace(instrumentation, '_buildSummary');
      td.replace(instrumentation, '_invokeAddonHook');

      build();
      let count = countNodes();
      build();
      expect(countNodes()).to.equal(count);
    });
  });

  describe('.stopAndReport', function() {
    let project;
    let instrumentation;
    let heimdall;
    let addon;

    beforeEach(function() {
      project = new MockProject();
      instrumentation = project._instrumentation;
      heimdall = instrumentation._heimdall = new Heimdall();
      process.env.EMBER_CLI_INSTRUMENTATION = '1';

      addon = {
        name: 'Test Addon',
      };
      project.addons = [
        {
          name: 'Some Other Addon',
        },
        addon,
      ];
    });

    it('throws if name is unexpected', function() {
      expect(() => instrumentation.stopAndReport('the weather')).to.throw('No such instrumentation "the weather"');
    });

    it('throws if name has not yet started', function() {
      expect(() => instrumentation.stopAndReport('init')).to.throw(
        'Cannot stop instrumentation "init".  It has not started.'
      );
    });

    it('warns if heimdall stop throws (eg when unbalanced)', function() {
      instrumentation.start('init');
      heimdall.start('a ruckus');

      expect(() => instrumentation.stopAndReport('init')).to.not.throw();

      instrumentation.start('init');
      heimdall.start('trouble');

      expect(() => instrumentation.stopAndReport('init')).to.not.throw();
    });

    it('computes summary for name', function() {
      let buildSummary = td.replace(instrumentation, '_buildSummary');
      let initSummary = td.replace(instrumentation, '_initSummary');
      let treeFor = td.replace(instrumentation, '_instrumentationTreeFor');

      let invokeAddonHook = td.replace(instrumentation, '_invokeAddonHook');
      let writeInstrumentation = td.replace(instrumentation, '_writeInstrumentation');

      let mockInitSummary = 'init summary';
      let mockBuildSummary = 'build summary';
      let mockInitTree = 'init tree';
      let mockBuildTree = 'build tree';

      td.when(initSummary(any(), 'a', 'b')).thenReturn(mockInitSummary);
      td.when(buildSummary(any(), 'a', 'b')).thenReturn(mockBuildSummary);
      td.when(treeFor('init')).thenReturn(mockInitTree);
      td.when(treeFor('build')).thenReturn(mockBuildTree);

      td.verify(invokeAddonHook(), { ignoreExtraArgs: true, times: 0 });
      td.verify(writeInstrumentation(), { ignoreExtraArgs: true, times: 0 });

      instrumentation.start('init');
      instrumentation.stopAndReport('init', 'a', 'b');

      td.verify(
        invokeAddonHook('init', {
          summary: mockInitSummary,
          tree: mockInitTree,
        }),
        { ignoreExtraArgs: true, times: 1 }
      );

      td.verify(
        writeInstrumentation('init', {
          summary: mockInitSummary,
          tree: mockInitTree,
        }),
        { ignoreExtraArgs: true, times: 1 }
      );

      td.verify(invokeAddonHook(), { ignoreExtraArgs: true, times: 1 });
      td.verify(writeInstrumentation(), { ignoreExtraArgs: true, times: 1 });

      instrumentation.start('build');
      instrumentation.stopAndReport('build', 'a', 'b');

      td.verify(
        invokeAddonHook('build', {
          summary: mockBuildSummary,
          tree: mockBuildTree,
        }),
        { ignoreExtraArgs: true, times: 1 }
      );

      td.verify(
        writeInstrumentation('build', {
          summary: mockBuildSummary,
          tree: mockBuildTree,
        }),
        { ignoreExtraArgs: true, times: 1 }
      );
    });

    describe('writes to disk', function() {
      beforeEach(function() {
        let buildSummary = td.replace(instrumentation, '_buildSummary');
        let initSummary = td.replace(instrumentation, '_initSummary');
        let treeFor = td.replace(instrumentation, '_instrumentationTreeFor');

        let mockInitSummary = { ok: 'init dokie' };
        let mockInitTree = {
          toJSON() {
            return { nodes: [{ i: 'can init json' }] };
          },
        };
        let mockBuildSummary = { ok: 'build dokie' };
        let mockBuildTree = {
          toJSON() {
            return { nodes: [{ i: 'can build json' }] };
          },
        };

        td.when(initSummary(any(), 'a', 'b')).thenReturn(mockInitSummary);
        td.when(buildSummary(any(), 'a', 'b')).thenReturn(mockBuildSummary);
        td.when(treeFor('init')).thenReturn(mockInitTree);
        td.when(treeFor('build')).thenReturn(mockBuildTree);

        process.env.EMBER_CLI_INSTRUMENTATION = '1';
      });

      it('writes instrumentation info if viz is enabled', async function() {
        process.env.BROCCOLI_VIZ = '1';

        await mkTmpDirIn(tmproot);

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

      it('does not write instrumentation info if viz is disabled', async function() {
        delete process.env.BROCCOLI_VIZ;

        await mkTmpDirIn(tmproot);

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

    describe('addons', function() {
      let mockInitSummary;
      let mockInitTree;
      let mockBuildSummary;
      let mockBuildTree;

      beforeEach(function() {
        let buildSummary = td.replace(instrumentation, '_buildSummary');
        let initSummary = td.replace(instrumentation, '_initSummary');
        let treeFor = td.replace(instrumentation, '_instrumentationTreeFor');

        mockInitSummary = 'init summary';
        mockInitTree = 'init tree';
        mockBuildSummary = 'build summary';
        mockBuildTree = 'build tree';

        td.when(initSummary(any(), 'a', 'b')).thenReturn(mockInitSummary);
        td.when(buildSummary(any(), 'a', 'b')).thenReturn(mockBuildSummary);
        td.when(treeFor('init')).thenReturn(mockInitTree);
        td.when(treeFor('build')).thenReturn(mockBuildTree);
      });

      it('invokes addons that have [INSTRUMENTATION] for init', function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';

        let hook = td.function();
        addon.instrumentation = hook;

        instrumentation.start('init');
        instrumentation.stopAndReport('init', 'a', 'b');

        td.verify(hook('init', { summary: mockInitSummary, tree: mockInitTree }));
      });

      it('invokes addons that have [INSTRUMENTATION] for build', function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';

        let hook = td.function();
        addon.instrumentation = hook;

        instrumentation.start('build');
        instrumentation.stopAndReport('build', 'a', 'b');

        td.verify(hook('build', { summary: mockBuildSummary, tree: mockBuildTree }));
      });

      it('does not invoke addons if instrumentation is disabled', function() {
        process.env.EMBER_CLI_INSTRUMENTATION = 'not right now thanks';

        let hook = td.function();
        addon.instrumentation = hook;

        instrumentation.start('build');
        instrumentation.stopAndReport('build', 'a', 'b');

        td.verify(hook(), { ignoreExtraArgs: true, times: 0 });
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
      let heimdall = (instrumentation._heimdall = new Heimdall());

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
      let a = heimdall.start('a');
      let b1 = heimdall.start({ name: 'b1', broccoliNode: true, broccoliCachedNode: false });
      let c1 = heimdall.start('c1');
      heimdall.statsFor('mystats').x = 3;
      heimdall.statsFor('mystats').y = 4;
      c1.stop();
      b1.stop();
      let b2 = heimdall.start('b2');
      let c2 = heimdall.start({ name: 'c2', broccoliNode: true, broccoliCachedNode: false });
      let d1 = heimdall.start({ name: 'd1', broccoliNode: true, broccoliCachedNode: true });
      d1.stop();
      c2.stop();
      let c3 = heimdall.start('c3');
      c3.stop();
      b2.stop();
      a.stop();
    }

    function assertTreeValidJSON(name, tree) {
      let json = tree.toJSON();

      expect(Object.keys(json)).to.eql(['nodes']);
      expect(json.nodes.length).to.eql(8);

      expect(json.nodes.map(x => x.id)).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);

      expect(json.nodes.map(x => x.label)).to.eql([
        { name, emberCLI: true },
        { name: 'a' },
        { name: 'b1', broccoliNode: true, broccoliCachedNode: false },
        { name: 'c1' },
        { name: 'b2' },
        { name: 'c2', broccoliNode: true, broccoliCachedNode: false },
        { name: 'd1', broccoliNode: true, broccoliCachedNode: true },
        { name: 'c3' },
      ]);

      expect(json.nodes.map(x => x.children)).to.eql([[2], [3, 5], [4], [], [6, 8], [7], [], []]);

      let stats = json.nodes.map(x => x.stats);
      stats.forEach(nodeStats => {
        expect('own' in nodeStats).to.eql(true);
        expect('time' in nodeStats).to.eql(true);
        expect(nodeStats.time.self).to.be.within(0, 2000000); //2ms in nanoseconds
      });

      let c1Stats = stats[3];
      expect(c1Stats.mystats).to.eql({
        x: 3,
        y: 4,
      });
    }

    function assertTreeValidAPI(name, tree) {
      let depthFirstNames = Array.from(tree.dfsIterator()).map(x => x.label.name);
      expect(depthFirstNames, 'depth first name order').to.eql([name, 'a', 'b1', 'c1', 'b2', 'c2', 'd1', 'c3']);

      let breadthFirstNames = Array.from(tree.bfsIterator()).map(x => x.label.name);
      expect(breadthFirstNames, 'breadth first name order').to.eql([name, 'a', 'b1', 'b2', 'c1', 'c2', 'c3', 'd1']);

      let c2 = Array.from(tree.dfsIterator()).filter(x => x.label.name === 'c2')[0];

      let ancestorNames = Array.from(c2.ancestorsIterator()).map(x => x.label.name);
      expect(ancestorNames).to.eql(['b2', 'a', name]);
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
    let instrTree;
    let instrumentation;

    beforeEach(function() {
      instrumentation = new Instrumentation({ ui: new MockUI() });

      let heimdall = new Heimdall();
      let root;
      let a1 = heimdall.start({ name: 'a1', broccoliNode: true, broccoliCachedNode: false });
      root = heimdall.current;
      let b1 = heimdall.start({ name: 'b1' });
      let c1 = heimdall.start({ name: 'c1', broccoliNode: true, broccoliCachedNode: true });
      c1.stop();
      let c2 = heimdall.start({ name: 'c2', broccoliNode: true, broccoliCachedNode: false });
      c2.stop();
      b1.stop();
      a1.stop();

      instrTree = heimdallGraph.loadFromNode(root);
      process.env.EMBER_CLI_INSTRUMENTATION = '1';
    });

    describe('._buildSummary', function() {
      it('computes initial build sumamries', function() {
        let result = {
          directory: 'tmp/someplace',
          outputChanges: ['assets/foo.js', 'assets/foo.css'],
        };
        let annotation = {
          type: 'initial',
        };

        let summary = instrumentation._buildSummary(instrTree, result, annotation);

        expect(Object.keys(summary)).to.eql(['build', 'platform', 'output', 'totalTime', 'buildSteps']);

        expect(summary.build).to.eql({
          type: 'initial',
          count: 0,
          outputChangedFiles: ['assets/foo.js', 'assets/foo.css'],
        });

        expect(summary.output).to.eql('tmp/someplace');
        expect(summary.buildSteps).to.eql(2); // 2 uncached broccli nodes
        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
        expect(summary).to.have.nested.property('platform.name', process.platform);
        expect(Object.keys(summary.platform)).to.eql(['name', ...Object.keys(hwinfo), 'collectionTime']);
      });

      it('computes rebuild summaries', function() {
        let result = {
          directory: 'tmp/someplace',
          outputChanges: ['assets/foo.js', 'assets/foo.css'],
        };
        let annotation = {
          type: 'rebuild',
          primaryFile: 'a',
          changedFiles: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        };

        instrumentation.start('build');
        instrumentation.stopAndReport('build', result, annotation);
        instrumentation.start('build');
        instrumentation.stopAndReport('build', result, annotation);

        let summary = instrumentation._buildSummary(instrTree, result, annotation);

        expect(Object.keys(summary)).to.eql(['build', 'platform', 'output', 'totalTime', 'buildSteps']);

        expect(summary.build).to.eql({
          type: 'rebuild',
          count: 2,
          outputChangedFiles: ['assets/foo.js', 'assets/foo.css'],
          primaryFile: 'a',
          changedFileCount: 11,
          changedFiles: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        });

        expect(summary.output).to.eql('tmp/someplace');
        expect(summary.buildSteps).to.eql(2); // 2 uncached broccli nodes
        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
        expect(summary).to.have.nested.property('platform.name', process.platform);
        expect(Object.keys(summary.platform)).to.eql(['name', ...Object.keys(hwinfo), 'collectionTime']);
      });
    });

    describe('._initSummary', function() {
      it('computes an init summary', function() {
        let summary = instrumentation._initSummary(instrTree);

        expect(Object.keys(summary)).to.eql(['totalTime', 'platform']);

        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
        expect(summary).to.have.nested.property('platform.name', process.platform);
        expect(Object.keys(summary.platform)).to.eql(['name', ...Object.keys(hwinfo), 'collectionTime']);
      });
    });

    describe('._commandSummary', function() {
      it('computes a command summary', function() {
        let summary = instrumentation._commandSummary(instrTree, 'build', ['--like', '--whatever']);

        expect(Object.keys(summary)).to.eql(['name', 'args', 'totalTime', 'platform']);

        expect(summary.name).to.equal('build');
        expect(summary.args).to.eql(['--like', '--whatever']);
        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
        expect(summary).to.have.nested.property('platform.name', process.platform);
        expect(Object.keys(summary.platform)).to.eql(['name', ...Object.keys(hwinfo), 'collectionTime']);
      });
    });

    describe('._shutdownSummary', function() {
      it('computes a shutdown summary', function() {
        let summary = instrumentation._shutdownSummary(instrTree);

        expect(Object.keys(summary)).to.eql(['totalTime', 'platform']);

        expect(summary.totalTime).to.be.within(0, 2000000); //2ms (in nanoseconds)
        expect(summary).to.have.nested.property('platform.name', process.platform);
        expect(Object.keys(summary.platform)).to.eql(['name', ...Object.keys(hwinfo), 'collectionTime']);
      });
    });
  });
});
