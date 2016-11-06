'use strict';

var expect = require('chai').expect;
var Command = require('../../lib/models/command');
var MockUI = require('../helpers/mock-ui');
var MockProject = require('../helpers/mock-project');
var Promise = require('../../lib/ext/promise');
var analyticsUtils = require('../../lib/utilities/analytics-utils');

var ANALYTICS_WHITELISTED_COMMANDS = analyticsUtils.ANALYTICS_WHITELISTED_COMMANDS;

var command, serveCommand, TmpCommand;
var called = false;

var analytics = {
  track: function() {
    called = true;
  }
};
var project = new MockProject();
project.isEmberCLIProject = function() { return true; };

// populate an array of commands that we expect to be tracked
var commands = [];
for (var i = 0, l = ANALYTICS_WHITELISTED_COMMANDS.length; i < l; i++) {
  TmpCommand = Command.extend({
    name: ANALYTICS_WHITELISTED_COMMANDS[i],
    run: function(options) { return options; }
  })
  commands.push(new TmpCommand({
    ui: new MockUI(),
    analytics: analytics,
    project: project
  }));
}

describe('analytics', function() {
  afterEach(function() {
    called = false;
  });

  it('track gets invoked on command.validateAndRun() only for whitelisted commands', function() {
    return Promise.all(commands.map(function(command) {
      return command.validateAndRun([]).then(function() {
        expect(called, command + ': expected analytics.track to be called').to.be.true;
      });
    }));
  });

  it('track does not get invoked on command.validateAndRun() for non-whitelisted commands', function() {
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
