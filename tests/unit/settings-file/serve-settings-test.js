'use strict';

var expect         = require('chai').expect;
var touch          = require('../../helpers/fs-utils').touch;
var getUserHome    = require('../../helpers/fs-utils').getUserHome;
var deleteIfExists = require('../../helpers/fs-utils').deleteIfExists;
var MockUI         = require('../../helpers/mock-ui');
var MockAnalytics  = require('../../helpers/mock-analytics');
var ServeCommand   = require('../../../lib/commands/serve');
var p              = require('path');
var Yam            = require('yam');

describe('.ember-cli', function() {
  var ui;
  var analytics;
  var project;
  var settings;
  var path     = '.ember-cli';
  var homePath = p.normalize(
    getUserHome() + '/' + path
  );

  before(function() {
    ui        = new MockUI();
    analytics = new MockAnalytics();
    project   = { isEmberCLIProject: function() { return true; }};

    touch(path, {
      port: 80
    });

    touch(homePath, {
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

  it('serve command takes options in settings file into the account', function() {
    var command = new ServeCommand({
      ui:        ui,
      analytics: analytics,
      project:   project,
      settings:  settings
    });

    var args = command.parseArgs();

    expect(args.options).to.include({
      port:          80,
      'live-reload': false,
      proxy:         'http://iamstef.net/ember-cli',
      host:          '0.0.0.0',
      environment:   'production'
    });
  });
});
