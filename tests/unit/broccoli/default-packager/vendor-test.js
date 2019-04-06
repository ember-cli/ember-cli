'use strict';

const co = require('co');
const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Vendor', function() {
  let input, output;

  let VENDOR_PACKAGES = {
    'babel-polyfill': {
      'polyfill.js': 'polyfill',
      'polyfill.min.js': 'polyfill',
    },
    'ember-fetch.js': 'ember fetch',
    'ember-weakmap-passthrough.js': 'ember weakmap',
    'ember-weakmap-polyfill.js': 'ember weakmap',
    'install-getowner-polyfill.js': 'install getowner',
    'ember-cli-mirage': {
      'prentender-shim.js': 'pretender',
    },
    'ember-cli-shims': {
      'app-shims.js': 'app shims',
      'deprecations.js': 'deprecations',
    },
    ember: {
      'ember.min.js': 'ember',
    },
    loader: {
      'loader.js': 'loader',
    },
    'ember-resolver': {
      'legacy-shims.js': 'legacy shims',
    },
    tether: {
      js: {
        'tether.js': 'tether',
      },
    },
  };

  before(
    co.wrap(function*() {
      input = yield createTempDir();

      input.write(VENDOR_PACKAGES);
    })
  );

  after(
    co.wrap(function*() {
      yield input.dispose();
    })
  );

  afterEach(
    co.wrap(function*() {
      yield output.dispose();
    })
  );

  it(
    'caches packaged vendor tree',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager();

      expect(defaultPackager._cachedVendor).to.equal(null);

      output = yield buildOutput(defaultPackager.packageVendor(input.path()));

      expect(defaultPackager._cachedVendor).to.not.equal(null);
      expect(defaultPackager._cachedVendor._annotation).to.equal('Packaged Vendor');
    })
  );

  it(
    'packages vendor files',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager();

      output = yield buildOutput(defaultPackager.packageVendor(input.path()));

      let outputFiles = output.read();

      expect(outputFiles).to.deep.equal({
        vendor: VENDOR_PACKAGES,
      });
    })
  );
});
