/*jshint multistr: true */

'use strict';

var path              = require('path');
var tmp               = require('tmp-sync');
var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var ember             = require('../../helpers/ember');
var processHelpString = require('../../helpers/process-help-string');
var Promise           = require('../../../lib/ext/promise');
var remove            = Promise.denodeify(require('fs-extra').remove);
var root              = process.cwd();
var tmproot           = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help', function() {
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
      'help'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
Usage: ember \u001b[33m<command (Default: help)>\u001b[39m' + EOL + '\
' + EOL + '\
Available commands in ember-cli:' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias h', function() {
    return ember([
      'h'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
Usage: ember \u001b[33m<command (Default: help)>\u001b[39m' + EOL + '\
' + EOL + '\
Available commands in ember-cli:' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias --help', function() {
    return ember([
      '--help'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
Usage: ember \u001b[33m<command (Default: help)>\u001b[39m' + EOL + '\
' + EOL + '\
Available commands in ember-cli:' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias -h', function() {
    return ember([
      '-h'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
Usage: ember \u001b[33m<command (Default: help)>\u001b[39m' + EOL + '\
' + EOL + '\
Available commands in ember-cli:' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with single command', function() {
    return ember([
      'help',
      'addon'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
Requested ember-cli commands:' + EOL + '\
' + EOL + '\
ember addon');

      expect(output).to.include(testString);
    });
  });

  it('handles missing command', function() {
    return ember([
      'help',
      'asdf'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
Requested ember-cli commands:' + EOL + '\
' + EOL + '\
\u001b[31mNo help entry for \'asdf\'\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });
});
