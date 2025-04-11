'use strict';

const ember = require('../helpers/ember');
let root = process.cwd();
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const tmp = require('tmp-promise');

const { expect } = require('chai');
const { file } = require('chai-files');

describe('Acceptance: ember generate in-addon-dummy', function () {
  this.timeout(20000);

  before(function () {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function () {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function () {
    const { path } = await tmp.dir();
    process.chdir(path);
  });

  afterEach(function () {
    process.chdir(root);
  });

  function initAddon() {
    return ember(['addon', 'my-addon', '--skip-npm']);
  }

  function generateInAddon(args) {
    let generateArgs = ['generate'].concat(args);

    return initAddon().then(function () {
      return ember(generateArgs);
    });
  }

  it('dummy blueprint foo', async function () {
    await generateInAddon(['blueprint', 'foo', '--dummy']);

    expect(file('blueprints/foo/index.js').content).to.matchSnapshot();
  });

  it('dummy blueprint foo/bar', async function () {
    await generateInAddon(['blueprint', 'foo/bar', '--dummy']);

    expect(file('blueprints/foo/bar/index.js').content).to.matchSnapshot();
  });

  it('dummy http-mock foo', async function () {
    await generateInAddon(['http-mock', 'foo', '--dummy']);

    expect(file('server/index.js').content).to.matchSnapshot();

    expect(file('server/mocks/foo.js').content).to.matchSnapshot();
  });

  it('dummy http-mock foo-bar', async function () {
    await generateInAddon(['http-mock', 'foo-bar', '--dummy']);

    expect(file('server/index.js').content).to.matchSnapshot();

    expect(file('server/mocks/foo-bar.js').content).to.matchSnapshot();
  });

  it('dummy http-proxy foo', async function () {
    await generateInAddon(['http-proxy', 'foo', 'http://localhost:5000', '--dummy']);

    expect(file('server/index.js').content).to.matchSnapshot();

    expect(file('server/proxies/foo.js').content).to.matchSnapshot();
  });

  it('dummy server', async function () {
    await generateInAddon(['server', '--dummy']);
    expect(file('server/index.js')).to.exist;
  });

  // ember addon foo --lang
  // -------------------------------
  // Good: Correct Usage
  it('ember addon foo --lang=(valid code): no message + set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--lang=en-US']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html lang="en-US">');
  });

  // Edge Case: both valid code AND programming language abbreviation, possible misuse
  it('ember addon foo --lang=(valid code + programming language abbreviation): emit warning + set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--lang=css']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html lang="css">');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember addon foo --lang=(programming language): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--lang=JavaScript']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember addon foo --lang=(programming language abbreviation): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--lang=JS']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember addon foo --lang=(programming language file extension): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--lang=.js']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });

  // Misuse: Invalid Country Code
  it('ember addon foo --lang=(invalid code): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--lang=en-UK']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });
});
