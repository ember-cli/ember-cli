'use strict';

var fs = require('fs-extra');
var path = require('path');
var blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
var setupTestHooks = blueprintHelpers.setupTestHooks;
var emberNew = blueprintHelpers.emberNew;
var emberGenerateDestroy = blueprintHelpers.emberGenerateDestroy;

var expect = require('ember-cli-blueprint-test-helpers/chai').expect;

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
        return emberGenerateDestroy(args, function(file) {
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
        });
      });
  });
});
