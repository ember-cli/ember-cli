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

describe('Acceptance: ember help build', function() {
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
      'build'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
ember build\u001b[36m <options...>\u001b[39m' + EOL + '\
  Builds your app and places it into the output path (dist/ by default).' + EOL + '\
\u001b[90m  aliases: b' + EOL + '\
\u001b[39m\u001b[36m  --environment\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: development)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -e <value>, -dev (--environment=development), -prod (--environment=production)\u001b[39m' + EOL + '\
\u001b[36m  --output-path\u001b[39m\u001b[36m (Path)\u001b[39m\u001b[36m (Default: dist/)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -o <value>\u001b[39m' + EOL + '\
\u001b[36m  --watch\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -w\u001b[39m' + EOL + '\
\u001b[36m  --watcher\u001b[39m\u001b[36m (String)\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias b', function() {
    return ember([
      'help',
      'b'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember build\u001b[36m <options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
