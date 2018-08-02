'use strict';

const FixturifyProject = require('fixturify-project');
const Project = require('../../../lib/models/project');
const expect = require('chai').expect;
const MockCLI = require('../../helpers/mock-cli');
const { createTempDir } = require('broccoli-test-helper');

class EmberCLIFixturifyProject extends FixturifyProject {
  addAddon(name, version, cb) {
    let addon = this.addDependency(name, version);
    addon.pkg.keywords.push('ember-addon');
    addon.pkg['ember-addon'] = { };
    addon.files['index.js'] = 'module.exports = { name: require("./package").name };';

    if (cb) {
      cb(addon);
    }

    return addon;
  }
}

// used in these tests to ensure we are only
// operating on the addons added here
class ProjectWithoutInternalAddons extends Project {
  supportedInternalAddonPaths() {
    return [];
  }
}

describe('models/instatiate-addons.js', function() {
  let project, fixturifyProject, projectDir;

  function bootProject() {
    let cli = new MockCLI();
    project = new ProjectWithoutInternalAddons(projectDir.path(fixturifyProject.name), fixturifyProject.pkg, cli.ui, cli);
  }

  beforeEach(function() {
    return createTempDir().then(tmpdir => {
      projectDir = tmpdir;

      fixturifyProject = new EmberCLIFixturifyProject('awesome-proj', '0.0.0');
      fixturifyProject.addDevDependency('ember-cli', '*');
    });
  });

  afterEach(function() {
    if (project) { project = null; }
    return projectDir.dispose();
  });

  it('ordering without before/after', function() {
    fixturifyProject.addAddon('foo', '1.0.0');
    fixturifyProject.addAddon('bar', '1.0.0');
    fixturifyProject.addAddon('qux', '1.0.0');

    fixturifyProject.writeSync(projectDir.path());
    bootProject();

    project.initializeAddons();

    expect(project.addons.map(a => a.name)).to.deep.eql([
      'bar',
      'foo',
      'qux',
    ]);
  });

  it('ordering with before specified', function() {
    fixturifyProject.addAddon('foo', '1.0.0');
    fixturifyProject.addAddon('bar', '1.0.0');
    fixturifyProject.addAddon('qux', '1.0.0', a => a.pkg['ember-addon'].before = 'foo');

    fixturifyProject.writeSync(projectDir.path());
    bootProject();

    project.initializeAddons();

    expect(project.addons.map(a => a.name)).to.deep.eql([
      'bar',
      'qux',
      'foo',
    ]);
  });

  it('ordering with after specified', function() {
    fixturifyProject.addAddon('foo', '1.0.0');
    fixturifyProject.addAddon('bar', '1.0.0');
    fixturifyProject.addAddon('qux', '1.0.0', a => a.pkg['ember-addon'].after = 'foo');

    fixturifyProject.writeSync(projectDir.path());
    bootProject();

    project.initializeAddons();

    expect(project.addons.map(a => a.name)).to.deep.eql([
      'bar',
      'foo',
      'qux',
    ]);
  });

  it('ordering always matches package.json name (index.js name is ignored)', function() {
    let foo = fixturifyProject.addAddon('lol', '1.0.0');
    foo.files['index.js'] = 'module.exports = { name: "foo" };';
    fixturifyProject.addAddon('qux', '1.0.0', a => a.pkg['ember-addon'].before = 'foo');

    fixturifyProject.writeSync(projectDir.path());
    bootProject();

    project.initializeAddons();

    expect(project.addons.map(a => a.name)).to.deep.eql([
      'foo',
      'qux',
    ]);
  });

  it('errors when there is a cycle detected', function() {
    fixturifyProject.addAddon('foo', '1.0.0', a => a.pkg['ember-addon'].after = 'qux');
    fixturifyProject.addAddon('qux', '1.0.0', a => a.pkg['ember-addon'].after = 'foo');

    fixturifyProject.writeSync(projectDir.path());
    bootProject();

    expect(() => project.initializeAddons()).to.throw(/cycle detected/);
  });
});
