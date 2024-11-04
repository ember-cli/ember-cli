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
    let commands = require('../../lib/commands');

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

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

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

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

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
    let expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  it('prints all blueprints', function () {
    command.run(options, ['generate']);

    let output = options.ui.output;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate.txt');
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

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

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

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

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
  let decoded = decodeUnicode(content);
  let processed = processHelpString(decoded);
  return processed.replace(/\n/g, EOL);
}

function decodeUnicode(str) {
  return str.replace(/\\u([\d\w]{4})/gi, function (match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
  });
}
