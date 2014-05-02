'use strict';
/*jshint expr: true*/

var expect        = require('chai').expect;
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var Command       = require('../../../lib/models/command');

var ServeCommand = Command.extend({
  name: 'serve',
  aliases: ['s'],
  works: 'everywhere',
  availableOptions: [
    { name: 'port', key: 'port', type: Number, default: 4200, required: true }
  ],
  run: function() {},
  usageInstructions: function() {}
});

var DevelopEmberCLICommand = Command.extend({
  name: 'develop-ember-cli',
  works: 'everywhere',
  availableOptions: [
    { name: 'package-name', key: 'packageName', type: String, required: true }
  ],
  run: function() {},
  usageInstructions: function() {}
});

var InsideProjectCommand = Command.extend({
  name: 'inside-project',
  works: 'insideProject',
  run: function() {},
  usageInstructions: function() {}
});

var OutsideProjectCommand = Command.extend({
  name: 'outside-project',
  works: 'outsideProject',
  run: function() {},
  usageInstructions: function() {}
});

describe('models/command.js', function() {
  var ui;
  var analytics;
  var project;

  before(function(){
    ui = new MockUI();
    analytics = new MockAnalytics();
    project = { isEmberCLIProject: function(){ return true; }};
  });

  it('parseArgs() should parse the command options.', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project
    }).parseArgs(['--port', '80'])).to.include({
      port: 80
    });
  });

  it('parseArgs() should find abbreviated command options.', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project
    }).parseArgs(['-p', '80'])).to.include({
      port: 80
    });
  });

  it('parseArgs() should set default option values.', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project
    }).parseArgs([])).to.include({
      port: 4200
    });
  });

  it('validateAndRun() should print a message if a required option is missing.', function() {
    new DevelopEmberCLICommand({
      ui: ui,
      analytics: analytics,
      project: project
    }).validateAndRun([]);
    expect(ui.output).to.match(/requires the option.*package-name/);
  });

  it('validateAndRun() should print a message if outside a project and command is not valid there.', function() {
    new InsideProjectCommand({
      ui: ui,
      analytics: analytics,
      project: { isEmberCLIProject: function(){ return false; }}
    }).validateAndRun([]);
    expect(ui.output).to.match(/You have to be inside an ember-cli project/);
  });

  it('validateAndRun() should print a message if inside a project and command is not valid there.', function() {
    new OutsideProjectCommand({
      ui: ui,
      analytics: analytics,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun([]);
    expect(ui.output).to.match(/You cannot use.*inside an ember-cli project/);
  });
});
