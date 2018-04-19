'use strict';

const Blueprint = require('../../../lib/models/blueprint');
const MockProject = require('../../helpers/mock-project');
const expect = require('chai').expect;

describe('blueprint - addon', function() {
  describe('Blueprint.lookup', function() {
    let blueprint;

    beforeEach(function() {
      blueprint = Blueprint.lookup('addon');
    });

    describe('entityName', function() {
      let mockProject;

      beforeEach(function() {
        mockProject = new MockProject();
        mockProject.isEmberCLIProject = function() { return true; };

        blueprint.project = mockProject;
      });

      afterEach(function() {
        mockProject = null;
      });

      it('throws error when current project is an existing ember-cli project', function() {
        expect(() => blueprint.normalizeEntityName('foo'))
          .to.throw('Generating an addon in an existing ember-cli project is not supported.');
      });

      it('works when current project is an existing ember-cli addon', function() {
        mockProject.isEmberCLIAddon = function() { return true; };

        expect(() => blueprint.normalizeEntityName('foo'))
          .not.to.throw('Generating an addon in an existing ember-cli project is not supported.');
      });

      it('keeps existing behavior by calling Blueprint.normalizeEntityName', function() {
        expect(() => blueprint.normalizeEntityName('foo/'))
          .to.throw(/trailing slash/);
      });
    });
  });

  describe('direct blueprint require', function() {
    let blueprint;
    beforeEach(function() {
      blueprint = require('../../../blueprints/addon');
      blueprint.options = {
        entity: { name: 'my-cool-addon' },
      };
      blueprint._appBlueprint = {
        path: 'test-app-blueprint-path',
      };
      blueprint.path = 'test-blueprint-path';
    });

    describe('generatePackageJson', function() {
      it('works', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({}));
        // string to test ordering
        expect(output).to.equal('\
{\n\
  "name": "my-cool-addon",\n\
  "description": "The default blueprint for ember-cli addons.",\n\
  "keywords": [\n\
    "ember-addon"\n\
  ],\n\
  "scripts": {\n\
    "lint:js": "eslint ./*.js addon addon-test-support app blueprints config lib server test-support tests",\n\
    "test:all": "ember try:each"\n\
  },\n\
  "dependencies": {},\n\
  "devDependencies": {\n\
    "ember-disable-prototype-extensions": "^1.1.2",\n\
    "ember-source-channel-url": "^1.0.1",\n\
    "ember-try": "^0.2.23",\n\
    "eslint-plugin-node": "^6.0.1"\n\
  },\n\
  "ember-addon": {\n\
    "configPath": "tests/dummy/config"\n\
  }\n\
}\n');
      });

      it('removes the `private` property', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({}));

        expect(JSON.parse(output).private).to.be.undefined;
      });

      it('overwrites `name`', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({ name: 'OMG' }));
        expect(JSON.parse(output).name).to.eql('my-cool-addon');
      });

      it('overwrites `description`', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({ description: 'OMG' }));
        let json = JSON.parse(output);

        expect(json.description).to.equal('The default blueprint for ember-cli addons.');
      });

      it('moves `ember-cli-babel` from devDependencies to dependencies', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({
          devDependencies: {
            'ember-cli-babel': '1.0.0',
          },
        }));

        let json = JSON.parse(output);
        expect(json.dependencies).to.deep.equal({
          'ember-cli-babel': '1.0.0',
        });
        expect(json.devDependencies).to.not.have.property('ember-cli-babel');
      });

      it('does not push multiple `ember-addon` keywords', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({
          keywords: ['ember-addon'],
        }));
        let json = JSON.parse(output);
        expect(json.keywords).to.deep.equal(['ember-addon']);
      });

      it('overwrites any version of `ember-disable-prototype-extensions`', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({
          devDependencies: {
            'ember-disable-prototype-extensions': '1.1.2',
          },
        }));

        let json = JSON.parse(output);
        expect(json.devDependencies['ember-disable-prototype-extensions']).to.equal('^1.1.2');
      });

      it('adds `scripts.test:all`', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({
          scripts: {},
        }));

        let json = JSON.parse(output);
        expect(json.scripts['test:all']).to.equal('ember try:each');
      });

      it('overwrites `ember-addon.configPath`', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({
          'ember-addon': {
            configPath: 'test-path',
          },
        }));

        let json = JSON.parse(output);
        expect(json['ember-addon'].configPath).to.equal('tests/dummy/config');
      });

      it('preserves dependency ordering', function() {
        let output = blueprint.updatePackageJson(JSON.stringify({
          dependencies: {
            b: '1',
            a: '1',
          },
          devDependencies: {
            b: '1',
            a: '1',
          },
        }));

        let json = JSON.parse(output);
        delete json.devDependencies['ember-disable-prototype-extensions'];
        delete json.devDependencies['eslint-plugin-node'];
        delete json.devDependencies['ember-try'];
        delete json.devDependencies['ember-source-channel-url'];
        expect(json.dependencies).to.deep.equal({ a: "1", b: "1" });
        expect(json.devDependencies).to.deep.equal({ a: "1", b: "1" });
      });
    });
  });
});
