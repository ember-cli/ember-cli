'use strict';

let fs = require('fs-extra');
let path = require('path');
let blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
let setupTestHooks = blueprintHelpers.setupTestHooks;
let emberNew = blueprintHelpers.emberNew;
let emberGenerate = blueprintHelpers.emberGenerate;
let emberDestroy = blueprintHelpers.emberDestroy;
let proxyquire = require('proxyquire');
let td = require('testdouble');

let expect = require('ember-cli-blueprint-test-helpers/chai').expect;
let file = require('ember-cli-blueprint-test-helpers/chai').file;

describe('Acceptance: ember generate and destroy in-repo-addon', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('in-repo-addon fooBar', function() {
    let args = ['in-repo-addon', 'fooBar'];

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
  let blueprint;
  let readJsonSync;
  let writeFileSync;
  let options;

  beforeEach(function() {
    readJsonSync = td.function();
    writeFileSync = td.function();

    blueprint = proxyquire('../../../blueprints/in-repo-addon', {
      'fs-extra': {
        readJsonSync,
        writeFileSync,
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

    let captor = td.matchers.captor();

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

    let captor = td.matchers.captor();

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

    let captor = td.matchers.captor();

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

    let captor = td.matchers.captor();

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

    let captor = td.matchers.captor();

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
