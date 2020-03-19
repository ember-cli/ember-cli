'use strict';

const fs = require('fs-extra');
const path = require('path');
const BuildCommand = require('../../../lib/commands/build');
const commandOptions = require('../../factories/command-options');
const rimraf = require('rimraf');
const fixturify = require('fixturify');
const MockProject = require('../../helpers/mock-project');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
const td = require('testdouble');
const chai = require('../../chai');
let expect = chai.expect;
let file = chai.file;

let root = process.cwd();
let tmpRoot = path.join(root, 'tmp');

let Builder;

describe('models/builder.js', function() {
  let addon, builder, buildResults, tmpdir;

  function setupBroccoliBuilder() {
    this.broccoliBuilderFallback = false;
    this.builder = {
      outputPath: 'build results',
      outputNodeWrapper: {
        __heimdall__: {},
      },
      build() {
        return Promise.resolve({
          outputPath: 'build results',
          outputNodeWrapper: {
            __heimdall__: {},
          },
        });
      },
      cleanup() {},
    };
  }

  before(function() {
    let willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
    td.replace(willInterruptProcess, 'addHandler', td.function());
    td.replace(willInterruptProcess, 'removeHandler', td.function());

    Builder = require('../../../lib/models/builder');
  });

  afterEach(function() {
    if (builder) {
      return builder.cleanup();
    }
  });

  describe('copyToOutputPath', function() {
    beforeEach(async function() {
      tmpdir = await mkTmpDirIn(tmpRoot);
      let project = new MockProject();
      builder = new Builder({
        project,
        ui: project.ui,
        setupBroccoliBuilder,
      });
    });

    afterEach(function() {
      return fs.remove(tmpRoot);
    });

    it('allows for non-existent output-paths at arbitrary depth', function() {
      builder.outputPath = path.join(tmpdir, 'some', 'path', 'that', 'does', 'not', 'exist');

      builder.copyToOutputPath('tests/fixtures/blueprints/basic_2');
      expect(file(path.join(builder.outputPath, 'files', 'foo.txt'))).to.exist;
    });

    describe('build command', function() {
      let command;
      let parentPath = `..${path.sep}..${path.sep}`;

      beforeEach(function() {
        command = new BuildCommand(commandOptions());

        let project = new MockProject();
        builder = new Builder({
          project,
          ui: project.ui,
          setupBroccoliBuilder,
        });
      });

      it('when outputPath is root directory ie., `--output-path=/` or `--output-path=C:`', function() {
        let outputPathArg = '--output-path=.';
        let outputPath = command.parseArgs([outputPathArg]).options.outputPath;
        outputPath = outputPath.split(path.sep)[0] + path.sep;
        builder.outputPath = outputPath;

        expect(builder.canDeleteOutputPath(outputPath)).to.equal(false);
      });

      it('when outputPath is project root ie., `--output-path=.`', function() {
        let outputPathArg = '--output-path=.';
        let outputPath = command.parseArgs([outputPathArg]).options.outputPath;
        builder.outputPath = outputPath;

        expect(builder.canDeleteOutputPath(outputPath)).to.equal(false);
      });

      it(`when outputPath is a parent directory ie., \`--output-path=${parentPath}\``, function() {
        let outputPathArg = `--output-path=${parentPath}`;
        let outputPath = command.parseArgs([outputPathArg]).options.outputPath;
        builder.outputPath = outputPath;

        expect(builder.canDeleteOutputPath(outputPath)).to.equal(false);
      });

      it('allow outputPath to contain the root path as a substring, as long as it is not a parent', function() {
        let outputPathArg = '--output-path=.';
        let outputPath = command.parseArgs([outputPathArg]).options.outputPath;
        outputPath = outputPath.substr(0, outputPath.length - 1);
        builder.outputPath = outputPath;

        expect(builder.canDeleteOutputPath(outputPath)).to.equal(true);
      });
    });
  });

  describe('build', function() {
    let instrumentationStart;
    let instrumentationStop;
    let cwd, project;

    beforeEach(function() {
      // Cache cwd to reset after test
      cwd = process.cwd();
      project = new MockProject();
      builder = new Builder({
        project,
        ui: project.ui,
        setupBroccoliBuilder,
        copyToOutputPath() {
          return [];
        },
      });

      instrumentationStart = td.replace(builder.project._instrumentation, 'start');
      instrumentationStop = td.replace(builder.project._instrumentation, 'stopAndReport');
    });

    afterEach(function() {
      process.chdir(cwd);
      delete process._heimdall;
      delete process.env.BROCCOLI_VIZ;
      builder.project.ui.output = '';
      if (fs.existsSync(`${builder.project.root}/tmp`)) {
        rimraf.sync(`${builder.project.root}/tmp`);
      }
    });

    it('calls instrumentation.start', async function() {
      let mockAnnotation = 'MockAnnotation';
      await builder.build(null, mockAnnotation);
      td.verify(instrumentationStart('build'), { times: 1 });
    });

    it('calls instrumentation.stop(build, result, annotation)', async function() {
      let mockAnnotation = 'MockAnnotation';

      await builder.build(null, mockAnnotation);

      td.verify(
        instrumentationStop('build', { directory: 'build results', graph: { __heimdall__: {} } }, mockAnnotation),
        { times: 1 }
      );
    });

    it('prints a deprecation warning if it discovers a < v0.1.4 version of heimdalljs', async function() {
      process._heimdall = {};

      await builder.build();

      let output = builder.project.ui.output;
      expect(output).to.include('Heimdalljs < 0.1.4 found.  Please remove old versions');
    });

    it('does not print a deprecation warning if it does not discover a < v0.1.4 version of heimdalljs', async function() {
      expect(process._heimdall).to.equal(undefined);

      await builder.build();

      let output = builder.project.ui.output;
      expect(output).to.not.include('Heimdalljs < 0.1.4 found.  Please remove old versions');
    });

    it('writes temp files to Broccoli temp dir', async function() {
      const project = new MockProject();
      project.root += '/tests/fixtures/build/simple';
      expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;
      builder = new Builder({
        project,
        ui: project.ui,
        copyToOutputPath() {
          return [];
        },
      });

      expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;

      let result = await builder.build();
      expect(fs.existsSync(result.directory)).to.be.true;
      expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;
      rimraf.sync(result.directory);
    });

    it('produces the correct output', async function() {
      const project = new MockProject();
      project.root += '/tests/fixtures/build/simple';
      const setup = () =>
        new Builder({
          project,
          ui: project.ui,
          copyToOutputPath() {
            return [];
          },
        });

      let result = await setup().build();

      expect(fixturify.readSync(result.directory)).to.deep.equal(fixturify.readSync(`${project.root}/dist`));
    });

    it('returns {directory, graph} as the result object', async function() {
      const project = new MockProject();
      project.root += '/tests/fixtures/build/simple';

      builder = new Builder({
        project,
        ui: project.ui,
        copyToOutputPath() {
          return [];
        },
      });

      let result = await builder.build();

      expect(Object.keys(result)).to.eql(['directory', 'graph']);
      expect(result.graph.__heimdall__).to.not.be.undefined;
      expect(fs.existsSync(result.directory)).to.be.true;
    });
  });

  describe('cleanup', function() {
    beforeEach(function() {
      let project = new MockProject();
      builder = new Builder({
        project,
        ui: project.ui,
        setupBroccoliBuilder,
      });
    });

    it('is idempotent', async function() {
      let cleanupCount = 0;
      builder.builder.cleanup = function() {
        cleanupCount++;
      };

      let cleanupPromises = [builder.cleanup(), builder.cleanup(), builder.cleanup(), builder.cleanup()];

      await Promise.all(cleanupPromises);

      expect(cleanupCount).to.equal(1);
    });
  });

  describe('addons', function() {
    let hooksCalled;

    beforeEach(function() {
      hooksCalled = [];
      addon = {
        name: 'TestAddon',
        preBuild(...args) {
          hooksCalled.push(['preBuild', ...args]);
          expect(this).to.equal(addon);

          return Promise.resolve();
        },

        postBuild(...args) {
          hooksCalled.push(['postBuild', ...args]);

          return Promise.resolve();
        },

        outputReady(...args) {
          hooksCalled.push(['outputReady', ...args]);
        },

        buildError(...args) {
          hooksCalled.push(['buildError', ...args]);
        },
      };

      let project = new MockProject();
      project.addons = [addon];

      builder = new Builder({
        setupBroccoliBuilder() {
          setupBroccoliBuilder.call(this);
          let originalBuild = this.builder.build;
          this.builder.build = () => {
            hooksCalled.push(['build']);
            return originalBuild.call(this);
          };
        },
        copyToOutputPath(...args) {
          hooksCalled.push(['copyToOutputPath', ...args]);
          return [];
        },
        project,
        ui: project.ui,
      });

      buildResults = {
        directory: 'build results',
        graph: {
          __heimdall__: {},
        },
      };
    });

    afterEach(function() {
      delete process.env.BROCCOLI_VIZ;
      delete process.env.EMBER_CLI_INSTRUMENTATION;
    });

    it('allows addons to add promises preBuild', function() {
      let preBuild = td.replace(addon, 'preBuild', td.function());
      td.when(preBuild(), { ignoreExtraArgs: true, times: 1 }).thenReturn(Promise.resolve());

      return builder.build();
    });

    it('allows addons to add promises postBuild', async function() {
      let postBuild = td.replace(addon, 'postBuild', td.function());

      await builder.build();
      td.verify(postBuild(buildResults), { times: 1 });
    });

    it('allows addons to add promises outputReady', async function() {
      let outputReady = td.replace(addon, 'outputReady', td.function());

      await builder.build();

      let expected = Object.assign({ outputChanges: [] }, buildResults);
      td.verify(outputReady(expected), { times: 1 });
    });

    describe('instrumentation hooks', function() {
      beforeEach(function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';
      });

      it('invokes the instrumentation hook if it is present', async function() {
        addon.instrumentation = function(type) {
          hooksCalled.push(['instrumentation', type]);
        };

        let annotation = {};
        await builder.build(null, annotation);
        expect(hooksCalled).to.deep.equal([
          ['preBuild', annotation],
          ['build'],
          ['postBuild', buildResults],
          ['copyToOutputPath', buildResults.directory],
          ['outputReady', Object.assign({ outputChanges: [] }, buildResults)],
          ['instrumentation', 'build'],
        ]);
      });
    });

    it('hooks are called in the right order without visualization', async function() {
      await builder.build();

      expect(hooksCalled).to.deep.equal([
        ['preBuild', undefined],
        ['build'],
        ['postBuild', buildResults],
        ['copyToOutputPath', buildResults.directory],
        ['outputReady', Object.assign({ outputChanges: [] }, buildResults)],
      ]);
    });

    it('buildError receives the error object from the errored step', async function() {
      let thrownBuildError = new Error('buildError');
      let receivedBuildError;

      addon.buildError = function(errorThrown) {
        receivedBuildError = errorThrown;
      };

      builder.builder.build = function() {
        hooksCalled.push(['build']);

        return Promise.reject(thrownBuildError);
      };

      await expect(builder.build()).to.be.rejected;
      expect(receivedBuildError).to.equal(thrownBuildError);
    });

    it('calls buildError and does not call build, postBuild or outputReady when preBuild fails', async function() {
      let error = new Error('preBuild error');
      addon.preBuild = function(...args) {
        hooksCalled.push(['preBuild', ...args]);

        return Promise.reject(error);
      };

      await expect(builder.build()).to.be.rejected;
      expect(hooksCalled).to.deep.equal([
        ['preBuild', undefined],
        ['buildError', error],
      ]);
    });

    it('calls buildError and does not call postBuild or outputReady when build fails', async function() {
      let error = new Error('build Error');
      builder.builder.build = function() {
        hooksCalled.push(['build']);

        return Promise.reject(error);
      };

      await expect(builder.build()).to.be.rejected;

      expect(hooksCalled).to.deep.equal([['preBuild', undefined], ['build'], ['buildError', error]]);
    });

    it('calls buildError when postBuild fails', async function() {
      let error = new Error('postBuild Error');
      addon.postBuild = function(...args) {
        hooksCalled.push(['postBuild', ...args]);

        return Promise.reject(error);
      };

      await expect(builder.build()).to.be.rejected;

      expect(hooksCalled).to.deep.equal([
        ['preBuild', undefined],
        ['build'],
        ['postBuild', buildResults],
        ['buildError', error],
      ]);
    });

    it('calls buildError when outputReady fails', async function() {
      let error = new Error('outputReady Error');
      addon.outputReady = function(...args) {
        hooksCalled.push(['outputReady', ...args]);

        return Promise.reject(error);
      };

      await expect(builder.build()).to.be.rejected;

      expect(hooksCalled).to.deep.equal([
        ['preBuild', undefined],
        ['build'],
        ['postBuild', buildResults],
        ['copyToOutputPath', buildResults.directory],
        ['outputReady', Object.assign({ outputChanges: [] }, buildResults)],
        ['buildError', error],
      ]);
    });
  });

  describe('fallback from broccoli 2 to broccoli-builder', function() {
    it('falls back to broccoli-builder if an InvalidNode error is thrown for read/rebuild api', function() {
      let project = new MockProject();
      const builder = new Builder({
        project,
        ui: project.ui,
        readBuildFile() {
          return {
            read() {},
            rebuild() {},
          };
        },
      });

      expect(builder.broccoliBuilderFallback).to.be.true;

      expect(project.ui.output).to.include(
        'WARNING: Invalid Broccoli2 node detected, falling back to broccoli-builder. Broccoli error:'
      );
      expect(project.ui.output).to.include(
        'Object: The .read/.rebuild API is no longer supported as of Broccoli 1.0. Plugins must now derive from broccoli-plugin. https://github.com/broccolijs/broccoli/blob/master/docs/broccoli-1-0-plugin-api.md'
      );
    });

    it('errors for an invalid node', function() {
      let project = new MockProject();
      expect(
        () =>
          new Builder({
            project,
            ui: project.ui,
            readBuildFile() {
              return {};
            },
          })
      ).to.throw('[object Object] is not a Broccoli node\nused as output node');
    });
  });
});
