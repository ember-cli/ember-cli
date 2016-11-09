'use strict';

var expect = require('chai').expect;
var Command = require('../../lib/models/command');
var InternalCommand = require('../../lib/utilities/internal-command');
var MockUI = require('../helpers/mock-ui');
var MockProject = require('../helpers/mock-project');
var Promise = require('../../lib/ext/promise');

var command;
var called = false;

var analytics = {
  track: function() {
    called = true;
  }
};
var project = new MockProject();
project.isEmberCLIProject = function() { return true; };

describe('analytics', function() {
  afterEach(function() {
    called = false;
    command = null;
  });

  it('track gets invoked on command.validateAndRun() only for internal commands', function() {
    var CustomInternalCommand = InternalCommand.extend({
      name: 'internal-command',
      run: function (options) { return options; }
    })

    command = new CustomInternalCommand({
      ui: new MockUI(),
      analytics: analytics,
      project: project
    });

    return command.validateAndRun([]).then(function() {
      expect(called, command + ': expected analytics.track to be called').to.be.true;
    });
  });

  it('track does not get invoked on command.validateAndRun() for non-internal commands', function() {
    var CustomCommand = Command.extend({
      name: 'custom-command',
      run: function() {}
    });

    command = new CustomCommand({
      ui: new MockUI(),
      analytics: analytics,
      project: project
    });

    return command.validateAndRun([]).then(function() {
      expect(called, 'expected analytics.track not to be called').to.be.false;
    });
  });
});
