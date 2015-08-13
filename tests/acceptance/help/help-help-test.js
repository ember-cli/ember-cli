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

describe('Acceptance: ember help help', function() {
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
      'help'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
ember help \u001b[33m<command-name (Default: all)>\u001b[39m\u001b[36m <options...>\u001b[39m' + EOL + '\
  Outputs the usage instructions for all commands or the provided command' + EOL + '\
\u001b[90m  aliases: h, --help, -h' + EOL + '\
\u001b[39m\u001b[36m  --verbose\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -v\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias h', function() {
    return ember([
      'help',
      'h'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember help \u001b[33m<command-name (Default: all)>\u001b[39m\u001b[36m <options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });

  it('works with alias --help', function() {
    return ember([
      'help',
      '--help'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember help \u001b[33m<command-name (Default: all)>\u001b[39m\u001b[36m <options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });

  it('works with alias -h', function() {
    return ember([
      'help',
      '-h'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember help \u001b[33m<command-name (Default: all)>\u001b[39m\u001b[36m <options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
