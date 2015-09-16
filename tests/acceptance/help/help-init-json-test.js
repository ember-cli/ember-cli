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

describe('Acceptance: ember help --json init', function() {
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
      'init',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'init',
        description: 'Creates a new ember-cli project in the current folder.',
        aliases: ['i'],
        works: 'everywhere',
        availableOptions: [
          {
            name: 'dry-run',
            default: false,
            description: 'Dry run, simulate project generation',
            aliases: ['d'],
            key: 'dryRun',
            required: false
          },
          {
            name: 'verbose',
            default: false,
            description: 'Verbose output',
            aliases: ['v'],
            key: 'verbose',
            required: false
          },
          {
            name: 'blueprint',
            aliases: ['b'],
            description: 'Specify project blueprint',
            key: 'blueprint',
            required: false
          },
          {
            name: 'skip-npm',
            default: false,
            description: 'Skip installing npm packages',
            aliases: ['sn'],
            key: 'skipNpm',
            required: false
          },
          {
            name: 'skip-bower',
            default: false,
            description: 'Skip installing bower packages',
            aliases: ['sb'],
            key: 'skipBower',
            required: false
          },
          {
            name: 'name',
            default: '',
            description: 'Specify project name',
            aliases: ['n'],
            key: 'name',
            required: false
          }
        ],
        anonymousOptions: ['<glob-pattern>']
      });
    });
  });

  it('works with alias i', function() {
    return ember([
      'help',
      'i',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('init');
    });
  });
});
