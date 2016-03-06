/*jshint multistr: true */

'use strict';

var fs                = require('fs');
var path              = require('path');
var chai              = require('chai');
var expect            = chai.expect;
var EOL               = require('os').EOL;
var processHelpString = require('../helpers/process-help-string');
var convertToJson     = require('../helpers/convert-help-output-to-json');
var commandOptions    = require('../factories/command-options');
var HelpCommand       = require('../../lib/commands/help');
var requireAsHash     = require('../../lib/utilities/require-as-hash');
var Command           = require('../../lib/models/command');
var commands          = requireAsHash('../../lib/commands/*.js', Command);

describe('Acceptance: ember help', function() {
  var options, command;

  beforeEach(function() {
    options = commandOptions({
      commands: commands,
      project: {
        isEmberCLIProject: function() {
          return true;
        },
        blueprintLookupPaths: function() {
          return [];
        }
      }
    });

    command = new HelpCommand(options);
  });

  it('works', function() {
    command.run(options, []);

    var output = options.ui.output;

    var fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'help.txt');
    var expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('works json', function() {
    options.json = true;

    command.run(options, []);

    var json = convertToJson(options.ui.output);
    var expected = require('../fixtures/help/help.js');

    expect(json).to.deep.equal(expected);
  });

  it('prints all blueprints', function() {
    command.run(options, ['generate']);

    var output = options.ui.output;

    var fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate.txt');
    var expected = loadTextFixture(fixturePath);

    expect(output).to.contain(expected);
  });
});

function loadTextFixture(path) {
  var content = fs.readFileSync(path, { encoding: 'utf8' });
  var decoded = decodeUnicode(content);
  var processed = processHelpString(decoded);
  return processed.replace(/\n/g, EOL);
}

function decodeUnicode(str) {
  return str.replace(/\\u([\d\w]{4})/gi, function (match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
  });
}
