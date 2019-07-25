'use strict';

const expect = require('chai').expect;
const Command = require('../../lib/models/command');
const MockUI = require('console-ui/mock');
const MockProject = require('../helpers/mock-project');
let command;
let called = false;

describe('analytics', function() {
  beforeEach(function() {
    let analytics = {
      track() {
        called = true;
      },
    };

    let FakeCommand = Command.extend({
      name: 'fake-command',
      run() {},
    });

    let project = new MockProject();
    project.isEmberCLIProject = function() {
      return true;
    };

    command = new FakeCommand({
      ui: new MockUI(),
      analytics,
      project,
    });
  });

  afterEach(function() {
    command = null;
  });

  it('track gets invoked on command.validateAndRun()', async function() {
    await command.validateAndRun([]);
    expect(called, 'expected analytics.track to be called').to.be.true;
  });
});
