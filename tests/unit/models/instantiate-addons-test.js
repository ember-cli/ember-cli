'use strict';

const FixturifyProject = require('../../helpers/fixturify-project');
const expect = require('chai').expect;

describe('models/instatiate-addons.js', function() {
  let fixturifyProject;

  beforeEach(function() {
    fixturifyProject = new FixturifyProject('awesome-proj', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
  });

  afterEach(function() {
    fixturifyProject.dispose();
  });

  it('ordering without before/after', function() {
    // this tests ordering is very important to maintain, it tests some naunced
    // details which must be maintained
    fixturifyProject.addAddon('foo', '1.0.0');
    fixturifyProject.addAddon('bar', '1.0.0');
    fixturifyProject.addAddon('qux', '1.0.0');

    // duplicates
    fixturifyProject.addDevAddon('foo', '2.0.0');
    fixturifyProject.addDevAddon('bar', '2.0.0');
    fixturifyProject.addDevAddon('qux', '2.0.0');

    // unique devDependencies
    fixturifyProject.addDevAddon('a', '2.0.0');
    fixturifyProject.addDevAddon('b', '2.0.0');
    fixturifyProject.addDevAddon('c', '2.0.0');

    fixturifyProject.writeSync();

    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    expect(project.addons.map(a => ({ name: a.pkg.name, version: a.pkg.version }))).to.deep.eql([
      { name: 'a', version: '2.0.0' },
      { name: 'b', version: '2.0.0' },
      { name: 'c', version: '2.0.0' },

      { name: 'bar', version: '1.0.0' },
      { name: 'foo', version: '1.0.0' },
      { name: 'qux', version: '1.0.0' },
    ]);
  });

  it('ordering with before specified', function() {
    fixturifyProject.addAddon('foo', '1.0.0');
    fixturifyProject.addAddon('bar', '1.0.0');
    fixturifyProject.addAddon('qux', '1.0.0', a => a.pkg['ember-addon'].before = 'foo');

    fixturifyProject.writeSync();

    let project = fixturifyProject.buildProjectModel();

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

    fixturifyProject.writeSync();

    let project = fixturifyProject.buildProjectModel();

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

    fixturifyProject.writeSync();

    let project = fixturifyProject.buildProjectModel();

    project.initializeAddons();

    expect(project.addons.map(a => a.name)).to.deep.eql([
      'foo',
      'qux',
    ]);
  });

  it('errors when there is a cycle detected', function() {
    fixturifyProject.addAddon('foo', '1.0.0', a => a.pkg['ember-addon'].after = 'qux');
    fixturifyProject.addAddon('qux', '1.0.0', a => a.pkg['ember-addon'].after = 'foo');

    fixturifyProject.writeSync();

    let project = fixturifyProject.buildProjectModel();

    expect(() => project.initializeAddons()).to.throw(/cycle detected/);
  });
});
