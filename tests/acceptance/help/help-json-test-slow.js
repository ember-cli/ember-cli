'use strict';

var path          = require('path');
var tmp           = require('tmp-sync');
var expect        = require('chai').expect;
var ember         = require('../../helpers/ember');
var runCommand    = require('../../helpers/run-command');
var convertToJson = require('../../helpers/convert-help-output-to-json');
var Promise       = require('../../../lib/ext/promise');
var fs            = require('fs-extra');
var copy          = Promise.denodeify(fs.copy);
var remove        = Promise.denodeify(fs.remove);
var root          = process.cwd();
var tmproot       = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help --json - slow', function() {
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
      //   'help',
      //   '--json'
      // ]);
      return runCommand(path.join(root, 'bin', 'ember'),
        'help',
        '--json', {
          onOutput: function(o) {
            output += o;
          }
        });
    })
    .then(function() {
      var json = convertToJson(output);

      expect(json.addons).to.deep.equal([
        {
          name: 'help',
          description: 'Outputs the usage instructions for all commands or the provided command',
          aliases: [ null, 'h', '--help', '-h' ],
          works: 'everywhere',
          availableOptions: [
            {
              name: 'verbose',
              default: false,
              aliases: [ 'v' ],
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
          anonymousOptions: [ '<command-name (Default: all)>' ],
          commands: [
            {
              name: 'addon-command',
              description: null,
              aliases: [ 'ac' ],
              works: 'insideProject',
              availableOptions: [],
              anonymousOptions: []
            }
          ]
        }
      ]);
    });
  });
});
