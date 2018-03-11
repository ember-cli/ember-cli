'use strict';

const co = require('co');
const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Public', function() {
  let appInput, addonInput, output;

  let APP_PUBLIC = {
    images: {},
    'robots.txt': '',
    '500.html': '',
  };

  let ADDON_PUBLIC = {
    'ember-fetch': {
      'fastboot-fetch.js': '',
    },
  };

  before(co.wrap(function *() {
    appInput = yield createTempDir();
    addonInput = yield createTempDir();

    appInput.write(APP_PUBLIC);
    addonInput.write(ADDON_PUBLIC);
  }));

  after(co.wrap(function *() {
    yield appInput.dispose();
    yield addonInput.dispose();
  }));

  afterEach(co.wrap(function *() {
    yield output.dispose();
  }));

  it('caches packaged public tree', co.wrap(function *() {
    let defaultPackager = new DefaultPackager();

    expect(defaultPackager._cachedPublic).to.equal(null);

    output = yield buildOutput(defaultPackager.packagePublic([
      appInput.path(),
      addonInput.path(),
    ]));

    expect(defaultPackager._cachedPublic).to.not.equal(null);
    expect(defaultPackager._cachedPublic._annotation).to.equal('Packaged Public');
  }));

  it('packages public files', co.wrap(function *() {
    let defaultPackager = new DefaultPackager();

    output = yield buildOutput(defaultPackager.packagePublic([
      appInput.path(),
      addonInput.path(),
    ]));

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal(Object.assign(APP_PUBLIC, ADDON_PUBLIC));
  }));
});
