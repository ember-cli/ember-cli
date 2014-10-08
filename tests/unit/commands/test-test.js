'use strict';

var assert         = require('../../helpers/assert');
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var Promise        = require('../../../lib/ext/promise');
var Task           = require('../../../lib/models/task');
var path           = require('path');
var fs             = require('fs');

var TestCommand = require('../../../lib/commands/test');

describe('test command', function() {
  var tasks;
  var options;
  var npmValidate;
  var buildRun;
  var testRun;

  beforeEach(function(){
    tasks = {
      NpmValidate: Task.extend(),
      Build: Task.extend(),
      Test: Task.extend()
    };

    options = commandOptions({
      tasks: tasks,
      testing: true,
      settings: {}
    });

    stub(tasks.NpmValidate.prototype,  'run', Promise.resolve());
    stub(tasks.Test.prototype,  'run', Promise.resolve());
    stub(tasks.Build.prototype, 'run', Promise.resolve());

    npmValidate = tasks.NpmValidate.prototype.run;
    buildRun = tasks.Build.prototype.run;
    testRun  = tasks.Test.prototype.run;
  });

  afterEach(function() {
    tasks.NpmValidate.prototype.run.restore();
    tasks.Build.prototype.run.restore();
    tasks.Test.prototype.run.restore();
  });

  it('validates dependencies, then builds and runs test', function() {
    return new TestCommand(options).validateAndRun([]).then(function() {
      assert.equal(npmValidate.called, 1, 'expected npmValidate to be called once');
      assert.equal(buildRun.called, 1, 'expected build task to be called once');
      assert.equal(testRun.called, 1,  'expected test task to be called once');
    });
  });

  it('has the correct options', function() {
    return new TestCommand(options).validateAndRun([]).then(function() {
      var buildOptions = buildRun.calledWith[0][0];
      var testOptions  = testRun.calledWith[0][0];

      assert.equal(buildOptions.environment, 'test', 'has correct env');
      assert.ok(buildOptions.outputPath,     'has outputPath');
      assert.equal(testOptions.configFile,   './testem.json', 'has config file');
      assert.equal(testOptions.port,         7357, 'has config file');
    });
  });

  it('passes through custom configFile option', function() {
    return new TestCommand(options).validateAndRun(['--config-file=some-random/path.json']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      assert.equal(testOptions.configFile, 'some-random/path.json');
    });
  });

  it('passes through custom port option', function() {
    return new TestCommand(options).validateAndRun(['--port=5678']).then(function() {
      var testOptions  = testRun.calledWith[0][0];

      assert.equal(testOptions.port, 5678);
    });
  });

  describe('_generateCustomConfigFile', function() {
    var command;
    var runOptions;
    var fixturePath;

    beforeEach(function() {
      fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'tasks', 'default-testem-config');
      command = new TestCommand(options);
      runOptions = {
        configFile: path.join(fixturePath, 'testem.json')
      };
    });

    afterEach(function() {
      command.rmTmp();
    });

    it('should return a valid path', function() {
      var newPath = command._generateCustomConfigFile(runOptions);

      assert.ok(fs.existsSync(newPath));
    });

    it('should return the original path if filter isn\'t present', function() {
      var originalPath = runOptions.configFile;
      var newPath = command._generateCustomConfigFile(runOptions);

      assert.equal(newPath, originalPath);
    });

    it('when filter option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.filter = 'foo';
      var newPath = command._generateCustomConfigFile(runOptions);

      assert.notEqual(newPath, originalPath);
      assert.ok(fs.existsSync(newPath), 'file should exist');
    });

    it('new file returned contains the filter option value in test_page', function() {
      runOptions.filter = 'foo';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      assert.ok(contents['test_page'].indexOf('foo') > -1);
    });
  });
});
