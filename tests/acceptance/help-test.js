/*jshint multistr: true */

'use strict';

var path              = require('path');
var tmp               = require('tmp-sync');
var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var ember             = require('../helpers/ember');
var processHelpString = require('../helpers/process-help-string');
var commandNames      = require('../helpers/command-names');
var Promise           = require('../../lib/ext/promise');
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
Available commands in ember-cli:' + EOL + EOL);
      var regex = new RegExp(commandNames.map(function(commandName) {
        return EOL + EOL + 'ember ' + commandName + ' [\\s\\S]*';
      }).join('') + EOL + EOL);

      expect(output).to.include(testString);
      expect(output).to.match(regex);
    });
  });
});
