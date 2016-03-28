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

var FooCommand = Command.extend({
  name: 'foo',
  description: 'Initializes the warp drive.',
  works: 'insideProject',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] }
  ],

  anonymousOptions: [
    '<speed>'
  ],
});

describe('Acceptance: ember help', function() {
  var options, command;

  beforeEach(function() {
    var commands = requireAsHash('../../lib/commands/*.js', Command);

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

  it('prints addon commands', function() {
    options.project.eachAddonCommand = function(cb) {
      cb('dummy-addon', { Foo: FooCommand });
    };

    command.run(options, []);

    var output = options.ui.output;

    var fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'help-with-addon.txt');
    var expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('prints single addon commands', function() {
    options.project.eachAddonCommand = function(cb) {
      cb('dummy-addon', { Foo: FooCommand });
    };

    command.run(options, ['foo']);

    var output = options.ui.output;

    var fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'foo.txt');
    var expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('prints all blueprints', function() {
    command.run(options, ['generate']);

    var output = options.ui.output;

    var fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate.txt');
    var expected = loadTextFixture(fixturePath);

    expect(output).to.contain(expected);
  });

  it('prints helpfull message for unknown command', function() {
    command.run(options, ['asdf']);

    var output = options.ui.output;

    expect(output).to.contain("No help entry for 'asdf'");
    expect(output).to.not.contain('undefined');
  });

  it('prints a single blueprints', function() {
    command.run(options, ['generate', 'blueprint']);

    var output = options.ui.output;

    var fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate-blueprint.txt');
    var expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('prints blueprints from addons', function() {
    options.project.blueprintLookupPaths = function() {
      return [path.join(__dirname, '..', 'fixtures', 'blueprints')];
    };

    command.run(options, ['generate']);

    var output = options.ui.output;

    var fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate-with-addon.txt');
    var expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  describe('--json', function() {
    it('works', function() {
      options.json = true;

      command.run(options, []);

      var json = convertToJson(options.ui.output);
      var expected = require('../fixtures/help/help.js');

      expect(json).to.deep.equal(expected);
    });

    it('returns empty list for unknown command', function() {
      options.json = true;

      command.run(options, ['asdf']);

      var json = convertToJson(options.ui.output);
      var expected = require('../fixtures/help/help-unknown.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints commands from addons', function() {
      options.json = true;
      options.project.eachAddonCommand = function(cb) {
        cb('dummy-addon', { Foo: FooCommand });
      };

      command.run(options, []);

      var json = convertToJson(options.ui.output);
      var expected = require('../fixtures/help/with-addon-commands.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints single command from addon', function() {
      options.json = true;
      options.project.eachAddonCommand = function(cb) {
        cb('dummy-addon', { Foo: FooCommand });
      };

      command.run(options, ['foo']);

      var json = convertToJson(options.ui.output);
      var expected = require('../fixtures/help/foo.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints blueprints from addons', function() {
      options.json = true;
      options.project.blueprintLookupPaths = function() {
        return [path.join(__dirname, '..', 'fixtures', 'blueprints')];
      };

      command.run(options, []);

      var json = convertToJson(options.ui.output);
      var expected = require('../fixtures/help/with-addon-blueprints.js');

      expect(json).to.deep.equal(expected);
    });
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
