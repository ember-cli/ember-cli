'use strict';

var Blueprint   = require('blprnt');
var MockProject = require('../../helpers/mock-project');
var expect      = require('chai').expect;
var proxyquire  = require('proxyquire');
var fs          = require('fs');
var path        = require('path');
var td = require('testdouble');

describe('blueprint - addon', function() {
  describe('Blueprint.lookup', function() {
    var blueprint;

    beforeEach(function() {
      blueprint = Blueprint.lookup('addon');
    });

    describe('entityName', function() {
      var mockProject;

      beforeEach(function() {
        mockProject = new MockProject();
        mockProject.isEmberCLIProject = function() { return true; };

        blueprint.project = mockProject;
      });

      afterEach(function() {
        mockProject = null;
      });

      it('throws error when current project is an existing ember-cli project', function() {
        expect(function() {
          blueprint.normalizeEntityName('foo');
        }).to.throw('Generating an addon in an existing ember-cli project is not supported.');
      });

      it('works when current project is an existing ember-cli addon', function() {
        mockProject.isEmberCLIAddon = function() { return true; };

        expect(function() {
          blueprint.normalizeEntityName('foo');
        }).not.to.throw('Generating an addon in an existing ember-cli project is not supported.');
      });

      it('keeps existing behavior by calling Blueprint.normalizeEntityName', function() {
        expect(function() {
          var nonConformantComponentName = 'foo/';
          blueprint.normalizeEntityName(nonConformantComponentName);
        }).to.throw(/trailing slash/);
      });
    });
  });

  describe('direct blueprint require', function() {
    var blueprint;
    var readJsonSync;
    var writeFileSync;

    beforeEach(function() {
      readJsonSync = td.function();
      td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({});

      writeFileSync = td.function();

      blueprint = proxyquire('../../../blueprints/addon', {
        'fs-extra': {
          readJsonSync: readJsonSync,
          writeFileSync: writeFileSync,
        }
      });
      blueprint._appBlueprint = {
        path: 'test-app-blueprint-path'
      };
      blueprint.path = 'test-blueprint-path';
    });

    describe('generatePackageJson', function() {
      it('works', function() {
        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        // string to test ordering
        expect(captor.value).to.equal('\
{\n\
  "name": "<%= addonName %>",\n\
  "description": "The default blueprint for ember-cli addons.",\n\
  "keywords": [\n\
    "ember-addon"\n\
  ],\n\
  "scripts": {\n\
    "test": "ember try:each"\n\
  },\n\
  "dependencies": {},\n\
  "devDependencies": {\n\
    "ember-disable-prototype-extensions": "^1.1.0"\n\
  },\n\
  "ember-addon": {\n\
    "configPath": "tests/dummy/config"\n\
  }\n\
}\n');
      });

      it('removes the `private` property', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          private: true
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json.private).to.be.undefined;
      });

      it('overwrites `name`', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          name: 'test-name'
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json.name).to.equal('<%= addonName %>');
      });

      it('overwrites `description`', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          description: 'test-description'
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json.description).to.equal('The default blueprint for ember-cli addons.');
      });

      it('moves `ember-cli-babel` from devDependencies to dependencies', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          devDependencies: {
            'ember-cli-babel': '1.0.0'
          }
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json.dependencies).to.deep.equal({
          'ember-cli-babel': '1.0.0'
        });
        expect(json.devDependencies).to.not.have.property('ember-cli-babel');
      });

      it('does not push multiple `ember-addon` keywords', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          keywords: ['ember-addon']
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json.keywords).to.deep.equal(['ember-addon']);
      });

      it('overwrites any version of `ember-disable-prototype-extensions`', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          devDependencies: {
            'ember-disable-prototype-extensions': '0.0.1'
          }
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json.devDependencies['ember-disable-prototype-extensions']).to.equal('^1.1.0');
      });

      it('overwrites `scripts.test`', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          scripts: {
            test: 'test-string'
          }
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json.scripts.test).to.equal('ember try:each');
      });

      it('overwrites `ember-addon.configPath`', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          'ember-addon': {
            configPath: 'test-path'
          }
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        expect(json['ember-addon'].configPath).to.equal('tests/dummy/config');
      });

      it('preserves dependency ordering', function() {
        td.when(readJsonSync(), {ignoreExtraArgs: true}).thenReturn({
          dependencies: {
            b: '1',
            a: '1'
          },
          devDependencies: {
            b: '1',
            a: '1'
          }
        });

        blueprint.generatePackageJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/package.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/package.json'), captor.capture()));

        var json = JSON.parse(captor.value);
        delete json.devDependencies['ember-disable-prototype-extensions'];
        expect(json.dependencies).to.deep.equal({ a: "1", b: "1" });
        expect(json.devDependencies).to.deep.equal({ a: "1", b: "1" });
      });
    });

    describe('generateBowerJson', function() {
      it('works', function() {
        blueprint.generateBowerJson();

        var captor = td.matchers.captor();

        td.verify(readJsonSync(path.normalize('test-app-blueprint-path/files/bower.json')));
        td.verify(writeFileSync(path.normalize('test-blueprint-path/files/bower.json'), captor.capture()));

        // string to test ordering
        expect(captor.value).to.equal('\
{\n\
  "name": "<%= addonName %>"\n\
}\n');
      });
    });
  });
});
