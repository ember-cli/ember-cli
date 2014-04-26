'use strict';

var assert   = require('../../helpers/assert');
var stub     = require('../../helpers/stub').stub;
var MockUI   = require('../../helpers/mock-ui');
var Promise  = require('../../../lib/ext/promise');
var Task     = require('../../../lib/task');

var command = require('../../../lib/commands/test');

describe('test command', function() {
  var ui;
  var env;

  beforeEach(function(){
    ui = new MockUI();
  });

  before(function(){
    env = {
      tasks: {
        build: new Task({
          run: function() { }
        }),
        test: new Task({
          run: function() { }
        })
      }
    };

    stub(env.tasks.test, 'run', Promise.resolve());
    stub(env.tasks.build, 'run', Promise.resolve());
  });

  it('builds and runs test', function() {
    var buildRun = env.tasks.build.run;
    var testRun = env.tasks.test.run;

    command.ui = ui;
    return command.run(env, {})
      .then(function(){
        assert.equal(buildRun.called, 1, 'expected build task to be called once');
        assert.equal(testRun.called, 1, 'expected test task to be called once');
      });
  });

  it('has the correct options', function() {
    var buildRun = env.tasks.build.run;
    var testRun = env.tasks.test.run;
    var options = { configFile: 'tests/testem.json' };

    command.ui = ui;
    return command.run(env, options)
      .then(function(){
        var buildOptions = buildRun.calledWith[0][0];
        var testOptions = testRun.calledWith[1][0];

        assert.equal(buildOptions.environment, 'development', 'has correct env');
        assert.ok(buildOptions.outputPath, 'has outputPath');
        assert.equal(testOptions.configFile, 'tests/testem.json', 'has config file');
      });
  });
});
