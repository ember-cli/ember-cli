'use strict';

const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: External', function() {
  let input, output;

  let EXTERNAL = {
    'addon-tree-output': {},
    bower_components: {},
    vendor: {
      'auth0-js.js': '',
      'auth0-lock.js': '',
      'auth0-lock-passwordless.js': '',
    },
  };

  before(async function() {
    input = await createTempDir();

    input.write(EXTERNAL);
  });

  after(async function() {
    await input.dispose();
  });

  afterEach(async function() {
    await output.dispose();
  });

  it('applies transforms to an external tree', async function() {
    let customTransformsMap = new Map();

    customTransformsMap.set('amd', {
      files: ['vendor/auth0-js.js', 'vendor/auth0-lock.js', 'vendor/auth0-lock-passwordless.js'],
      callback(tree, options) {
        const stew = require('broccoli-stew');

        return stew.map(tree, (content, relativePath) => {
          const name = options[relativePath].as;

          return `${name} was transformed`;
        });
      },
      processOptions() {},
      options: {
        'vendor/auth0-js.js': {
          as: 'auth0',
        },
        'vendor/auth0-lock-passwordless.js': {
          as: 'auth0-lock-passwordless',
        },
        'vendor/auth0-lock.js': {
          as: 'auth0-lock',
        },
      },
    });

    let defaultPackager = new DefaultPackager({
      customTransformsMap,
    });

    output = await buildOutput(defaultPackager.applyCustomTransforms(input.path()));

    let outputFiles = output.read();

    expect(outputFiles.vendor).to.deep.equal({
      'auth0-js.js': 'auth0 was transformed',
      'auth0-lock.js': 'auth0-lock was transformed',
      'auth0-lock-passwordless.js': 'auth0-lock-passwordless was transformed',
    });
  });
});
