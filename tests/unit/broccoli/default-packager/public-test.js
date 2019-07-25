'use strict';

const co = require('co');
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

  before(
    co.wrap(function*() {
      input = yield createTempDir();

      input.write(PUBLIC);
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
    'caches packaged public tree',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager();

      expect(defaultPackager._cachedPublic).to.equal(null);

      output = yield buildOutput(defaultPackager.packagePublic(input.path()));

      expect(defaultPackager._cachedPublic).to.not.equal(null);
    })
  );

  it(
    'packages public files',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager();

      output = yield buildOutput(defaultPackager.packagePublic(input.path()));

      let outputFiles = output.read();

      expect(outputFiles).to.deep.equal(PUBLIC.public);
    })
  );
});
