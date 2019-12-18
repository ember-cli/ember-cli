'use strict';

const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Public', function() {
  let input, output;

  let PUBLIC = {
    public: {
      images: {},
      'ember-fetch': {
        'fastboot-fetch.js': '',
      },
      'robots.txt': '',
      '500.html': '',
    },
  };

  before(async function() {
    input = await createTempDir();

    input.write(PUBLIC);
  });

  after(async function() {
    await input.dispose();
  });

  afterEach(async function() {
    await output.dispose();
  });

  it('caches packaged public tree', async function() {
    let defaultPackager = new DefaultPackager();

    expect(defaultPackager._cachedPublic).to.equal(null);

    output = await buildOutput(defaultPackager.packagePublic(input.path()));

    expect(defaultPackager._cachedPublic).to.not.equal(null);
  });

  it('packages public files', async function() {
    let defaultPackager = new DefaultPackager();

    output = await buildOutput(defaultPackager.packagePublic(input.path()));

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal(PUBLIC.public);
  });
});
