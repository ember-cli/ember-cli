'use strict';

var path = require('path');
var blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
var setupTestHooks = blueprintHelpers.setupTestHooks;
var emberNew = blueprintHelpers.emberNew;
var emberGenerateDestroy = blueprintHelpers.emberGenerateDestroy;
var setupPodConfig = blueprintHelpers.setupPodConfig;

var chai = require('ember-cli-blueprint-test-helpers/chai');
var expect = chai.expect;

/**
 * This test case is checking the `controller` blueprint, which is actually
 * not part of this project itself anymore. The purpose is to check that
 * things like the `addon-import` blueprint in this project work correctly.
 */
describe('Acceptance: ember generate and destroy controller', function() {
return;
  setupTestHooks(this, {
    cliPath: path.resolve(__dirname + '/../../..'),
  });

  it('controller foo', function() {
    var args = ['controller', 'foo'];

    return emberNew()
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('app/controllers/foo.js')).to.exist;
        });
      });
  });

  it('controller foo/bar', function() {
    var args = ['controller', 'foo/bar'];

    return emberNew()
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('app/controllers/foo/bar.js')).to.exist;
        });
      });
  });

  it('in-addon controller foo', function() {
    var args = ['controller', 'foo'];

    return emberNew({ target: 'addon' })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('addon/controllers/foo.js')).to.exist;
          expect(_file('app/controllers/foo.js'))
            .to.contain("export { default } from 'my-addon/controllers/foo';");
        });
      });
  });

  it('in-addon controller foo/bar', function() {
    var args = ['controller', 'foo/bar'];

    return emberNew({ target: 'addon' })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('addon/controllers/foo/bar.js')).to.exist;
          expect(_file('app/controllers/foo/bar.js'))
            .to.contain("export { default } from 'my-addon/controllers/foo/bar';");
        });
      });
  });

  it('dummy controller foo', function() {
    var args = ['controller', 'foo', '--dummy'];

    return emberNew({ target: 'addon' })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('tests/dummy/app/controllers/foo.js')).to.exist;
          expect(_file('app/controllers/foo-test.js')).to.not.exist;
        });
      });
  });

  it('in-repo-addon controller foo', function() {
    var args = ['controller', 'foo', '--in-repo-addon=my-addon'];

    return emberNew({ target: 'in-repo-addon' })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('lib/my-addon/addon/controllers/foo.js')).to.exist;
          expect(_file('lib/my-addon/app/controllers/foo.js'))
            .to.contain("export { default } from 'my-addon/controllers/foo';");
        });
      });
  });

  it('in-repo-addon controller foo/bar', function() {
    var args = ['controller', 'foo/bar', '--in-repo-addon=my-addon'];

    return emberNew({ target: 'in-repo-addon' })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('lib/my-addon/addon/controllers/foo/bar.js')).to.exist;
          expect(_file('lib/my-addon/app/controllers/foo/bar.js'))
            .to.contain("export { default } from 'my-addon/controllers/foo/bar';");
        });
      });
  });

  it('controller foo --pod', function() {
    var args = ['controller', 'foo', '--pod'];

    return emberNew()
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('app/foo/controller.js')).to.exist;
        });
      });
  });

  it('controller foo --pod podModulePrefix', function() {
    var args = ['controller', 'foo', '--pod'];

    return emberNew()
      .then(function() {
        return setupPodConfig({ podModulePrefix: true });
      })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('app/pods/foo/controller.js')).to.exist;
        });
      });
  });

  it('controller foo/bar --pod', function() {
    var args = ['controller', 'foo/bar', '--pod'];

    return emberNew()
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('app/foo/bar/controller.js')).to.exist;
        });
      });
  });

  it('controller foo/bar --pod podModulePrefix', function() {
    var args = ['controller', 'foo/bar', '--pod'];

    return emberNew()
      .then(function() {
        return setupPodConfig({ podModulePrefix: true });
      })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('app/pods/foo/bar/controller.js')).to.exist;
        });
      });
  });

  it('in-addon controller foo --pod', function() {
    var args = ['controller', 'foo', '--pod'];

    return emberNew({ target: 'addon' })
      .then(function() {
        return emberGenerateDestroy(args, function(_file) {
          expect(_file('addon/foo/controller.js')).to.exist;
          expect(_file('app/foo/controller.js'))
            .to.contain("export { default } from 'my-addon/foo/controller';");
        });
      });
  });
});
