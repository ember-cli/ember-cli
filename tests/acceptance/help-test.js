'use strict';

const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const EOL = require('os').EOL;
const processHelpString = require('../helpers/process-help-string');
const convertToJson = require('../helpers/convert-help-output-to-json');
const { execa } = require('execa');
const fixturify = require('fixturify');

const FixturifyProject = require('../helpers/fixturify-project');

const addonCommandIndex = `module.exports = {
  name: require('./package').name,

  includedCommands() {
    return {
      'foo': {
        name: 'foo',
        description: 'Initializes the warp drive.',
        works: 'insideProject',

        availableOptions: [{ name: 'dry-run', type: Boolean, default: false, aliases: ['d'] }],

        anonymousOptions: ['<speed>'],
      },
    };
  },
};`;

describe('Acceptance: ember help in classic', function () {
  let project;

  before(async function () {
    project = new FixturifyProject('awesome-proj', '1.0.0');
    project.linkDevDependency('ember-cli', { baseDir: __dirname });
    await project.write();
  });

  it('works', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember help`;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'classic', 'help.txt');

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

    let expected = loadTextFixture(fixturePath);
    expect(output).to.equal(expected);
  });

  describe('with addon command', function () {
    let project;
    before(async function () {
      project = new FixturifyProject('awesome-proj', '1.0.0');
      project.linkDevDependency('ember-cli', { baseDir: path.join(__dirname, '..', '..') });

      const addon = project.addDevAddon('dummy-addon', '1.0.0');

      addon.files['index.js'] = addonCommandIndex;

      await project.write();
    });

    it('prints addon commands', async function () {
      const { stdout: output } = await execa({ cwd: project.baseDir })`ember help`;

      let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'classic', 'help-with-addon.txt');

      // makes updating this fixture much much easier...
      if (process.env.WRITE_HELP_FIXTURES) {
        fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
      }

      let expected = loadTextFixture(fixturePath);

      expect(output).to.equal(expected);
    });

    it('prints single addon commands', async function () {
      const { stdout: output } = await execa({ cwd: project.baseDir })`ember help foo`;

      let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'classic', 'foo.txt');
      let expected = loadTextFixture(fixturePath);

      expect(output).to.equal(expected);
    });
  });

  it('prints all blueprints', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember generate --help`;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'classic', 'generate.txt');

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }
    let expected = loadTextFixture(fixturePath);

    expect(output).to.contain(expected);
  });

  it('prints helpful message for unknown command', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember help asdf`;

    expect(output).to.contain("No help entry for 'asdf'");
    expect(output).to.not.contain('undefined');
  });

  it('prints a single blueprints', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember generate blueprint --help`;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'classic', 'generate-blueprint.txt');

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

    let expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  describe('--json', function () {
    let project;

    beforeEach(async function () {
      project = new FixturifyProject('awesome-proj', '1.0.0');
      project.linkDevDependency('ember-cli', { baseDir: path.join(__dirname, '..', '..') });
      await project.write();
    });

    it('works', async function () {
      const { stdout } = await execa({ cwd: project.baseDir })`ember --help --json`;

      let json = convertToJson(stdout);
      const expected = require('../fixtures/help/classic/help.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints commands from addons', async function () {
      project = new FixturifyProject('awesome-proj', '1.0.0');
      project.linkDevDependency('ember-cli', { baseDir: path.join(__dirname, '..', '..') });

      const addon = project.addDevAddon('dummy-addon', '1.0.0');

      addon.files['index.js'] = addonCommandIndex;

      await project.write();

      const { stdout } = await execa({ cwd: project.baseDir })`ember --help --json`;

      let json = convertToJson(stdout);
      const expected = require('../fixtures/help/classic/with-addon-commands.js');

      expect(json).to.deep.equal(expected);
    });
  });

  describe('loading blueprint fixtures', function () {
    before(async function () {
      const blueprintFiles = fixturify.readSync(path.join(__dirname, '..', 'fixtures', 'blueprints'));

      project = new FixturifyProject('awesome-proj', '1.0.0');
      project.linkDevDependency('ember-cli', { baseDir: __dirname });

      const addon = project.addDevAddon('fixtures', '1.0.0');

      addon.files.blueprints = blueprintFiles;
      addon.linkDependency('@ember-tooling/blueprint-model', { baseDir: __dirname });

      await project.write();
    });

    it('prints blueprints from addons', async function () {
      const { stdout: output } = await execa({ cwd: project.baseDir })`ember generate --help`;

      let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'classic', 'generate-with-addon.txt');

      // makes updating this fixture much much easier...
      if (process.env.WRITE_HELP_FIXTURES) {
        fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
      }

      let expected = loadTextFixture(fixturePath);

      expect(output).to.equal(expected);
    });

    it('prints blueprints from addons with --json', async function () {
      const { stdout } = await execa({ cwd: project.baseDir })`ember generate --help --json`;

      let json = convertToJson(stdout);
      const expected = require('../fixtures/help/classic/with-addon-blueprints.js');

      expect(json).to.deep.equal(expected);
    });
  });
});

describe('Acceptance: ember help in vite', function () {
  let project;

  before(async function () {
    project = new FixturifyProject('awesome-proj', '1.0.0');
    project.linkDevDependency('ember-cli', { baseDir: __dirname });
    project.addDevDependency('@embroider/vite');
    await project.write();
  });

  it('works', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember --help`;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'help.txt');

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

    let expected = loadTextFixture(fixturePath);
    expect(output).to.equal(expected);
  });

  describe('with addon command', function () {
    let project;
    before(async function () {
      project = new FixturifyProject('awesome-proj', '1.0.0');
      project.linkDevDependency('ember-cli', { baseDir: path.join(__dirname, '..', '..') });
      project.addDevDependency('@embroider/vite');

      const addon = project.addDevAddon('dummy-addon', '1.0.0');

      addon.files['index.js'] = addonCommandIndex;

      await project.write();
    });

    it('prints addon commands', async function () {
      const { stdout: output } = await execa({ cwd: project.baseDir })`ember --help`;

      let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'help-with-addon.txt');

      // makes updating this fixture much much easier...
      if (process.env.WRITE_HELP_FIXTURES) {
        fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
      }

      let expected = loadTextFixture(fixturePath);

      expect(output).to.equal(expected);
    });

    it('prints single addon commands', async function () {
      const { stdout: output } = await execa({ cwd: project.baseDir })`ember foo --help`;

      let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'foo.txt');
      let expected = loadTextFixture(fixturePath);

      expect(output).to.equal(expected);
    });
  });

  it('prints all blueprints', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember generate --help`;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate.txt');

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }
    let expected = loadTextFixture(fixturePath);

    expect(output).to.contain(expected);
  });

  it('prints helpful message for unknown command', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember help asdf`;

    expect(output).to.contain("No help entry for 'asdf'");
    expect(output).to.not.contain('undefined');
  });

  it('prints a single blueprints', async function () {
    const { stdout: output } = await execa({ cwd: project.baseDir })`ember generate blueprint --help`;

    let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate-blueprint.txt');

    // makes updating this fixture much much easier...
    if (process.env.WRITE_HELP_FIXTURES) {
      fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
    }

    let expected = loadTextFixture(fixturePath);

    expect(output).to.equal(expected);
  });

  describe('--json', function () {
    it('works', async function () {
      const { stdout } = await execa({ cwd: project.baseDir })`ember --help --json`;

      let json = convertToJson(stdout);
      const expected = require('../fixtures/help/help.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints commands from addons', async function () {
      let project = new FixturifyProject('awesome-proj', '1.0.0');
      project.linkDevDependency('ember-cli', { baseDir: path.join(__dirname, '..', '..') });
      project.addDevDependency('@embroider/vite');

      const addon = project.addDevAddon('dummy-addon', '1.0.0');

      addon.files['index.js'] = `module.exports = {
  name: require('./package').name,

  includedCommands() {
    return {
      'foo': {
        name: 'foo',
        description: 'Initializes the warp drive.',
        works: 'insideProject',

        availableOptions: [{ name: 'dry-run', type: Boolean, default: false, aliases: ['d'] }],

        anonymousOptions: ['<speed>'],
      },
    };
  },
};`;

      await project.write();

      const { stdout } = await execa({ cwd: project.baseDir })`ember --help --json`;

      // options.project.eachAddonCommand = function (cb) {
      //   cb('dummy-addon', { Foo: FooCommand });
      // };

      // command.run(options, []);

      let json = convertToJson(stdout);
      const expected = require('../fixtures/help/with-addon-commands.js');

      expect(json).to.deep.equal(expected);
    });
  });

  describe('loading blueprint fixtures', function () {
    before(async function () {
      const blueprintFiles = fixturify.readSync(path.join(__dirname, '..', 'fixtures', 'blueprints'));

      project = new FixturifyProject('awesome-proj', '1.0.0');
      project.linkDevDependency('ember-cli', { baseDir: __dirname });
      project.addDevDependency('@embroider/vite');

      const addon = project.addDevAddon('fixtures', '1.0.0');

      addon.files.blueprints = blueprintFiles;
      addon.linkDependency('@ember-tooling/blueprint-model', { baseDir: __dirname });

      await project.write();
    });

    it('prints blueprints from addons with --json', async function () {
      const { stdout } = await execa({ cwd: project.baseDir })`ember --help --json`;

      let json = convertToJson(stdout);
      const expected = require('../fixtures/help/with-addon-blueprints.js');

      expect(json).to.deep.equal(expected);
    });

    it('prints blueprints from addons', async function () {
      const { stdout: output } = await execa({ cwd: project.baseDir })`ember generate --help`;

      let fixturePath = path.join(__dirname, '..', 'fixtures', 'help', 'generate-with-addon.txt');

      // makes updating this fixture much much easier...
      if (process.env.WRITE_HELP_FIXTURES) {
        fs.writeFileSync(fixturePath, output, { encoding: 'utf-8' });
      }

      let expected = loadTextFixture(fixturePath);

      expect(output).to.equal(expected);
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
