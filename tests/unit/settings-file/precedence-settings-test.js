'use strict';

var expect         = require('chai').expect;
var merge          = require('lodash-node/modern/objects/merge');
var touch          = require('../../helpers/fs-utils').touch;
var touchIfExists  = require('../../helpers/fs-utils').touchIfExists;
var getUserHome    = require('../../helpers/fs-utils').getUserHome;
var deleteIfExists = require('../../helpers/fs-utils').deleteIfExists;
var MockUI         = require('../../helpers/mock-ui');
var MockAnalytics  = require('../../helpers/mock-analytics');
var Command        = require('../../../lib/models/command');
var p              = require('path');
var Yam            = require('yam');

describe('.ember-cli', function() {
  var ui;
  var analytics;
  var project;
  var settings;
  var homeSettings;
  var path     = '.ember-cli';
  var homePath = p.normalize(
    getUserHome() + '/' + path
  );

  before(function() {
    ui        = new MockUI();
    analytics = new MockAnalytics();
    project   = { isEmberCLIProject: function() { return true; }};

    touch(path, {
      port:          80,
      'live-reload': true
    });

    homeSettings = touchIfExists(homePath, {
      proxy:         'http://iamstef.net/ember-cli',
      'live-reload': false,
      environment:   'production',
      host:          '0.0.0.0'
    });

    settings = new Yam('ember-cli').getAll();
  });

  after(function() {
    deleteIfExists(path);
    deleteIfExists(homePath);
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
        port:          80,
        'live-reload': true
      })
    );
  });
});

