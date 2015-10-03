'use strict';

var expect     = require('chai').expect;
var MockUI     = require('../../helpers/mock-ui');
var BowerTask = require('../../../lib/tasks/bower-task');
var bower;

describe('bower task', function() {
  var ui;

  var testCalledWithArgs, testCalledWithOptions, testCalledWithConfig,  testCalled;

  var Bower = function() {
    // auto resolved on 'end' event with reject
    this.on = function(eventName, callback) {
      if (eventName === 'end') {
        callback(this);
      } else if (eventName === 'log') {
        callback({
          id: 'bower-message-id',
          message: 'logged message',
          level: 'info'
        });
      }
      return this;
    }.bind(this);

    var testCommand = function(args, options, config) {
      testCalled = true;
      testCalledWithArgs = args;
      testCalledWithOptions = options;
      testCalledWithConfig = config;
      return this;
    }.bind(this);

    return {
      on: this.on,
      commands: {
        test: testCommand
      }
    };
  };

  describe('existent command', function() {
    beforeEach(function() {
      testCalled = false;
      testCalledWithArgs = undefined;
      testCalledWithOptions = undefined;
      bower = new Bower();
    });

    it('without arguments', function() {
      ui = new MockUI();

      var task = new BowerTask({
        command: 'test',
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        bower: bower
      });

      return task.run({}).then(function() {
        expect(ui.output).to.include('test completed');

        // @todo: should be an empty array
        expect(testCalledWithArgs).to.deep.equal([]);
        expect(testCalledWithOptions).to.deep.equal({verbose: false});
      });
    });

    it('with --dry-run', function() {
      ui = new MockUI();

      var task = new BowerTask({
        command: 'test',
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        bower: bower
      });

      return task.run({
        dryRun: true
      }).then(function() {
        expect(testCalled).to.equal(false);
      });
    });

    it('with --verbose', function() {
      ui = new MockUI();

      var task = new BowerTask({
        command: 'test',
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        bower: bower
      });

      return task.run({
        verbose: true
      }).then(function() {
        expect(testCalledWithOptions).to.deep.equal({verbose: true});
        expect(ui.output).to.include('logged message');
      });
    });

  });

  it('empty command name', function() {
    bower = new Bower();
    ui = new MockUI();

    try {
      new BowerTask({
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        bower: bower
      });
    } catch (e) {
      expect(e.message).to.equal('Command name is not specified');
    }
  });

  it('non-existent command without arguments', function() {
    var expectedErrorMessage = '`bower non-existent` not found';
    bower = new Bower();
    ui = new MockUI();

    var task = new BowerTask({
      command: 'non-existent',
      startProgressMessage: 'test started',
      completionMessage: 'test completed',
      ui: ui,
      bower: bower
    });

    return task.run({}).catch(function() {
      expect(ui.output).to.include(expectedErrorMessage);
    });
  });

  it('should be interactive', function() {
    bower = new Bower();
    ui = new MockUI();

    var bowerConfigInstance = {};
    var bowerConfig = {
      read: function() {
        return bowerConfigInstance;
      }
    };

    var task = new BowerTask({
      command: 'test',
      ui: ui,
      bower: bower,
      bowerConfig: bowerConfig
    });

    return task.run({}).catch(function() {
      expect(bowerConfigInstance.interactive).to.be.equal(true);
    });
  });
});

