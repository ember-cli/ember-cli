'use strict';

var assert         = require('../../helpers/assert');
var commandOptions = require('../../factories/command-options');
var stub           = require('../../helpers/stub').stub;
var Promise        = require('../../../lib/ext/promise');
var Task           = require('../../../lib/models/task');
var CoreObject     = require('core-object');
var path           = require('path');
var fs             = require('fs');

var TestCommand = require('../../../lib/commands/test');

describe('test command', function() {
  var tasks;
  var options;
  var buildRun;
  var testRun;
  var testServerRun;

  beforeEach(function(){
    tasks = {
      Build: Task.extend(),
      Test: Task.extend(),
      TestServer: Task.extend()
    };

    options = commandOptions({
      tasks: tasks,
      testing: true,
      settings: {}
    });

    stub(tasks.Test.prototype,  'run', Promise.resolve());
    stub(tasks.Build.prototype, 'run', Promise.resolve());

    buildRun = tasks.Build.prototype.run;
    testRun  = tasks.Test.prototype.run;

    stub(tasks.TestServer.prototype, 'run', Promise.resolve());
    testServerRun = tasks.TestServer.prototype.run;
  });

  it('builds and runs test', function() {
    return new TestCommand(options).validateAndRun([]).then(function() {
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

  describe('--server option', function() {
    beforeEach(function() {
      options.Builder = CoreObject.extend();
      options.Watcher = CoreObject.extend();
    });

    it('builds a watcher with verbose set to false', function() {
      return new TestCommand(options).validateAndRun(['--server']).then(function() {
        var testOptions  = testServerRun.calledWith[0][0];

        assert.equal(testOptions.watcher.verbose, false);
      });
    });

    it('builds a watcher with options.watcher set to value provided', function() {
      return new TestCommand(options).validateAndRun(['--server', '--watcher=polling']).then(function() {
        var testOptions  = testServerRun.calledWith[0][0];

        assert.equal(testOptions.watcher.options.watcher, 'polling');
      });
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

    it('should return the original path if filter or module isn\'t present', function() {
      var originalPath = runOptions.configFile;
      var newPath = command._generateCustomConfigFile(runOptions);

      assert.equal(newPath, originalPath);
    });

    it('when module and filter option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.module = 'fooModule';
      runOptions.filter = 'bar';
      var newPath = command._generateCustomConfigFile(runOptions);

      assert.notEqual(newPath, originalPath);
      assert.ok(fs.existsSync(newPath), 'file should exist');
    });

    it('when filter option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.filter = 'foo';
      var newPath = command._generateCustomConfigFile(runOptions);

      assert.notEqual(newPath, originalPath);
      assert.ok(fs.existsSync(newPath), 'file should exist');
    });

    it('when module option is present the new file path returned exists', function() {
      var originalPath = runOptions.configFile;
      runOptions.module = 'fooModule';
      var newPath = command._generateCustomConfigFile(runOptions);

      assert.notEqual(newPath, originalPath);
      assert.ok(fs.existsSync(newPath), 'file should exist');
    });

    it('when provided filter and module the new file returned contains the both option values in test_page', function() {
      runOptions.module = 'fooModule';
      runOptions.filter = 'bar';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      assert.ok(contents['test_page'].indexOf('fooModule') > -1);
      assert.ok(contents['test_page'].indexOf('bar') > -1);
    });

    it('new file returned contains the filter option value in test_page', function() {
      runOptions.filter = 'foo';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      assert.ok(contents['test_page'].indexOf('foo') > -1);
    });

    it('new file returned contains the module option value in test_page', function() {
      runOptions.module = 'fooModule';
      var newPath = command._generateCustomConfigFile(runOptions);
      var contents = JSON.parse(fs.readFileSync(newPath, { encoding: 'utf8' }));

      assert.ok(contents['test_page'].indexOf('fooModule') > -1);
    });
  });
});
