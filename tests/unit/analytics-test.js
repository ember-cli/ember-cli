'use strict';

var expect = require('chai').expect;
var Command = require('../../lib/models/command');
var MockUI = require('console-ui/mock');
var MockProject = require('../helpers/mock-project');
var command;
var called = false;

beforeEach(function() {
  var analytics = {
    track() {
      called = true;
    },
  };

  var FakeCommand = Command.extend({
    name: 'fake-command',
    run() {},
  });

  var project = new MockProject();
  project.isEmberCLIProject = function() { return true; };

  command = new FakeCommand({
    ui: new MockUI(),
    analytics,
    project,
  });
});

afterEach(function() {
  command = null;
});

describe('analytics', function() {
  it('track gets invoked on command.validateAndRun()', function() {
    return command.validateAndRun([]).then(function() {
      expect(called, 'expected analytics.track to be called').to.be.true;
    });
  });
});
