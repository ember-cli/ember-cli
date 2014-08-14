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
    this.timeout(10000);

    process.chdir(root);
    rimraf(tmproot, done);
  });

  it('generate', function() {
    var output = '';

    return runCommand(ember, 'help', 'generate', {
      onOutput: function(string) {
        output += string;
      }
    }).then(function() {
      assert.include(output, 'ember-cli commands:');
      assert.include(output, '  app');
      assert.include(output, '  adapter');
      assert.include(output, '  http-mock');
      assert.include(output, '  http-proxy');
      assert.include(output, '  app');
      assert.include(output, '  blueprint');
      assert.include(output, '  component');
      assert.include(output, '  controller');
      assert.include(output, '  helper');
      assert.include(output, '  initializer');
      assert.include(output, '  acceptance-test');
      assert.include(output, '  mixin');
      assert.include(output, '  model');
      assert.include(output, '  resource');
      assert.include(output, '  route');
      assert.include(output, '  serializer');
      assert.include(output, '  service');
      assert.include(output, '  template');
      assert.include(output, '  transform');
      assert.include(output, '  util');
      assert.include(output, '  view');
    });
  });
});
