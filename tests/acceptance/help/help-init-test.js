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

describe('Acceptance: ember help init', function() {
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
      'init'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
ember init \u001b[33m<glob-pattern>\u001b[39m\u001b[36m <options...>\u001b[39m' + EOL + '\
  Creates a new ember-cli project in the current folder.' + EOL + '\
\u001b[90m  aliases: i' + EOL + '\
\u001b[39m\u001b[36m  --dry-run\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -d\u001b[39m' + EOL + '\
\u001b[36m  --verbose\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -v\u001b[39m' + EOL + '\
\u001b[36m  --blueprint\u001b[39m\u001b[36m (String)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -b <value>\u001b[39m' + EOL + '\
\u001b[36m  --skip-npm\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -sn\u001b[39m' + EOL + '\
\u001b[36m  --skip-bower\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -sb\u001b[39m' + EOL + '\
\u001b[36m  --name\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: )\u001b[39m\u001b[90m' + EOL + '\
    aliases: -n <value>\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias i', function() {
    return ember([
      'help',
      'i'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember init \u001b[33m<glob-pattern>\u001b[39m\u001b[36m <options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
