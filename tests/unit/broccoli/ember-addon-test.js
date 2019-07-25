'use strict';

const path = require('path');
const Project = require('../../../lib/models/project');
const EmberAddon = require('../../../lib/broccoli/ember-addon');
const EmberApp = require('../../../lib/broccoli/ember-app');
const expect = require('chai').expect;
const MockCLI = require('../../helpers/mock-cli');

describe('EmberAddon', function() {
  let project, emberAddon, projectPath;

  function setupProject(rootPath) {
    const packageContents = require(path.join(rootPath, 'package.json'));
    let cli = new MockCLI();

    project = new Project(rootPath, packageContents, cli.ui, cli);
    project.require = function() {
      return function() {};
    };
    project.initializeAddons = function() {
      this.addons = [];
    };

    return project;
  }

  beforeEach(function() {
    projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
    project = setupProject(projectPath);
  });

  it('should merge options with defaults to depth', function() {
    emberAddon = new EmberAddon(
      {
        project,
        foo: {
          bar: ['baz'],
        },
        fooz: {
          bam: {
            boo: ['default'],
          },
        },
      },
      {
        foo: {
          bar: ['bizz'],
        },
        fizz: 'fizz',
        fooz: {
          bam: {
            boo: ['custom'],
          },
        },
      }
    );

    expect(emberAddon.options.foo).to.deep.eql({
      bar: ['bizz'],
    });
    expect(emberAddon.options.fizz).to.eql('fizz');
    expect(emberAddon.options.fooz).to.eql({
      bam: {
        boo: ['custom'],
      },
    });
  });

  it('should contain env', function() {
    expect(EmberAddon.env).to.be.a('function');
  });

  it('should contain return the correct environment', function() {
    expect(EmberAddon.env()).to.eql(EmberApp.env());
  });
});
