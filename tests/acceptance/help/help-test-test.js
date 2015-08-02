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

describe('Acceptance: ember help test', function() {
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
      'test'
    ])
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include(EOL + '\
ember test\u001b[36m <options...>\u001b[39m' + EOL + '\
  Runs your app\'s test suite.' + EOL + '\
\u001b[90m  aliases: t' + EOL + '\
\u001b[39m\u001b[36m  --environment\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: test)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -e <value>\u001b[39m' + EOL + '\
\u001b[36m  --config-file\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: ./testem.json)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -c <value>, -cf <value>\u001b[39m' + EOL + '\
\u001b[36m  --server\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -s\u001b[39m' + EOL + '\
\u001b[36m  --host\u001b[39m\u001b[36m (String)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -H <value>\u001b[39m' + EOL + '\
\u001b[36m  --test-port\u001b[39m\u001b[36m (Number)\u001b[39m\u001b[36m (Default: 7357)\u001b[39m The test port to use when running with --server.\u001b[90m' + EOL + '\
    aliases: -tp <value>\u001b[39m' + EOL + '\
\u001b[36m  --filter\u001b[39m\u001b[36m (String)\u001b[39m A string to filter tests to run\u001b[90m' + EOL + '\
    aliases: -f <value>\u001b[39m' + EOL + '\
\u001b[36m  --module\u001b[39m\u001b[36m (String)\u001b[39m The name of a test module to run\u001b[90m' + EOL + '\
    aliases: -m <value>\u001b[39m' + EOL + '\
\u001b[36m  --watcher\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: events)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -w <value>\u001b[39m' + EOL + '\
\u001b[36m  --launch\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: false)\u001b[39m A comma separated list of browsers to launch for tests.' + EOL + '\
\u001b[36m  --reporter\u001b[39m\u001b[36m (String)\u001b[39m Test reporter to use [tap|dot|xunit]\u001b[90m' + EOL + '\
    aliases: -r <value>\u001b[39m' + EOL + '\
\u001b[36m  --test-page\u001b[39m\u001b[36m (String)\u001b[39m Test page to invoke' + EOL);
    });
  });

  it('works with alias t', function() {
    return ember([
      'help',
      't'
    ])
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include('ember test\u001b[36m <options...>\u001b[39m');
    });
  });
});
