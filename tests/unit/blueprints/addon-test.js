'use strict';

const Blueprint = require('../../../lib/models/blueprint');
const MockProject = require('../../helpers/mock-project');
const { expect } = require('chai');

describe('blueprint - addon', function () {
  describe('Blueprint.lookup', function () {
    let blueprint;

    beforeEach(function () {
      blueprint = Blueprint.lookup('addon');
    });

    describe('entityName', function () {
      let mockProject;

      beforeEach(function () {
        mockProject = new MockProject();
        mockProject.isEmberCLIProject = function () {
          return true;
        };

        blueprint.project = mockProject;
      });

      afterEach(function () {
        mockProject = null;
      });

      it('throws error when current project is an existing ember-cli project', function () {
        expect(() => blueprint.normalizeEntityName('foo')).to.throw(
          'Generating an addon in an existing ember-cli project is not supported.'
        );
      });

      it('works when current project is an existing ember-cli addon', function () {
        mockProject.isEmberCLIAddon = function () {
          return true;
        };

        expect(() => blueprint.normalizeEntityName('foo')).not.to.throw(
          'Generating an addon in an existing ember-cli project is not supported.'
        );
      });

      it('keeps existing behavior by calling Blueprint.normalizeEntityName', function () {
        expect(() => blueprint.normalizeEntityName('foo/')).to.throw(/trailing slash/);
      });
    });
  });

  describe('direct blueprint require', function () {
    let blueprint;
    beforeEach(function () {
      blueprint = require('@ember-tooling/classic-build-addon-blueprint');
      blueprint.options = {
        entity: { name: 'my-cool-addon' },
      };
      blueprint._appBlueprint = {
        path: 'test-app-blueprint-path',
      };
      blueprint.path = 'test-blueprint-path';
    });

    describe('generatePackageJson', function () {
      it('removes the `private` property', function () {
        let output = blueprint.updatePackageJson(JSON.stringify({}));

        expect(JSON.parse(output).private).to.be.undefined;
      });

      it('overwrites `name`', function () {
        let output = blueprint.updatePackageJson(JSON.stringify({ name: 'OMG' }));
        expect(JSON.parse(output).name).to.eql('my-cool-addon');
      });

      it('overwrites `description`', function () {
        let output = blueprint.updatePackageJson(JSON.stringify({ description: 'OMG' }));
        let json = JSON.parse(output);

        expect(json.description).to.equal('The default blueprint for ember-cli addons.');
      });

      it('moves `ember-cli-babel` from devDependencies to dependencies', function () {
        let output = blueprint.updatePackageJson(
          JSON.stringify({
            devDependencies: {
              'ember-cli-babel': '1.0.0',
            },
          })
        );

        let json = JSON.parse(output);
        expect(json.dependencies).to.deep.equal({
          'ember-cli-babel': '1.0.0',
        });
        expect(json.devDependencies).to.not.have.property('ember-cli-babel');
      });

      it('moves `ember-cli-htmlbars` from devDependencies to dependencies', function () {
        let output = blueprint.updatePackageJson(
          JSON.stringify({
            devDependencies: {
              'ember-cli-htmlbars': '1.0.0',
            },
          })
        );

        let json = JSON.parse(output);
        expect(json.dependencies).to.deep.equal({
          'ember-cli-htmlbars': '1.0.0',
        });
        expect(json.devDependencies).to.not.have.property('ember-cli-htmlbars');
      });

      it('does not push multiple `ember-addon` keywords', function () {
        let output = blueprint.updatePackageJson(
          JSON.stringify({
            keywords: ['ember-addon'],
          })
        );
        let json = JSON.parse(output);
        expect(json.keywords).to.deep.equal(['ember-addon']);
      });

      it('adds `scripts.test:all`', function () {
        let output = blueprint.updatePackageJson(
          JSON.stringify({
            scripts: {},
          })
        );

        let json = JSON.parse(output);
        expect(json.scripts['test:ember-compatibility']).to.equal('ember try:each');
      });

      it('overwrites `ember-addon.configPath`', function () {
        let output = blueprint.updatePackageJson(
          JSON.stringify({
            'ember-addon': {
              configPath: 'test-path',
            },
          })
        );

        let json = JSON.parse(output);
        expect(json['ember-addon'].configPath).to.equal('tests/dummy/config');
      });

      it('preserves dependency ordering', function () {
        let output = blueprint.updatePackageJson(
          JSON.stringify({
            dependencies: {
              b: '1',
              a: '1',
            },
            devDependencies: {
              b: '1',
              a: '1',
            },
          })
        );

        let json = JSON.parse(output);
        delete json.devDependencies['eslint-plugin-n'];
        delete json.devDependencies['ember-try'];
        delete json.devDependencies['ember-source-channel-url'];
        delete json.devDependencies['@embroider/test-setup'];
        expect(json.dependencies).to.deep.equal({ a: '1', b: '1' });
        expect(json.devDependencies).to.deep.equal({ a: '1', b: '1' });
      });

      it('adds `ember-source` to `peerDependencies`', function () {
        let output = blueprint.updatePackageJson(
          JSON.stringify({
            peerDependencies: {
              'foo-bar': '^1.0.0',
            },
          })
        );

        let json = JSON.parse(output);

        expect(json.peerDependencies).to.deep.equal({
          'ember-source': '>= 4.0.0',
          'foo-bar': '^1.0.0',
        });
      });
    });
  });
});
