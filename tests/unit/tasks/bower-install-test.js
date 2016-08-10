'use strict';

var BowerInstallTask = require('../../../lib/tasks/bower-install');
var MockUI           = require('../../helpers/mock-ui');
var MockProject      = require('../../helpers/mock-project');
var expect           = require('chai').expect;

describe('bower install task', function() {
  var bowerInstallTask;
  var ui;

  beforeEach(function() {
    var project = new MockProject();
    ui = new MockUI();
    bowerInstallTask = new BowerInstallTask({
      ui: ui,
      project: project
    });
  });

  it('skips bower installs if there is no bower.json', function() {
    bowerInstallTask.run({});
    expect(ui.output).to.include('Skipping bower install: bower.json not found');
  });
});