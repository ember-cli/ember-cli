'use strict';
/*jshint expr: true*/

var expect        = require('chai').expect;
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var Command       = require('../../../lib/models/command');
var Yam           = require('yam');

var ServeCommand = Command.extend({
  name: 'serve',
  aliases: ['s'],
  works: 'everywhere',
  availableOptions: [
    { name: 'port', key: 'port', type: Number, default: 4200, required: true }
  ],
  run: function() {}
});

var DevelopEmberCLICommand = Command.extend({
  name: 'develop-ember-cli',
  works: 'everywhere',
  availableOptions: [
    { name: 'package-name', key: 'packageName', type: String, required: true }
  ],
  run: function() {}
});

var InsideProjectCommand = Command.extend({
  name: 'inside-project',
  works: 'insideProject',
  run: function() {}
});

var OutsideProjectCommand = Command.extend({
  name: 'outside-project',
  works: 'outsideProject',
  run: function() {}
});

describe('models/command.js', function() {
  var ui;
  var analytics;
  var project;
  var config;

  before(function(){
    ui = new MockUI();
    analytics = new MockAnalytics();
    project = { isEmberCLIProject: function(){ return true; }};
    config = new Yam('ember-cli', {
      homePath: process.cwd() + '/tests/fixtures/home',
      path:     process.cwd() + '/tests/fixtures/project'
    });
  });

  it('parseArgs() should parse the command options.', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project
    }).parseArgs(['--port', '80'])).to.have.deep.property('options.port', 80);
  });

  it('parseArgs() should get command options from the config file and command line', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      settings: config.getAll()
    }).parseArgs(['--port', '789'])).to.deep.equal({
      options: {
        port: 789,
        environment: 'mock-development',
        host: '0.1.0.1',
        proxy: 'http://iamstef.net/ember-cli',
        'live-reload': false,
        checkForUpdates: false
      },
      args: []
    });
  });

  it('parseArgs() should find abbreviated command options.', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project
    }).parseArgs(['-p', '80'])).to.have.deep.property('options.port', 80);
  });

  it('parseArgs() should set default option values.', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project
    }).parseArgs([])).to.have.deep.property('options.port', 4200);
  });

  it('parseArgs() should return args too.', function() {
    expect(new ServeCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      settings: config.getAll()
    }).parseArgs(['foo', '--port', '80'])).to.deep.equal({
      args: ['foo'],
      options: {
        environment: 'mock-development',
        host: '0.1.0.1',
        proxy: 'http://iamstef.net/ember-cli',
        'live-reload': false,
        port: 80,
        checkForUpdates: false
      }
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
