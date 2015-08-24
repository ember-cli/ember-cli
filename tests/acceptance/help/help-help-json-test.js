'use strict';

var path          = require('path');
var tmp           = require('tmp-sync');
var expect        = require('chai').expect;
var ember         = require('../../helpers/ember');
var convertToJson = require('../../helpers/convert-help-output-to-json');
var Promise       = require('../../../lib/ext/promise');
var remove        = Promise.denodeify(require('fs-extra').remove);
var root          = process.cwd();
var tmproot       = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help --json help', function() {
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
      'help',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'help',
        description: 'Outputs the usage instructions for all commands or the provided command',
        aliases: [null, 'h', '--help', '-h'],
        works: 'everywhere',
        availableOptions: [
          {
            name: 'verbose',
            default: false,
            aliases: ['v'],
            key: 'verbose',
            required: false
          },
          {
            name: 'json',
            default: false,
            key: 'json',
            required: false
          }
        ],
        anonymousOptions: ['<command-name (Default: all)>']
      });
    });
  });

  it('works with alias h', function() {
    return ember([
      'help',
      'h',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('help');
    });
  });

  it('works with alias --help', function() {
    return ember([
      'help',
      '--help',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('help');
    });
  });

  it('works with alias -h', function() {
    return ember([
      'help',
      '-h',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('help');
    });
  });
});
