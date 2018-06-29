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
const experiments = require('../../../lib/experiments/index');
const td = require('testdouble');
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
    if (this.broccoli2) {
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
        cleanup() {
        },
      };
    } else {
      this.builder = {
        build() {
          return Promise.resolve({
            directory: 'build results',
            graph: {
              __heimdall__: {},
            },
          });
        },
        cleanup() {
          return Promise.resolve('cleanup result');
        },
      };
    }
  }

  before(function() {
    td.replace('../../../lib/utilities/will-interrupt-process', {
      addHandler: td.function(),
      removeHandler: td.function(),
    });

    Builder = require('../../../lib/models/builder');
  });

  afterEach(function() {
    if (builder) {
      return builder.cleanup();
    }
  });

  describe('copyToOutputPath', function() {
    beforeEach(function() {
      return mkTmpDirIn(tmproot).then(function(dir) {
        tmpdir = dir;
        builder = new Builder({
          setupBroccoliBuilder,
          project: new MockProject(),
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

    let command;

    let parentPath = `..${path.sep}..${path.sep}`;

    before(function() {
      command = new BuildCommand(commandOptions());

      builder = new Builder({
        setupBroccoliBuilder,
        project: new MockProject(),
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

  describe('build', function() {
    let instrumentationStart;
    let instrumentationStop;
    let cwd;

    beforeEach(function() {
      // Cache cwd to reset after test
      cwd = process.cwd();
      builder = new Builder({
        setupBroccoliBuilder,
        project: new MockProject(),
        processBuildResult(buildResults) { return Promise.resolve(buildResults); },
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

    it('calls instrumentation.start', function() {
      let mockAnnotation = 'MockAnnotation';
      return builder.build(null, mockAnnotation).then(function() {
        td.verify(instrumentationStart('build'), { times: 1 });
      });
    });

    it('calls instrumentation.stop(build, result, resultAnnotation)', function() {
      let mockAnnotation = 'MockAnnotation';

      return builder.build(null, mockAnnotation).then(function() {
        td.verify(instrumentationStop('build', { directory: 'build results', graph: { __heimdall__: {} } }, mockAnnotation), { times: 1 });
      });
    });

    it('prints a deprecation warning if it discovers a < v0.1.4 version of heimdalljs', function() {
      process._heimdall = {};

      return builder.build().then(function() {
        let output = builder.project.ui.output;

        expect(output).to.include('Heimdalljs < 0.1.4 found.  Please remove old versions');
      });
    });

    it('does not print a deprecation warning if it does not discover a < v0.1.4 version of heimdalljs', function() {
      expect(process._heimdall).to.equal(undefined);

      return builder.build().then(function() {
        let output = builder.project.ui.output;

        expect(output).to.not.include('Heimdalljs < 0.1.4 found.  Please remove old versions');
      });
    });

    if (!experiments.SYSTEM_TEMP) {
      it('writes temp files to project root by default', function() {
        const project = new MockProject();
        project.root += '/tests/fixtures/build/simple';

        builder = new Builder({
          project,
          processBuildResult(buildResults) { return Promise.resolve(buildResults); },
        });

        return builder.build().then(function() {
          expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.true;
        });
      });
    }

    if (experiments.SYSTEM_TEMP) {
      it('writes temp files to Broccoli temp dir when EMBER_CLI_SYSTEM_TEMP=1', function() {
        const project = new MockProject();
        project.root += '/tests/fixtures/build/simple';
        expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;
        builder = new Builder({
          project,
          processBuildResult(buildResults) { return Promise.resolve(buildResults); },
        });

        expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;
        return builder.build().then(function(result) {
          expect(fs.existsSync(result.directory)).to.be.true;
          expect(fs.existsSync(`${builder.project.root}/tmp`)).to.be.false;
          rimraf.sync(result.directory);
        });
      });
    }

    it('produces the correct output', function() {
      const project = new MockProject();
      project.root += '/tests/fixtures/build/simple';
      const setup = () => new Builder({
        project,
        processBuildResult(buildResults) { return Promise.resolve(buildResults); },
      });

      return setup().build().then(result => {
        expect(fixturify.readSync(result.directory)).to.deep.equal(fixturify.readSync(`${project.root}/dist`));
      });
    });

    it('returns {directory, graph} as the result object', function() {
      const project = new MockProject();
      project.root += '/tests/fixtures/build/simple';

      builder = new Builder({
        project,
        processBuildResult(buildResults) { return Promise.resolve(buildResults); },
      });

      return builder.build().then(function(result) {
        expect(Object.keys(result)).to.eql(['directory', 'graph']);
        if (experiments.BROCCOLI_2) {
          expect(result.graph.__heimdall__).to.not.be.undefined;
        } else {
          expect(result.graph.constructor.name).to.equal('Node');
        }
        expect(fs.existsSync(result.directory)).to.be.true;
      });
    });
  });

  describe('cleanup', function() {
    beforeEach(function() {
      builder = new Builder({
        setupBroccoliBuilder,
        project: new MockProject(),
        processBuildResult(buildResults) { return Promise.resolve(buildResults); },
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
        processBuildResult(buildResults) { return Promise.resolve(buildResults); },
        project,
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

    it('allows addons to add promises postBuild', function() {
      let postBuild = td.replace(addon, 'postBuild', td.function());

      return builder.build().then(function() {
        td.verify(postBuild(buildResults), { times: 1 });
      });
    });

    it('allows addons to add promises outputReady', function() {
      let outputReady = td.replace(addon, 'outputReady', td.function());

      return builder.build().then(function() {
        td.verify(outputReady(buildResults), { times: 1 });
      });
    });


    describe('instrumentation hooks', function() {
      beforeEach(function() {
        process.env.EMBER_CLI_INSTRUMENTATION = '1';
      });

      it('invokes the instrumentation hook if it is preset', function() {
        addon.instrumentation = function() {
          hooksCalled.push('instrumentation');
        };

        return builder.build(null, {}).then(function() {
          expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady', 'instrumentation']);
        });
      });
    });

    it('hooks are called in the right order without visualization', function() {
      return builder.build().then(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady']);
      });
    });

    it('should call postBuild before processBuildResult', function() {
      let called = [];

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
      let called = [];

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
      let thrownBuildError = new Error('buildError');
      let receivedBuildError;

      addon.buildError = function(errorThrown) {
        receivedBuildError = errorThrown;
      };

      builder.builder.build = function() {
        hooksCalled.push('build');

        return Promise.reject(thrownBuildError);
      };

      return expect(builder.build()).to.be.rejected.then(() => {
        expect(receivedBuildError).to.equal(thrownBuildError);
      });
    });

    it('calls buildError and does not call build, postBuild or outputReady when preBuild fails', function() {
      addon.preBuild = function() {
        hooksCalled.push('preBuild');

        return Promise.reject(new Error('preBuild Error'));
      };

      return expect(builder.build()).to.be.rejected.then(() => {
        expect(hooksCalled).to.deep.equal(['preBuild', 'buildError']);
      });
    });

    it('calls buildError and does not call postBuild or outputReady when build fails', function() {
      builder.builder.build = function() {
        hooksCalled.push('build');

        return Promise.reject(new Error('build Error'));
      };

      return expect(builder.build()).to.be.rejected.then(() => {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'buildError']);
      });
    });

    it('calls buildError when postBuild fails', function() {
      addon.postBuild = function() {
        hooksCalled.push('postBuild');

        return Promise.reject(new Error('preBuild Error'));
      };

      return expect(builder.build()).to.be.rejected.then(() => {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'buildError']);
      });
    });

    it('calls buildError when outputReady fails', function() {
      addon.outputReady = function() {
        hooksCalled.push('outputReady');

        return Promise.reject(new Error('outputReady Error'));
      };

      return expect(builder.build()).to.be.rejected.then(() => {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady', 'buildError']);
      });
    });
  });
});
