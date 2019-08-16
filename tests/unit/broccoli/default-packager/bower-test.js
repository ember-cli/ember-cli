'use strict';

const co = require('co');
const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Bower', function() {
  let input;

  let BOWER_PACKAGES = {
    'ember.js': {
      dist: {
        'ember.js': 'ember',
      },
    },
    pusher: {
      dist: {
        'pusher.js': 'pusher',
      },
    },
    'raven-js': {
      dist: {
        'raven.js': 'raven',
      },
    },
  };

  before(
    co.wrap(function*() {
      input = yield createTempDir();

      input.write(BOWER_PACKAGES);
    })
  );

  after(
    co.wrap(function*() {
      yield input.dispose();
    })
  );

  it(
    'caches packaged bower tree',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager();

      expect(defaultPackager._cachedBower).to.equal(null);

      yield buildOutput(defaultPackager.packageBower(input.path()));

      expect(defaultPackager._cachedBower).to.not.equal(null);
      expect(defaultPackager._cachedBower._annotation).to.equal('Packaged Bower');
    })
  );

  it(
    'packages bower files with default folder',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager();

      let packagedBower = yield buildOutput(defaultPackager.packageBower(input.path()));
      let output = packagedBower.read();

      expect(output).to.deep.equal({
        bower_components: BOWER_PACKAGES,
      });
    })
  );

  it(
    'packages bower files with custom folder',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager();

      let packagedBower = yield buildOutput(defaultPackager.packageBower(input.path(), 'foobar'));
      let output = packagedBower.read();

      expect(output).to.deep.equal({
        foobar: BOWER_PACKAGES,
      });
    })
  );
});
