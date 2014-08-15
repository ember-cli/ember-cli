'use strict';

var assert         = require('../../helpers/assert');
var commandOptions = require('../../factories/command-options');
var stub           = require('../../helpers/stub').stub;
var Promise        = require('../../../lib/ext/promise');
var Task           = require('../../../lib/models/task');

var TestCommand = require('../../../lib/commands/test');

describe('test command', function() {
  var tasks;
  var options;
  var buildRun;
  var testRun;

  beforeEach(function(){
    tasks = {
      Build: Task.extend(),
      Test: Task.extend()
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
});
