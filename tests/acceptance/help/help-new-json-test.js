'use strict';

var path              = require('path');
var tmp               = require('tmp-sync');
var expect            = require('chai').expect;
var ember             = require('../../helpers/ember');
var convertToJson     = require('../../helpers/convert-help-output-to-json');
var processHelpString = require('../../helpers/process-help-string');
var Promise           = require('../../../lib/ext/promise');
var remove            = Promise.denodeify(require('fs-extra').remove);
var root              = process.cwd();
var tmproot           = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help --json new', function() {
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
      'new',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'new',
        description: processHelpString('Creates a new directory and runs \u001b[32member init\u001b[39m in it.'),
        aliases: [],
        works: 'outsideProject',
        availableOptions: [
          {
            name: 'dry-run',
            default: false,
            aliases: ['d'],
            key: 'dryRun',
            required: false
          },
          {
            name: 'verbose',
            default: false,
            aliases: ['v'],
            key: 'verbose',
            required: false
          },
          {
            name: 'blueprint',
            default: 'app',
            aliases: ['b'],
            key: 'blueprint',
            required: false
          },
          {
            name: 'skip-npm',
            default: false,
            aliases: ['sn'],
            key: 'skipNpm',
            required: false
          },
          {
            name: 'skip-bower',
            default: false,
            aliases: ['sb'],
            key: 'skipBower',
            required: false
          },
          {
            name: 'skip-git',
            default: false,
            aliases: ['sg'],
            key: 'skipGit',
            required: false
          },
          {
            name: 'directory',
            aliases: ['dir'],
            key: 'directory',
            required: false
          }
        ],
        anonymousOptions: ['<app-name>']
      });
    });
  });
});
