/*jshint multistr: true */

'use strict';

var path    = require('path');
var tmp     = require('tmp-sync');
var expect  = require('chai').expect;
var EOL     = require('os').EOL;
var ember   = require('../../helpers/ember');
var Promise = require('../../../lib/ext/promise');
var remove  = Promise.denodeify(require('fs-extra').remove);
var root    = process.cwd();
var tmproot = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help version', function() {
  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  it('works', function() {
    return ember([
      'help',
      'version'
    ])
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include(EOL + '\
ember version\u001b[36m <options...>\u001b[39m' + EOL + '\
  outputs ember-cli version' + EOL + '\
\u001b[90m  aliases: v, --version, -v' + EOL + '\
\u001b[39m\u001b[36m  --verbose\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m' + EOL);
    });
  });

  it('works with alias v', function() {
    return ember([
      'help',
      'v'
    ])
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include('ember version\u001b[36m <options...>\u001b[39m');
    });
  });
});
