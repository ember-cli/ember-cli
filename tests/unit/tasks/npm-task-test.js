'use strict';

var expect     = require('chai').expect;
var MockUI     = require('../../helpers/mock-ui');
var NpmTask = require('../../../lib/tasks/npm-task');

describe('npm task', function() {
  var ui;

  var loadCalledWith;
  var testCalledWith;

  var npm = {
    load: function(options, callback) {
      setTimeout(function() {
        callback(undefined, npm);
      }, 0);
      loadCalledWith = options;
    },
    commands: {
      test: function(args, callback) {
        setTimeout(callback, 0);
        testCalledWith = args;
      }
    }
  };

  beforeEach(function() {
    testCalledWith = loadCalledWith = undefined;
  });

  describe('existent command', function() {
    beforeEach(function() {
      testCalledWith = loadCalledWith = undefined;
    });

    it('without arguments', function() {
      ui = new MockUI();

      var task = new NpmTask({
        command: 'test',
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        npm: npm
      });

      return task.run({}).then(function() {
        expect(ui.output).to.include('test completed');

        expect(testCalledWith).to.deep.equal([]);
      });
    });

    it('without options', function() {
      ui = new MockUI();

      var task = new NpmTask({
        command: 'test',
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        npm: npm
      });

      return task.run({}).then(function() {
        expect(loadCalledWith).to.deep.equal({
          loglevel: 'error',
          logstream: ui.outputStream,
          color: 'always'
        });
      });
    });

    it('with verbose option', function() {
      ui = new MockUI();

      var task = new NpmTask({
        command: 'test',
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        npm: npm
      });

      return task.run({
        verbose: true
      }).then(function() {
        expect(loadCalledWith.loglevel).to.equal('verbose');
      });
    });
  });

  describe('non-existent command', function() {
    it('without arguments', function() {
      var expectedErrorMessage = '`npm non-existent` not found';
      ui = new MockUI();

      var task = new NpmTask({
        command: 'non-existent',
        startProgressMessage: 'test started',
        completionMessage: 'test completed',
        ui: ui,
        npm: npm
      });

      return task.run({}).catch(function() {
        expect(ui.output).to.include(expectedErrorMessage);
      });
    });
  });
});

