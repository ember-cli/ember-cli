'use strict';

const ember = require('../helpers/ember');
const path = require('path');
const fs = require('fs-extra');
let root = process.cwd();
const Blueprint = require('@ember-tooling/blueprint-model');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const tmp = require('tmp-promise');

const { expect } = require('chai');
const { file } = require('chai-files');

describe('Acceptance: ember generate in-addon', function () {
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

  function initAddon(name) {
    return ember(['addon', name, '--skip-npm']);
  }

  function generateInAddon(args) {
    let name = 'my-addon';
    let generateArgs = ['generate'].concat(args);

    if (arguments.length > 1) {
      name = arguments[1];
    }

    return initAddon(name).then(function () {
      return ember(generateArgs);
    });
  }

  it('in-addon addon-import cannot be called directly', async function () {
    try {
      await generateInAddon(['addon-import', 'foo']);
    } catch (error) {
      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal('You cannot call the addon-import blueprint directly.');
    }
  });

  it('runs the `addon-import` blueprint from a classic addon', async function () {
    await initAddon('my-addon');

    await fs.outputFile(
      'blueprints/service/files/__root__/__path__/__name__.js',
      "import Service from '@ember/service';\n" + 'export default Service.extend({ });\n'
    );

    await ember(['generate', 'service', 'session']);

    expect(file('app/services/session.js')).to.exist;
  });

  it('runs a custom "*-addon" blueprint from a classic addon', async function () {
    await initAddon('my-addon');

    await fs.outputFile(
      'blueprints/service/files/__root__/__path__/__name__.js',
      "import Service from '@ember/service';\n" + 'export default Service.extend({ });\n'
    );

    await fs.outputFile(
      'blueprints/service-addon/files/app/services/session.js',
      "export { default } from 'somewhere';\n"
    );

    await ember(['generate', 'service', 'session']);

    expect(file('app/services/session.js')).to.exist;
  });

  it('in-addon blueprint foo', async function () {
    await generateInAddon(['blueprint', 'foo']);

    expect(file('blueprints/foo/index.js').content).to.matchSnapshot();
  });

  it('in-addon blueprint foo/bar', async function () {
    await generateInAddon(['blueprint', 'foo/bar']);

    expect(file('blueprints/foo/bar/index.js').content).to.matchSnapshot();
  });

  it('in-addon http-mock foo', async function () {
    await generateInAddon(['http-mock', 'foo']);

    expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

    expect(file('server/mocks/foo.js').content).to.matchSnapshot();
  });

  it('in-addon http-mock foo-bar', async function () {
    await generateInAddon(['http-mock', 'foo-bar']);

    expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

    expect(file('server/mocks/foo-bar.js').content).to.matchSnapshot();
  });

  it('in-addon http-proxy foo', async function () {
    await generateInAddon(['http-proxy', 'foo', 'http://localhost:5000']);

    expect(file('server/index.js')).to.contain('proxies.forEach(route => route(app));');

    expect(file('server/proxies/foo.js').content).to.matchSnapshot();
  });

  it('in-addon server', async function () {
    await generateInAddon(['server']);
    expect(file('server/index.js')).to.exist;
  });

  it('successfully generates the default blueprint for scoped addons', async function () {
    await initAddon('@foo/bar');
    await ember(['g', 'blueprint', '@foo/bar']);
    await fs.outputFile('blueprints/@foo/bar/files/__name__.js', '');
    await ember(['g', '@foo/bar', 'baz']);

    expect(file('baz.js')).to.exist;
  });

  it(`throws the unknown blueprint error when \`name\` matches a folder's name, but doesn't include the \`${path.sep}\` char`, async function () {
    await expect(generateInAddon(['tests'])).to.be.rejectedWith('Unknown blueprint: tests');
  });
});
