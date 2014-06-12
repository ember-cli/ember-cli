'use strict';

var expect         = require('chai').expect;
var merge          = require('lodash-node/modern/objects/merge');
var MockUI         = require('../../helpers/mock-ui');
var MockAnalytics  = require('../../helpers/mock-analytics');
var Command        = require('../../../lib/models/command');
var Yam            = require('yam');

describe('.ember-cli', function() {
  var ui;
  var analytics;
  var project;
  var settings;
  var homeSettings;

  before(function() {
    ui        = new MockUI();
    analytics = new MockAnalytics();
    project   = { isEmberCLIProject: function() { return true; }};

    homeSettings = {
      proxy:         'http://iamstef.net/ember-cli',
      'live-reload': false,
      environment:   'mock-development',
      host:          '0.1.0.1'
    };

    settings = new Yam('ember-cli', {
      homePath: process.cwd() + '/tests/fixtures/home',
      path:     process.cwd() + '/tests/fixtures/project'
    }).getAll();
  });

  it('local settings take precendence over global settings', function() {
    var command = new Command({
      ui:        ui,
      analytics: analytics,
      project:   project,
      settings:  settings
    });

    var args = command.parseArgs();

    expect(args.options).to.include(
      merge(homeSettings, {
        port:          999,
        'live-reload': false
      })
    );
  });
});

