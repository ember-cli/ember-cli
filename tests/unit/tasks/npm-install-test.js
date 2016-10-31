'use strict';

var NpmInstallTask = require('../../../lib/tasks/npm-install');
var MockUI         = require('../../helpers/mock-ui');
var expect         = require('chai').expect;

describe('npm install task', function() {
  var npmInstallTask;
  var ui;

  beforeEach(function() {
    var project = {
      root: __dirname
    };
    ui = new MockUI();

    npmInstallTask = new NpmInstallTask({
      ui: ui,
      project: project
    });
  });

  afterEach(function() {
    ui = undefined;
    npmInstallTask = undefined;
  });

  it('skips npm installs if there is no package.json', function() {
    npmInstallTask.run({});
    expect(ui.output).to.include('Skipping npm install: package.json not found');
  });
});
