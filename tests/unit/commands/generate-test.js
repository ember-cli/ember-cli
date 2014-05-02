'use strict';

var rewire  = require('rewire');
var assert  = require('../../helpers/assert');
var MockUI  = require('../../helpers/mock-ui');
var MockAnalytics  = require('../../helpers/mock-analytics');

var Command;
var called = false;

function stubLoom() {
  return function loom() {
    called = true;
  };
}

describe('generate command', function() {
  var ui;
  var analytics;

  before(function() {
    Command = rewire('../../../lib/commands/generate');
    Command.__set__('loom', stubLoom());
  });

  beforeEach(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
  });

  after(function() {
    Command = null;
  });

  it('generates a controller', function() {
    new Command({
      ui: ui,
      analytics: analytics,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun([
      'controller',
      'application',
      'type:array'
    ]);

    assert.ok(called);
  });
});
