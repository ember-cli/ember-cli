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

var chai = require('../../chai');
var expect = chai.expect;
var file = chai.file;

var root            = process.cwd();
var tmproot         = path.join(root, 'tmp');

describe('models/builder.js', function() {
  var addon, builder, buildResults, tmpdir;

  describe('._enableFSMonitorIfVizEnabled', function() {
    var originalBroccoliViz = process.env.BROCCOLI_VIZ;
    var originalStatSync = fs.statSync;

    beforeEach(function () {
      expect(!!process.env.BROCCOLI_VIZ).to.eql(false);
    });

    afterEach(function() {
      delete process.env.BROCCOLI_VIZ;
    });

    it('if VIZ is NOT enabled, do not monitor', function() {
      var monitor = Builder._enableFSMonitorIfVizEnabled();
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
      var monitor = Builder._enableFSMonitorIfVizEnabled();
      try {
        expect(fs.statSync).to.not.equal(originalStatSync);
        expect(monitor.state).to.eql('active');
      } finally {
        monitor.stop();
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
        setupBroccoliBuilder: function() { },
        cleanup: function() { },
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
        setupBroccoliBuilder: function() { },
        cleanupOnExit: function() { },
        trapWindowsSignals: trapWindowsSignals,
        project: new MockProject()
      });

      builder.trapSignals();
      td.verify(trapWindowsSignals(), {times: 0, ignoreExtraArgs: true});
    });
  });

  describe('copyToOutputPath', function() {
    beforeEach(function() {
      return mkTmpDirIn(tmproot).then(function(dir) {
        tmpdir = dir;
        builder = new Builder({
          setupBroccoliBuilder: function() { },
          trapSignals: function() { },
          cleanupOnExit: function() { },
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
        setupBroccoliBuilder: function() { },
        trapSignals: function() { },
        cleanupOnExit: function() { },
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
        setupBroccoliBuilder: function() { },
        trapSignals: function() { },
        cleanupOnExit: function() { },
        project: new MockProject(),
        builder: {
          build: function () {
            return Promise.resolve('build results');
          }
        },
        processBuildResult: function(buildResults) { return Promise.resolve(buildResults); },
      });
    });

    afterEach(function () {
      delete process._heimdall;
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

    beforeEach(function() {
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

      var project = new MockProject();
      project.addons = [addon];

      builder = new Builder({
        setupBroccoliBuilder: function() { },
        trapSignals:          function() { },
        cleanupOnExit:        function() { },
        builder: {
          build: function() {
            hooksCalled.push('build');

            return Promise.resolve(buildResults);
          }
        },
        processBuildResult: function(buildResults) { return Promise.resolve(buildResults); },
        project: project,
      });

      buildResults = 'build results';
    });

    it('allows addons to add promises preBuild', function() {
      var preBuild = td.replace(addon, 'preBuild', td.function());
      td.when(preBuild(), {ignoreExtraArgs: true}).thenReturn(Promise.resolve());

      return builder.build().then(function() {
        td.verify(preBuild(), {ignoreExtraArgs: true});
      });
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

    it('hooks are called in the right order', function() {
      return builder.build().then(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'outputReady']);
      });
    });

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
