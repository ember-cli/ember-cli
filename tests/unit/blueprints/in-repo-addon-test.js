'use strict';

var fs = require('fs-extra');
var path = require('path');
var blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
var setupTestHooks = blueprintHelpers.setupTestHooks;
var emberNew = blueprintHelpers.emberNew;
var emberGenerate = blueprintHelpers.emberGenerate;
var emberDestroy = blueprintHelpers.emberDestroy;

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
