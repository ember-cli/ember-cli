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

describe('Acceptance: ember help install', function() {
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
      'install'
    ])
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include(EOL + '\
ember install \u001b[33m<addon-name>\u001b[39m' + EOL + '\
  Installs an ember-cli addon from npm.' + EOL);
    });
  });
});
