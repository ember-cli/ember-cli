'use strict';

var fs = require('fs-extra');
var path = require('path');
var blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
var setupTestHooks = blueprintHelpers.setupTestHooks;
var emberNew = blueprintHelpers.emberNew;
var emberGenerate = blueprintHelpers.emberGenerate;
var emberDestroy = blueprintHelpers.emberDestroy;
var proxyquire = require('proxyquire');
var td = require('testdouble');

var expect = require('ember-cli-blueprint-test-helpers/chai').expect;
var file = require('ember-cli-blueprint-test-helpers/chai').file;

describe('Acceptance: ember generate and destroy in-repo-addon', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(__dirname + '/../../..'),
  });

  it('in-repo-addon fooBar', function() {
    var args = ['in-repo-addon', 'fooBar'];

    return emberNew()
      .then(function() {
        expect(fs.readJsonSync('package.json')['ember-addon']).to.be.undefined;
      })
      .then(function() {
        return emberGenerate(args);
      })
      .then(function() {
        expect(file('lib/foo-bar/package.json')).to.exist;
        expect(file('lib/foo-bar/index.js')).to.exist;

        expect(fs.readJsonSync('lib/foo-bar/package.json')).to.deep.equal({
          "name": "foo-bar",
          "keywords": [
            "ember-addon",
          ],
        });

        expect(fs.readJsonSync('package.json')['ember-addon']).to.deep.equal({
          "paths": [
            "lib/foo-bar",
          ],
        });
      })
      .then(function() {
        return emberDestroy(args);
      })
      .then(function() {
        expect(file('lib/foo-bar/package.json')).to.not.exist;
        expect(file('lib/foo-bar/index.js')).to.not.exist;

        expect(fs.readJsonSync('package.json')['ember-addon']['paths']).to.be.undefined;
      });
  });
});

describe('Unit: in-repo-addon blueprint', function() {
  var blueprint;
  var readJsonSync;
  var writeFileSync;
  var options;

  beforeEach(function() {
    readJsonSync = td.function();
    writeFileSync = td.function();

    blueprint = proxyquire('../../../blueprints/in-repo-addon', {
      'fs-extra': {
        readJsonSync: readJsonSync,
        writeFileSync: writeFileSync,
      },
    });
    blueprint.project = {
      root: 'test-project-root',
    };

    options = {
      entity: {
        name: 'test-entity-name',
      },
    };
  });

  it('adds to paths', function() {
    td.when(readJsonSync(), { ignoreExtraArgs: true }).thenReturn({});

    blueprint.afterInstall(options);

    var captor = td.matchers.captor();

    td.verify(readJsonSync(path.normalize('test-project-root/package.json')));
    td.verify(writeFileSync(path.normalize('test-project-root/package.json'), captor.capture()));

    expect(captor.value).to.equal('\
{\n\
  "ember-addon": {\n\
    "paths": [\n\
      "lib/test-entity-name"\n\
    ]\n\
  }\n\
}\n');
  });

  it('ignores if already exists', function() {
    td.when(readJsonSync(), { ignoreExtraArgs: true }).thenReturn({
      'ember-addon': {
        paths: ['lib/test-entity-name'],
      },
    });

    blueprint.afterInstall(options);

    var captor = td.matchers.captor();

    td.verify(readJsonSync(path.normalize('test-project-root/package.json')));
    td.verify(writeFileSync(path.normalize('test-project-root/package.json'), captor.capture()));

    expect(captor.value).to.equal('\
{\n\
  "ember-addon": {\n\
    "paths": [\n\
      "lib/test-entity-name"\n\
    ]\n\
  }\n\
}\n');
  });

  it('removes from paths', function() {
    td.when(readJsonSync(), { ignoreExtraArgs: true }).thenReturn({
      'ember-addon': {
        paths: [
          'lib/test-entity-name',
          'lib/test-entity-name-2',
        ],
      },
    });

    blueprint.afterUninstall(options);

    var captor = td.matchers.captor();

    td.verify(readJsonSync(path.normalize('test-project-root/package.json')));
    td.verify(writeFileSync(path.normalize('test-project-root/package.json'), captor.capture()));

    expect(captor.value).to.equal('\
{\n\
  "ember-addon": {\n\
    "paths": [\n\
      "lib/test-entity-name-2"\n\
    ]\n\
  }\n\
}\n');
  });

  it('removes paths if last one', function() {
    td.when(readJsonSync(), { ignoreExtraArgs: true }).thenReturn({
      'ember-addon': {
        paths: ['lib/test-entity-name'],
      },
    });

    blueprint.afterUninstall(options);

    var captor = td.matchers.captor();

    td.verify(readJsonSync(path.normalize('test-project-root/package.json')));
    td.verify(writeFileSync(path.normalize('test-project-root/package.json'), captor.capture()));

    expect(captor.value).to.equal('\
{\n\
  "ember-addon": {}\n\
}\n');
  });

  it('alphabetizes paths', function() {
    td.when(readJsonSync(), { ignoreExtraArgs: true }).thenReturn({
      'ember-addon': {
        paths: ['lib/test-entity-name-2'],
      },
    });

    blueprint.afterInstall(options);

    var captor = td.matchers.captor();

    td.verify(readJsonSync(path.normalize('test-project-root/package.json')));
    td.verify(writeFileSync(path.normalize('test-project-root/package.json'), captor.capture()));

    expect(captor.value).to.equal('\
{\n\
  "ember-addon": {\n\
    "paths": [\n\
      "lib/test-entity-name",\n\
      "lib/test-entity-name-2"\n\
    ]\n\
  }\n\
}\n');
  });
});
