'use strict';
var expect           = require('chai').expect;
var CheckVersions    = require('../../../../lib/tasks/doctor/check-versions');
var MockUI           = require('../../../helpers/mock-ui');
var MockProject      = require('../../../helpers/mock-project');
var Table            = require('cli-table');
var os               = require('os');

describe('check supported versions', function() {
  var loadCalledWith;
  var outdatedCalledWith;
  var uiWrote;

  var ui;
  var project;
  var checkVersions;

  beforeEach(function() {
    outdatedCalledWith = loadCalledWith = uiWrote = undefined;
    ui = new MockUI();
    project = new MockProject();

    ui.write = function(message) {
      uiWrote = message;
    };

    project.pkg = {
      os: ['darwin', 'linux', os.platform()],
      engines: {
        node: '>= 0.10.0'
      },
      dependencies: {
        npm: '2.1.8'
      }
    };

    checkVersions = new CheckVersions({
      ui: ui,
      project: project
    });
  });

  it('should not write anything if the versions match', function() {
    uiWrote = undefined;
    return checkVersions.run().then(function() {
      expect(uiWrote).to.deep.equal(undefined);
    });
  });

  it('should prompt the developer with non compatable OS', function() {
    checkVersions.project.pkg.os = ['awesomeo'];
    return checkVersions.run().then(function() {
      var table = new Table({
        head: ['Name', 'Yours', 'Expected']
      });
      table.push(['os', os.platform(), 'awesomeo']);
      expect(uiWrote).to.equal(table.toString());
    });
  });

  it('should prompt the developer with non compatable npm', function() {
    checkVersions.project.pkg.dependencies.npm = '^3.0.0';
    return checkVersions.run().then(function() {
      expect(uiWrote).to.have.string('npm');
      expect(uiWrote).to.have.string('2.1.8');
      expect(uiWrote).to.have.string('^3.0.0');
    });
  });
  
  it('should prompt the developer with non compatable node version', function() {
    checkVersions.project.pkg.engines.node = '>= 1.0.0';
    return checkVersions.run().then(function() {
      expect(uiWrote).to.have.string('node');
      expect(uiWrote).to.have.string(process.versions.node);
      expect(uiWrote).to.have.string('>= 1.0.0');
    });
  });
});
