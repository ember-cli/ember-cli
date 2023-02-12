'use strict';

const { expect } = require('chai');
const formatPackageList = require('../../../lib/utilities/format-package-list');

describe('format-package-list', function () {
  it('correctly formats package list with 1 item', function () {
    let result = formatPackageList(['ember-foo']);
    expect(result).to.equal('ember-foo');
  });

  it('correctly formats package list with 2 items', function () {
    let result = formatPackageList(['ember-foo', 'bar']);
    expect(result).to.equal('ember-foo and bar');
  });

  it('correctly formats package list with 3 items', function () {
    let result = formatPackageList(['ember-foo', 'bar', 'baaaaz']);
    expect(result).to.equal('ember-foo, bar and baaaaz');
  });

  it('correctly formats package list with 4 items', function () {
    let result = formatPackageList(['ember-foo', 'bar', 'baaaaz', 'ember-blabla']);
    expect(result).to.equal('ember-foo, bar and 2 other packages');
  });

  it('correctly formats package list with 100 items', function () {
    let list = [];
    for (let i = 1; i <= 100; i++) {
      list.push(`package-${i}`);
    }

    let result = formatPackageList(list);
    expect(result).to.equal('package-1, package-2 and 98 other packages');
  });

  it('returns generic "dependencies" without input', function () {
    let result = formatPackageList();
    expect(result).to.equal('dependencies');
  });

  it('returns generic "dependencies" for invalid input', function () {
    let result = formatPackageList('foo');
    expect(result).to.equal('dependencies');
  });

  it('returns generic "dependencies" for empty input', function () {
    let result = formatPackageList([]);
    expect(result).to.equal('dependencies');
  });
});
