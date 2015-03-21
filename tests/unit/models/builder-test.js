'use strict';

var fs              = require('fs-extra');
var path            = require('path');
var Builder         = require('../../../lib/models/builder');
var BuildCommand    = require('../../../lib/commands/build');
var commandOptions  = require('../../factories/command-options');
var touch           = require('../../helpers/file-utils').touch;
var expect          = require('chai').expect;
var Promise         = require('../../../lib/ext/promise');
var stub            = require('../../helpers/stub').stub;
var MockProject     = require('../../helpers/mock-project');
var remove          = Promise.denodeify(fs.remove);
var tmp             = require('tmp-sync');

var root            = process.cwd();
var tmproot         = path.join(root, 'tmp');

describe('models/builder.js', function() {
  var addon, builder, buildResults, outputPath, tmpdir;

  describe('copyToOutputPath', function() {
    beforeEach(function() {
      tmpdir  = tmp.in(tmproot);

      builder = new Builder({
        setupBroccoliBuilder: function() { },
        trapSignals: function() { },
        cleanupOnExit: function() { },
        project: new MockProject()
      });
    });

    afterEach(function() {
      return remove(tmproot);
    });

    it('allows for non-existent output-paths at arbitrary depth', function() {
      builder.outputPath = path.join(tmpdir, 'some', 'path', 'that', 'does', 'not', 'exist');

      return builder.copyToOutputPath('tests/fixtures/blueprints/basic_2')
        .then(function() {
          expect(fs.existsSync(path.join(builder.outputPath, 'files', 'foo.txt'))).to.equal(true);
        });
    });
  });

  it('clears the outputPath when multiple files are present', function() {
    outputPath     = 'tmp/builder-fixture/';
    var firstFile  = outputPath + '/assets/foo-bar.js';
    var secondFile = outputPath + '/assets/baz-bif.js';

    fs.mkdirsSync(outputPath + '/assets/');
    touch(firstFile);
    touch(secondFile);

    builder = new Builder({
      setupBroccoliBuilder: function() { },
      trapSignals:          function() { },
      cleanupOnExit:        function() { },

      outputPath: outputPath,
      project: new MockProject()
    });

    return builder.clearOutputPath()
      .then(function() {
        expect(fs.existsSync(firstFile)).to.equal(false);
        expect(fs.existsSync(secondFile)).to.equal(false);
      });
  });

  describe('build', function () {
    it('cleans babel errors', function() {
      var error = new Error('Bad things are bad');
      error._babel = true;
      error.stack = [ '  2 | function {',
                      '> 3 | ', 
                      '    | ^',
                      '  4 | }',
                      'at somewhere.js:1:3'].join('\n');

      builder = new Builder({
        builder: { build: function () { throw error; } },
        processAddonBuildSteps: function () { return Promise.resolve(); },
        setupBroccoliBuilder: function() {},
        trapSignals: function() { },
        cleanupOnExit: function() { },
        project: new MockProject()
      });

      return builder.build()
        .then(function () {
          expect(false).to.true;
        })
        .catch(function (error) {
          expect(error.stack).to.equal('at somewhere.js:1:3');
        });
    });
  });

  describe('Prevent deletion of files for improper outputPath', function() {
    var command;

    before(function() {
      command = new BuildCommand(commandOptions({
        settings: {}
      }));

      builder = new Builder({
        setupBroccoliBuilder: function() { },
        trapSignals: function() { },
        cleanupOnExit: function() { },
        project: new MockProject()
      });
    });

    it('when outputPath is root directory ie., `--output-path=/`', function() {
      var outputPathArg = '--output-path=/';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      builder.outputPath = outputPath;

      return builder.clearOutputPath()
        .catch(function(error) {
          expect(error.message).to.equal('Using a build destination path of `' + outputPath + '` is not supported.');
        });
    });

    it('when outputPath is project root ie., `--output-path=.`', function() {
      var outputPathArg = '--output-path=.';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      builder.outputPath = outputPath;

      return builder.clearOutputPath()
        .catch(function(error) {
          expect(error.message).to.equal('Using a build destination path of `' + outputPath + '` is not supported.');
        });
    });

    it('when outputPath is a parent directory ie., `--output-path=../../`', function() {
      var outputPathArg = '--output-path=../../';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      builder.outputPath = outputPath;

      return builder.clearOutputPath()
        .catch(function(error) {
          expect(error.message).to.equal('Using a build destination path of `' + outputPath + '` is not supported.');
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

        buildError: function() {
          hooksCalled.push('buildError');
        },
      };

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
        project: {
          addons: [addon]
        }
      });

      buildResults = 'build results';
    });

    it('allows addons to add promises preBuild', function() {
      var preBuild = stub(addon, 'preBuild', Promise.resolve());

      return builder.build().then(function() {
        expect(preBuild.called).to.equal(1, 'expected preBuild to be called');
      });
    });

    it('allows addons to add promises postBuild', function() {
      var postBuild = stub(addon, 'postBuild');

      return builder.build().then(function() {
        expect(postBuild.called).to.equal(1, 'expected postBuild to be called');
        expect(postBuild.calledWith[0][0]).to.equal(buildResults, 'expected postBuild to be called with the results');
      });
    });

    it('hooks are called in the right order', function() {
      return builder.build().then(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild']);
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
        expect(false, 'should not succeed');
      }).catch(function() {
        expect(receivedBuildError).to.equal(thrownBuildError);
      });
    });

    it('calls buildError and does not call build or postBuild when preBuild fails', function() {
      addon.preBuild = function() {
        hooksCalled.push('preBuild');

        return Promise.reject(new Error('preBuild Error'));
      };

      return builder.build().then(function() {
        expect(false, 'should not succeed');
      }).catch(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'buildError']);
      });
    });

    it('calls buildError and does not call postBuild when build fails', function() {
      builder.builder.build = function() {
        hooksCalled.push('build');

        return Promise.reject(new Error('build Error'));
      };

      return builder.build().then(function() {
        expect(false, 'should not succeed');
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
        expect(false, 'should not succeed');
      }).catch(function() {
        expect(hooksCalled).to.deep.equal(['preBuild', 'build', 'postBuild', 'buildError']);
      });
    });
  });
});
