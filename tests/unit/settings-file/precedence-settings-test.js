'use strict';

const expect = require('chai').expect;
const merge = require('ember-cli-lodash-subset').merge;
const MockUI = require('console-ui/mock');
const MockAnalytics = require('../../helpers/mock-analytics');
const Command = require('../../../lib/models/command');
const Yam = require('yam');

describe('.ember-cli', function() {
  let ui;
  let analytics;
  let project;
  let settings;
  let homeSettings;

  before(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
    project = {
      isEmberCLIProject() {
        return true;
      },
    };

    homeSettings = {
      proxy: 'http://iamstef.net/ember-cli',
      liveReload: false,
      environment: 'mock-development',
      host: '0.1.0.1',
    };

    settings = new Yam('ember-cli', {
      secondary: `${process.cwd()}/tests/fixtures/home`,
      primary: `${process.cwd()}/tests/fixtures/project`,
    }).getAll();
  });

  it('local settings take precedence over global settings', function() {
    let command = new Command({
      ui,
      analytics,
      project,
      settings,
    });

    let args = command.parseArgs();

    expect(args.options).to.include(
      merge(homeSettings, {
        port: 999,
        liveReload: false,
      })
    );
  });
});
