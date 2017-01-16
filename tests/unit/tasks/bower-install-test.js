'use strict';

const BowerInstallTask = require('../../../lib/tasks/bower-install');
const MockUI = require('console-ui/mock');
const MockProject = require('../../helpers/mock-project');
const expect = require('chai').expect;

describe('bower install task', function() {
  let bowerInstallTask;
  let ui;

  beforeEach(function() {
    let project = new MockProject();
    ui = new MockUI();

    bowerInstallTask = new BowerInstallTask({
      ui,
      project,
    });
  });

  afterEach(function() {
    ui = undefined;
    bowerInstallTask = undefined;
  });

  it('skips bower installs if there is no bower.json', function() {
    return bowerInstallTask.run({}).then(() => {
      expect(ui.output).to.include('Skipping bower install: bower.json not found');
    });
  });
});
