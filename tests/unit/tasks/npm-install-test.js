'use strict';

var NpmInstallTask = require('../../../lib/tasks/npm-install');
var MockUI           = require('../../helpers/mock-ui');
var MockProject      = require('../../helpers/mock-project');
var expect           = require('chai').expect;


describe('npm install task', function() {
  var npmInstallTask;
  var ui;

  beforeEach(function() {
    var project = new MockProject({});
    project.root = './tmp';

    ui = new MockUI();
    npmInstallTask = new NpmInstallTask({
      ui: ui,
      project: project
    });
  });

  it('skips npm installs if there is no package.json', function() {
    npmInstallTask.run({});
    expect(ui.output).to.include('Skipping npm install: package.json not found');
  });
});