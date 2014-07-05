'use strict';

var path       = require('path');
var rimraf     = require('rimraf');
var tmp        = require('tmp-sync');
var assert     = require('../helpers/assert');
var runCommand = require('../helpers/run-command');

var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var ember      = path.join(root, 'bin', 'ember');
var tmpdir;

describe('Acceptance: ember help', function() {
  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function(done) {
    process.chdir(root);
    rimraf(tmproot, done);
  });

  it('generate lists blueprints', function() {
    this.timeout(10000);
    var output = '';

    return runCommand(ember, 'init', 'my-app', '--skip-npm', '--skip-bower', { verbose: false })
      .then(function() {
        return runCommand(ember, 'generate', 'blueprint', 'component', { verbose: false });
      })
      .then(function() {
        return runCommand(ember, 'help', 'generate', '--verbose', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        assert.include(output, 'my-app:');
        assert.include(output, '  component');
        assert.include(output, 'ember-cli:');
        assert.include(output, '  acceptance-test');
        assert.include(output, '  adapter');
        assert.include(output, '  app');
        assert.include(output, '  blueprint');
        assert.include(output, '  (overridden) component');
        assert.include(output, '  controller');
        assert.include(output, '  helper');
        assert.include(output, '  http-mock');
        assert.include(output, '  http-proxy');
        assert.include(output, '  initializer');
        assert.include(output, '  mixin');
        assert.include(output, '  resource');
        assert.include(output, '  route');
        assert.include(output, '  service');
        assert.include(output, '  template');
        assert.include(output, '  util');
        assert.include(output, '  view');
      });
  });
});
