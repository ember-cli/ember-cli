'use strict';

var assert = require('../../helpers/assert');
var MockUI = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var rewire = require('rewire');

describe('new command', function() {
  var ui;
  var analytics;
  var NewCommand;

  before(function() {
    NewCommand = rewire('../../../lib/commands/new');
    ui = new MockUI();
    analytics = new MockAnalytics();
  });

  after(function() {
    NewCommand = null;
  });

  it('doesn\'t allow to create an application named `test`', function() {
    new NewCommand({
      ui: ui,
      analytics: analytics,
      tasks: {},
      project: { isEmberCLIProject: function(){ return false; }}
    }).validateAndRun(['test']).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function() {
      assert.equal(ui.output, 'Due to an issue with `compileES6` an application name of `test` cannot be used.');
    });
  });
});
