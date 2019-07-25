'use strict';

const fs = require('fs-extra');
const path = require('path');
const BuildCommand = require('../../../lib/commands/build');
const commandOptions = require('../../factories/command-options');
const RSVP = require('rsvp');
const rimraf = require('rimraf');
const fixturify = require('fixturify');
const MockProject = require('../../helpers/mock-project');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
const { isExperimentEnabled } = require('../../../lib/experiments');
const td = require('testdouble');
const ci = require('ci-info');
const chai = require('../../chai');
let expect = chai.expect;
let file = chai.file;

let root = process.cwd();
let tmproot = path.join(root, 'tmp');

let Builder;

const Promise = RSVP.Promise;
const remove = RSVP.denodeify(fs.remove);

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
      tmpdir = await mkTmpDirIn(tmproot);
      let project = new MockProject();
      builder = new Builder({
        project,
        ui: project.ui,
        setupBroccoliBuilder,
      });
    });

    afterEach(function() {
      return remove(tmproot);
    });

    (ci.APPVEYOR ? it.skip : it)('allows for non-existent output-paths at arbitrary depth', function() {
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
        processBuildResult(buildResults) {
          return Promise.resolve(buildResults);
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

    it('calls instrumentation.stop(build, result, resultAnnotation)', async function() {
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

    if (!isExperimentEnabled('SYSTEM_TEMP')) {
      it('writes temp files to project root by default', async function() {
        const project = new MockProject();
        project.root += '/tests/fixtures/build/simple';

        builder = new Builder({
          project,
          ui: project.ui,
          processBuildResult(buildResults) {
            return Promise.resolve(buildResults);
          },
        });

        await builder.build();
        expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.true;
      });
    }

    if (isExperimentEnabled('SYSTEM_TEMP')) {
      it('writes temp files to Broccoli temp dir when EMBER_CLI_SYSTEM_TEMP=1', async function() {
        const project = new MockProject();
        project.root += '/tests/fixtures/build/simple';
        expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;
        builder = new Builder({
          project,
          ui: project.ui,
          processBuildResult(buildResults) {
            return Promise.resolve(buildResults);
          },
        });

        expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;

        let result = await builder.build();
        expect(fs.existsSync(result.directory)).to.be.true;
        expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;
        rimraf.sync(result.directory);
      });
    }

    (ci.APPVEYOR ? it.skip : it)('produces the correct output', async function() {
      const project = new MockProject();
      project.root += '/tests/fixtures/build/simple';
      const setup = () =>
        new Builder({
          project,
          ui: project.ui,
          processBuildResult(buildResults) {
            return Promise.resolve(buildResults);
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
        processBuildResult(buildResults) {
          return Promise.resolve(buildResults);
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
        processBuildResult(buildResults) {
          return Promise.resolve(buildResults);
        },
      });
    });

    it('is idempotent', function() {
      let firstCleanupPromise = builder.cleanup();
      expect(builder.cleanup()).to.equal(firstCleanupPromise);

      return firstCleanupPromise;
    });
  });

  describe('addons', function() {
    let hooksCalled;

    beforeEach(function() {
      hooksCalled = [];
      addon = {
        name: 'TestAddon',
        preBuild() {
          hooksCalled.push('preBuild');
          expect(this).to.equal(addon);

          return Promise.resolve();
        },

        postBuild() {
          hooksCalled.push('postBuild');

          return Promise.resolve();
        },

        outputReady() {
          hooksCalled.push('outputReady');
        },

        buildError() {
          hooksCalled.push('buildError');
        },
      };

      let project = new MockProject();
      project.addons = [addon];

      builder = new Builder({
        setupBroccoliBuilder() {
          setupBroccoliBuilder.call(this);
          let originalBuild = this.builder.build;
          this.builder.build = () => {
            hooksCalled.push('build');
            return originalBuild.call(this);
          };
        },
        processBuildResult(buildResults) {
          return Promise.resolve(buildResults);
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
      td.verify(outputReady(buildResults), { times: 1 });
    });

    describe('instrumentation hooks', function() {
      beforeEach(function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';
      });

      it('invokes the instrumentation hook if it is preset', async function() {
        addon.instrumentation = function() {
          hooksCalled.push('instrumentation');
        };

        await builder.build(null, {});
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady', 'instrumentation']);
      });
    });

    it('hooks are called in the right order without visualization', async function() {
      await builder.build();
      expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady']);
    });

    it('should call postBuild before processBuildResult', async function() {
      let called = [];

      addon.postBuild = function() {
        called.push('postBuild');
      };

      builder.processBuildResult = function() {
        called.push('processBuildResult');
      };

      await builder.build();
      expect(called).to.deep.equal(['postBuild', 'processBuildResult']);
    });

    it('should call outputReady after processBuildResult', async function() {
      let called = [];

      builder.processBuildResult = function() {
        called.push('processBuildResult');
      };

      addon.outputReady = function() {
        called.push('outputReady');
      };

      await builder.build();
      expect(called).to.deep.equal(['processBuildResult', 'outputReady']);
    });

    it('buildError receives the error object from the errored step', async function() {
      let thrownBuildError = new Error('buildError');
      let receivedBuildError;

      addon.buildError = function(errorThrown) {
        receivedBuildError = errorThrown;
      };

      builder.builder.build = function() {
        hooksCalled.push('build');

        return Promise.reject(thrownBuildError);
      };

      await expect(builder.build()).to.be.rejected;
      expect(receivedBuildError).to.equal(thrownBuildError);
    });

    it('calls buildError and does not call build, postBuild or outputReady when preBuild fails', async function() {
      addon.preBuild = function() {
        hooksCalled.push('preBuild');

        return Promise.reject(new Error('preBuild Error'));
      };

      await expect(builder.build()).to.be.rejected;
      expect(hooksCalled).to.deep.equal(['preBuild', 'buildError']);
    });

    it('calls buildError and does not call postBuild or outputReady when build fails', async function() {
      builder.builder.build = function() {
        hooksCalled.push('build');

        return Promise.reject(new Error('build Error'));
      };

      await expect(builder.build()).to.be.rejected;
      expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'buildError']);
    });

    it('calls buildError when postBuild fails', async function() {
      addon.postBuild = function() {
        hooksCalled.push('postBuild');

        return Promise.reject(new Error('preBuild Error'));
      };

      await expect(builder.build()).to.be.rejected;
      expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'buildError']);
    });

    it('calls buildError when outputReady fails', async function() {
      addon.outputReady = function() {
        hooksCalled.push('outputReady');

        return Promise.reject(new Error('outputReady Error'));
      };

      await expect(builder.build()).to.be.rejected;
      expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady', 'buildError']);
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
