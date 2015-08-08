'use strict';

var path       = require('path');
var tmp        = require('tmp-sync');
var expect     = require('chai').expect;
var runCommand = require('../helpers/run-command');
var Promise    = require('../../lib/ext/promise');
var remove     = Promise.denodeify(require('fs-extra').remove);
var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var ember      = path.join(root, 'bin', 'ember');
var tmpdir;

describe('Acceptance: ember help', function() {
  this.timeout(40000);

  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  it('it works', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, 'help', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('Usage: ember <command (Default: help)>');
        expect(output).to.include('Available commands in ember-cli:');
      });
  });

  it('option --help', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, '--help', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('Usage: ember <command (Default: help)>');
        expect(output).to.include('Available commands in ember-cli:');
      });
  });

  it('option -h', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, '-h', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('Usage: ember <command (Default: help)>');
        expect(output).to.include('Available commands in ember-cli:');
      });
  });
});
