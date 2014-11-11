'use strict';

var fs              = require('fs-extra');
var path            = require('path');
var Builder         = require('../../../lib/models/builder');
var BuildCommand    = require('../../../lib/commands/build');
var commandOptions  = require('../../factories/command-options');
var touch           = require('../../helpers/file-utils').touch;
var assert          = require('assert');
var Promise         = require('../../../lib/ext/promise');
var stub            = require('../../helpers/stub').stub;
var MockProject     = require('../../helpers/mock-project');
var rimraf          = Promise.denodeify(require('rimraf'));
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
      return rimraf(tmproot);
    });

    it('allows for non-existent output-paths at arbitrary depth', function() {
      builder.outputPath = path.join(tmpdir, 'some', 'path', 'that', 'does', 'not', 'exist');

      return builder.copyToOutputPath('tests/fixtures/blueprints/basic_2')
        .then(function() {
          assert(fs.existsSync(path.join(builder.outputPath, 'files', 'foo.txt')));
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
        assert(!fs.existsSync(firstFile));
        assert(!fs.existsSync(secondFile));
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
          assert.equal(error.message, 'Using a build destination path of `' + outputPath + '` is not supported.');
        });
    });

    it('when outputPath is project root ie., `--output-path=.`', function() {
      var outputPathArg = '--output-path=.';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      builder.outputPath = outputPath;

      return builder.clearOutputPath()
        .catch(function(error) {
          assert.equal(error.message, 'Using a build destination path of `' + outputPath + '` is not supported.');
        });
    });

    it('when outputPath is a parent directory ie., `--output-path=../../`', function() {
      var outputPathArg = '--output-path=../../';
      var outputPath = command.parseArgs([outputPathArg]).options.outputPath;
      builder.outputPath = outputPath;

      return builder.clearOutputPath()
        .catch(function(error) {
          assert.equal(error.message, 'Using a build destination path of `' + outputPath + '` is not supported.');
        });
    });
  });

  describe('addons', function() {

    before(function() {
      addon = {
        name: 'TestAddon',
        preBuild: function() { },
        postBuild: function() { }
      };

      builder = new Builder({
        setupBroccoliBuilder: function() { },
        trapSignals:          function() { },
        cleanupOnExit:        function() { },
        builder: {
          build: function() { return Promise.resolve(buildResults); }
        },
        processBuildResult: function(buildResults) { return Promise.resolve(buildResults); },
        project: {
          addons: [addon]
        }
      });

      buildResults = 'build results';
    });

    it('allows addons to add promises preBuild', function() {
      var preBuild = stub(addon, 'preBuild');

      return builder.build().then(function() {
        assert.equal(preBuild.called, 1, 'expected preBuild to be called');
        assert.equal(preBuild.calledWith[0][0], buildResults, 'expected preBuild to be called with the results');
      });
    });

    it('allows addons to add promises postBuild', function() {
      var postBuild = stub(addon, 'postBuild');

      return builder.build().then(function() {
        assert.equal(postBuild.called, 1, 'expected postBuild to be called');
        assert.equal(postBuild.calledWith[0][0], buildResults, 'expected postBuild to be called with the results');
      });
    });
  });

  describe('detectChangedFiles', function() {
    beforeEach(function() {
      tmpdir  = tmp.in(tmproot);

      builder = new Builder({
        outputPath: tmpdir,
        setupBroccoliBuilder: function() { },
        trapSignals: function() { },
        cleanupOnExit: function() { },
        project: new MockProject()
      });
    });

    afterEach(function() {
      return rimraf(tmproot);
    });

    it('compares new output directory with old', function() {
      var buildResult = {directory: 'tests/fixtures/builder/first'};
      return builder.processBuildResult(buildResult)
        .then(function(results) {
          assert(results.outputChanges.indexOf('output.js') !== -1, 'output.js is changed');
          assert(results.outputChanges.indexOf('output.css') !== -1, 'output.css is changed');
          return builder.processBuildResult(buildResult);
        })
        .then(function(results) {
          assert(results.outputChanges.length === 0, 'no files are changed');
          return builder.processBuildResult({
            directory: 'tests/fixtures/builder/second'
          });
        })
        .then(function(results) {
          assert(results.outputChanges.indexOf('output.js') !== -1, 'output.js is changed');
          assert.equal(results.outputChanges.length, 1, 'no other files are changed');
        });
    });
  });

});
