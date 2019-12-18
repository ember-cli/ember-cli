'use strict';

const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Config', function() {
  let input, output;
  let name = 'the-best-app-ever';
  let env = 'development';

  let CONFIG = {
    config: {
      'environment.js': '',
    },
  };
  let project = {
    configPath() {
      return `${input.path()}/config/environment`;
    },

    config() {
      return { a: 1 };
    },
  };

  before(async function() {
    input = await createTempDir();

    input.write(CONFIG);
  });

  after(async function() {
    await input.dispose();
  });

  afterEach(async function() {
    await output.dispose();
  });

  it('caches packaged config tree', async function() {
    let defaultPackager = new DefaultPackager({
      name,
      project,
      env,
    });

    expect(defaultPackager._cachedConfig).to.equal(null);

    output = await buildOutput(defaultPackager.packageConfig());

    expect(defaultPackager._cachedConfig).to.not.equal(null);
    expect(defaultPackager._cachedConfig._annotation).to.equal('Packaged Config');
  });

  it('packages config files w/ tests disabled', async function() {
    let defaultPackager = new DefaultPackager({
      name,
      project,
      env,
      areTestsEnabled: false,
    });

    output = await buildOutput(defaultPackager.packageConfig());

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal({
      [name]: {
        config: {
          environments: {
            'development.json': '{"a":1}',
          },
        },
      },
    });
  });

  it('packages config files w/ tests enabled', async function() {
    let defaultPackager = new DefaultPackager({
      name,
      project,
      env,
      areTestsEnabled: true,
    });

    output = await buildOutput(defaultPackager.packageConfig());

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal({
      [name]: {
        config: {
          environments: {
            'development.json': '{"a":1}',
            'test.json': '{"a":1}',
          },
        },
      },
    });
  });
});
