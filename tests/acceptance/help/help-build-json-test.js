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

describe('Acceptance: ember help --json build', function() {
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
      'build',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'build',
        description: 'Builds your app and places it into the output path (dist/ by default).',
        aliases: ['b'],
        works: 'insideProject',
        availableOptions: [
          {
            name: 'environment',
            default: 'development',
            description: 'Build environment configuration',
            aliases: [
              'e',
              { dev: 'development' },
              { prod: 'production' }
            ],
            key: 'environment',
            required: false
          },
          {
            name: 'output-path',
            type: 'path',
            default: 'dist/',
            description: 'Build output path',
            aliases: ['o'],
            key: 'outputPath',
            required: false
          },
          {
            name: 'watch',
            default: false,
            description: 'Watch filesystem to trigger build',
            aliases: ['w'],
            key: 'watch',
            required: false
          },
          {
            name: 'watcher',
            key: 'watcher',
            required: false
          }
        ],
        anonymousOptions: []
      });
    });
  });

  it('works with alias b', function() {
    return ember([
      'help',
      'b',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('build');
    });
  });
});
