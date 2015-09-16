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

describe('Acceptance: ember help addon', function() {
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
      'addon'
    ]).then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
ember addon \u001b[33m<addon-name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
  Generates a new folder structure for building an addon, complete with test harness.' + EOL + '\
  \u001b[36m--dry-run\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Dry run, simulate addon generation without affecting your project' + EOL + '\
    \u001b[90maliases: -d\u001b[39m' + EOL + '\
  \u001b[36m--verbose\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Verbose output' + EOL + '\
    \u001b[90maliases: -v\u001b[39m' + EOL + '\
  \u001b[36m--blueprint\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: addon)\u001b[39m' + EOL + '\
    Specify addon blueprint' + EOL + '\
    \u001b[90maliases: -b <value>\u001b[39m' + EOL + '\
  \u001b[36m--skip-npm\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Skip installing npm packages' + EOL + '\
    \u001b[90maliases: -sn\u001b[39m' + EOL + '\
  \u001b[36m--skip-bower\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Skip installing bower packages' + EOL + '\
    \u001b[90maliases: -sb\u001b[39m' + EOL + '\
  \u001b[36m--skip-git\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Skip creating a git repository' + EOL + '\
    \u001b[90maliases: -sg\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });
});
