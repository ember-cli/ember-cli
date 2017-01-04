'use strict';

const expect = require('chai').expect;
const findAddonByName = require('../../../lib/utilities/find-addon-by-name');

describe('findAddonByName', function() {
  let addons;
  beforeEach(function() {
    addons = [{
      name: 'foo',
      pkg: { name: 'foo' },
    }, {
      pkg: { name: 'bar-pkg' },
    }, {
      name: 'foo-bar',
      pkg: { name: 'foo-bar' },
    }];
  });

  it('should return the foo addon from name', function() {
    let addon = findAddonByName(addons, 'foo');
    expect(addon.name).to.equal('foo', 'should have found the foo addon');
  });

  it('should return the foo-bar addon from name when a foo also exists', function() {
    let addon = findAddonByName(addons, 'foo-bar');
    expect(addon.name).to.equal('foo-bar', 'should have found the foo-bar addon');
  });

  it('should return the bar-pkg addon from package name', function() {
    let addon = findAddonByName(addons, 'bar-pkg');
    expect(addon.pkg.name).to.equal('bar-pkg', 'should have found the bar-pkg addon');
  });

  it('should return undefined if addon doesn\'t exist', function() {
    let addon = findAddonByName(addons, 'not-an-addon');
    expect(addon).to.equal(undefined, 'not found addon should be undefined');
  });

  it('should not return an addon that is a substring of requested name', function() {
    let addon = findAddonByName(addons, 'foo-ba');
    expect(addon).to.equal(undefined, 'foo-ba should not be found');
  });

  it('should not guess addon name from string with slashes', function() {
    let addon = findAddonByName(addons, 'qux/foo');
    expect(addon).to.equal(undefined, 'should not have found the foo addon');
  });
});
