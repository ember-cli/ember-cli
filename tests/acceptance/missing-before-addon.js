'use strict';

var path       = require('path');
var runCommand = require('../helpers/run-command');

var root       = process.cwd();
var ember      = path.join(root, 'bin', 'ember');


describe('Acceptance: missing a before/after addon', function() {
  before(function() {
    process.chdir(path.join(root, 'tests', 'fixtures', 'missing-before-addon'));
  });

  after(function() {
    process.chdir(root);
  });

  it('does not break ember-cli', function() {
    return runCommand(ember, 'help');
  });
});
