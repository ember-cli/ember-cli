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

describe('Acceptance: ember help --json test', function() {
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
      'test',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'test',
        description: 'Runs your app\'s test suite.',
        aliases: ['t'],
        works: 'insideProject',
        availableOptions: [
          {
            name: 'environment',
            default: 'test',
            aliases: ['e'],
            key: 'environment',
            required: false
          },
          {
            name: 'config-file',
            default: './testem.json',
            aliases: ['c', 'cf'],
            key: 'configFile',
            required: false
          },
          {
            name: 'server',
            default: false,
            aliases: ['s'],
            key: 'server',
            required: false
          },
          {
            name: 'host',
            aliases: ['H'],
            key: 'host',
            required: false
          },
          {
            name: 'test-port',
            default: 7357,
            description: 'The test port to use when running with --server.',
            aliases: ['tp'],
            key: 'testPort',
            required: false
          },
          {
            name: 'filter',
            description: 'A string to filter tests to run',
            aliases: ['f'],
            key: 'filter',
            required: false
          },
          {
            name: 'module',
            description: 'The name of a test module to run',
            aliases: ['m'],
            key: 'module',
            required: false
          },
          {
            name: 'watcher',
            default: 'events',
            aliases: ['w'],
            key: 'watcher',
            required: false
          },
          {
            name: 'launch',
            default: false,
            description: 'A comma separated list of browsers to launch for tests.',
            key: 'launch',
            required: false
          },
          {
            name: 'reporter',
            description: 'Test reporter to use [tap|dot|xunit]',
            aliases: ['r'],
            key: 'reporter',
            required: false
          },
          {
            name: 'test-page',
            description: 'Test page to invoke',
            key: 'testPage',
            required: false
          }
        ],
        anonymousOptions: []
      });
    });
  });

  it('works with alias t', function() {
    return ember([
      'help',
      't',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('test');
    });
  });
});
