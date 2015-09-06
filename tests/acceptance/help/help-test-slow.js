/*jshint multistr: true */

'use strict';

var path              = require('path');
var tmp               = require('tmp-sync');
var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var ember             = require('../../helpers/ember');
var runCommand        = require('../../helpers/run-command');
var processHelpString = require('../../helpers/process-help-string');
var Promise           = require('../../../lib/ext/promise');
var fs                = require('fs-extra');
var copy              = Promise.denodeify(fs.copy);
var remove            = Promise.denodeify(fs.remove);
var root              = process.cwd();
var tmproot           = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help - slow', function() {
  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  it('lists addons', function() {
    var output = '';

    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
      return ember([
        'generate',
        'in-repo-addon',
        'my-addon'
      ]);
    })
    .then(function() {
      return copy('../../tests/fixtures/addon/commands/addon-command.js', 'lib/my-addon/index.js');
    })
    .then(function() {
      // ember helper currently won't register the addon file
      // return ember([
      //   'help'
      // ]);
      return runCommand(path.join(root, 'bin', 'ember'),
        'help', {
          onOutput: function(o) {
            output += o;
          }
        });
    })
    .then(function() {
      var testString = processHelpString(EOL + '\
Available commands from Ember CLI Addon Command Test:' + EOL + '\
ember addon-command' + EOL + '\
  aliases: ac' + EOL);

      expect(output).to.include(testString);
    });
  });
});
