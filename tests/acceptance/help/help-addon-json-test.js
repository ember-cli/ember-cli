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

describe('Acceptance: ember help --json addon', function() {
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
      'addon',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'addon',
        description: 'Generates a new folder structure for building an addon, complete with test harness.',
        aliases: [],
        works: 'outsideProject',
        availableOptions: [
          {
            name: 'dry-run',
            default: false,
            description: 'Dry run, simulate addon generation without affecting your project',
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
            default: 'addon',
            description: 'Specify addon blueprint',
            aliases: ['b'],
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
            name: 'skip-git',
            default: false,
            description: 'Skip creating a git repository',
            aliases: ['sg'],
            key: 'skipGit',
            required: false
          }
        ],
        anonymousOptions: ['<addon-name>']
      });
    });
  });
});
