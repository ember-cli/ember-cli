'use strict';

const expect = require('chai').expect;
const findAddonByName = require('../../../lib/utilities/find-addon-by-name');
const clearCaches = findAddonByName._clearCaches;

describe('findAddonByName', function() {
  let addons, originalConsole, consoleOutput;

  beforeEach(function() {
    originalConsole = Object.assign({}, console);
    consoleOutput = [];
    console.warn = message => consoleOutput.push(['warn', message]);
    console.trace = message => consoleOutput.push(['trace', message]);

    addons = [
      {
        name: 'foo',
        root: 'node_modules/foo',
        pkg: { name: 'foo' },
      },
      {
        pkg: { name: 'bar-pkg' },
        root: 'node_modules/bar-pkg',
      },
      {
        name: 'foo-bar',
        root: 'node_modules/foo-bar',
        pkg: { name: 'foo-bar' },
      },
      {
        name: '@scoped/foo-bar',
        root: 'node_modules/@scoped/foo-bar',
        pkg: { name: '@scoped/foo-bar' },
      },
      {
        name: 'thing',
        root: 'node_modules/@scoped/thing',
        pkg: { name: '@scope/thing' },
      },
      {
        name: '@scoped/other',
        root: 'node_modules/@scoped/other',
        pkg: { name: '@scoped/other' },
      },
    ];
  });

  afterEach(function() {
    Object.assign(console, originalConsole);
    clearCaches();
  });

  it('should return the foo addon from name', function() {
    let addon = findAddonByName(addons, 'foo');
    expect(addon.name).to.equal('foo', 'should have found the foo addon');
    expect(consoleOutput).to.deep.equal([]);
  });

  it('should return the foo-bar addon from name when a foo also exists', function() {
    let addon = findAddonByName(addons, 'foo-bar');
    expect(addon.name).to.equal('foo-bar', 'should have found the foo-bar addon');
    expect(consoleOutput).to.deep.equal([]);
  });

  it('should return the bar-pkg addon from package name', function() {
    let addon = findAddonByName(addons, 'bar-pkg');
    expect(addon.pkg.name).to.equal('bar-pkg', 'should have found the bar-pkg addon');
    expect(consoleOutput).to.deep.equal([]);
  });

  it("should return null if addon doesn't exist", function() {
    let addon = findAddonByName(addons, 'not-an-addon');
    expect(addon).to.equal(null, 'not found addon should be null');
    expect(consoleOutput).to.deep.equal([]);
  });

  it('should not return an addon that is a substring of requested name', function() {
    let addon = findAddonByName(addons, 'foo-ba');
    expect(addon).to.equal(null, 'foo-ba should not be found');
    expect(consoleOutput).to.deep.equal([]);
  });

  it('should not guess addon name from string with slashes', function() {
    let addon = findAddonByName(addons, 'qux/foo');
    expect(addon).to.equal(null, 'should not have found the foo addon');
    expect(consoleOutput).to.deep.equal([]);
  });

  it('matches scoped packages when names match exactly', function() {
    let addon = findAddonByName(addons, '@scoped/other');
    expect(addon.pkg.name).to.equal('@scoped/other');
    expect(consoleOutput).to.deep.equal([]);
  });

  it('matches unscoped name of scoped package when no exact match is found with logging', function() {
    let addon = findAddonByName(addons, 'other');
    expect(addon.pkg.name).to.equal('@scoped/other');
    expect(consoleOutput).to.deep.equal([
      [
        'trace',
        "Finding a scoped addon via its unscoped name is deprecated. You searched for `other` which we found as `@scoped/other` in 'node_modules/@scoped/other'",
      ],
    ]);
  });

  it('matches unscoped name of scoped package repeatedly when no exact match is found with logging', function() {
    let addon = findAddonByName(addons, 'other');
    expect(addon.pkg.name).to.equal('@scoped/other');

    addon = findAddonByName(addons, 'other');
    expect(addon.pkg.name).to.equal('@scoped/other');

    addon = findAddonByName(addons, 'other');
    expect(addon.pkg.name).to.equal('@scoped/other');

    expect(consoleOutput).to.deep.equal([
      [
        'trace',
        "Finding a scoped addon via its unscoped name is deprecated. You searched for `other` which we found as `@scoped/other` in 'node_modules/@scoped/other'",
      ],
    ]);
  });

  it('if exact match is found, it "wins" over unscoped matches', function() {
    let addon = findAddonByName(addons, 'foo-bar');
    expect(addon.pkg.name).to.equal('foo-bar');
    expect(consoleOutput).to.deep.equal([]);
  });

  it('if exact match by addon name is found, it "wins" with a warning', function() {
    let addon = findAddonByName(addons, 'thing');
    expect(addon.pkg.name).to.equal('@scope/thing');
    expect(consoleOutput).to.deep.equal([
      [
        'warn',
        "The addon at `node_modules/@scoped/thing` has different values in its addon index.js ('thing') and its package.json ('@scope/thing').",
      ],
    ]);
  });

  it('if exact match by addon name is found, it "wins" repeatedly', function() {
    let addon = findAddonByName(addons, 'thing');
    expect(addon.pkg.name).to.equal('@scope/thing');

    addon = findAddonByName(addons, 'thing');
    expect(addon.pkg.name).to.equal('@scope/thing');

    addon = findAddonByName(addons, 'thing');
    expect(addon.pkg.name).to.equal('@scope/thing');

    addon = findAddonByName(addons, 'thing');
    expect(addon.pkg.name).to.equal('@scope/thing');

    expect(consoleOutput).to.deep.equal([
      [
        'warn',
        "The addon at `node_modules/@scoped/thing` has different values in its addon index.js ('thing') and its package.json ('@scope/thing').",
      ],
    ]);
  });
});
