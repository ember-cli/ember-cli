'use strict';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
let expect = chai.expect;
const EOL = require('os').EOL;
const processHelpString = require('../helpers/process-help-string');
const convertToJson = require('../helpers/convert-help-output-to-json');
const commandOptions = require('../factories/command-options');
const HelpCommand = require('../../lib/commands/help');
const requireAsHash = require('../../lib/utilities/require-as-hash');
const Command = require('../../lib/models/command');

let FooCommand = Command.extend({
  name: 'foo',
  description: 'Initializes the warp drive.',
  works: 'insideProject',

  availableOptions: [{ name: 'dry-run', type: Boolean, default: false, aliases: ['d'] }],

  anonymousOptions: ['<speed>'],
});

describe('Acceptance: ember help', function () {
  let options, command;

  beforeEach(function () {
    let commands = requireAsHash('../../lib/commands/*.js', Command);

    options = commandOptions({
      commands,
      project: {
        isEmberCLIProject() {
          return true;
        },
        blueprintLookupPaths() {
          return [];
        },
      },
    });

    command = new HelpCommand(options);
  });

  it('works', function () {
    command.run(options, []);

    let output = options.ui.output;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'help.txt');

    maybeUpdateSnapshot(fixturePath, output);

    let expected = loadTextFixture(fixturePath);
    expect(output).to.equal(expected);
  });

  it('prints addon commands', function () {
    options.project.eachAddonCommand = function (cb) {
      cb('dummy-addon', { Foo: FooCommand });
    };

    command.run(options, []);

    let output = options.ui.output;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'help-with-addon.txt');

    maybeUpdateSnapshot(fixturePath, output);

    let expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('prints single addon commands', function () {
    options.project.eachAddonCommand = function (cb) {
      cb('dummy-addon', { Foo: FooCommand });
    };

    command.run(options, ['foo']);

    let output = options.ui.output;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'foo.txt');

    maybeUpdateSnapshot(fixturePath, output);

    let expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('prints all blueprints', function () {
    command.run(options, ['generate']);

    let output = options.ui.output;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate.txt');

    maybeUpdateSnapshot(fixturePath, output);

    let expected = loadTextFixture(fixturePath);

    expect(output).to.contain(expected);
  });

  it('prints helpful message for unknown command', function () {
    command.run(options, ['asdf']);

    let output = options.ui.output;

    expect(output).to.contain("No help entry for 'asdf'");
    expect(output).to.not.contain('undefined');
  });

  it('prints a single blueprints', function () {
    command.run(options, ['generate', 'blueprint']);

    let output = options.ui.output;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate-blueprint.txt');

    maybeUpdateSnapshot(fixturePath, output);

    let expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('prints blueprints from addons', function () {
    options.project.blueprintLookupPaths = function () {
      return [path.join(__dirname, '..', 'fixtures', 'blueprints')];
    };

    command.run(options, ['generate']);

    let output = options.ui.output;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate-with-addon.txt');

    maybeUpdateSnapshot(fixturePath, output);

    let expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  describe('--json', function () {
    beforeEach(function () {
      options.json = true;
    });

    it('works', function () {
      command.run(options, []);

      let json = convertToJson(options.ui.output);
      const expected = require('../fixtures/help/help.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints commands from addons', function () {
      options.project.eachAddonCommand = function (cb) {
        cb('dummy-addon', { Foo: FooCommand });
      };

      command.run(options, []);

      let json = convertToJson(options.ui.output);
      const expected = require('../fixtures/help/with-addon-commands.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints blueprints from addons', function () {
      options.project.blueprintLookupPaths = function () {
        return [path.join(__dirname, '..', 'fixtures', 'blueprints')];
      };

      command.run(options, []);

      let json = convertToJson(options.ui.output);
      const expected = require('../fixtures/help/with-addon-blueprints.js');

      expect(json).to.deep.equal(expected);
    });
  });
});

function loadTextFixture(path) {
  let content = fs.readFileSync(path, { encoding: 'utf8' });
  let decoded = unescapeString(content);
  let processed = processHelpString(decoded);
  return processed.replace(/\r?\n/g, EOL);
}

// dear developer, don't try to update this logic to use jest snapshots, it's rabbit hole
function maybeUpdateSnapshot(fixturePath, output) {
  if (process.env.WRITE_HELP_FIXTURES) {
    fs.writeFileSync(fixturePath, escapeString(output), { encoding: 'utf-8' });
  }
}

function escapeString(word) {
  return word.split('\x1B').join('[x1B]');
}

function unescapeString(word) {
  return word.split('[x1B]').join('\x1B');
}
