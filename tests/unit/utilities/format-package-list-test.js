'use strict';

var expect = require('chai').expect;
var formatPackageList = require('../../../lib/utilities/format-package-list');

describe('format-package-list', function() {
  it('correctly formats package list with 1 item', function() {
    var result = formatPackageList(['ember-foo']);
    expect(result).to.equal('ember-foo');
  });

  it('correctly formats package list with 2 items', function() {
    var result = formatPackageList(['ember-foo', 'bar']);
    expect(result).to.equal('ember-foo and bar');
  });

  it('correctly formats package list with 3 items', function() {
    var result = formatPackageList(['ember-foo', 'bar', 'baaaaz']);
    expect(result).to.equal('ember-foo, bar and baaaaz');
  });

  it('correctly formats package list with 4 items', function() {
    var result = formatPackageList(['ember-foo', 'bar', 'baaaaz', 'ember-blabla']);
    expect(result).to.equal('ember-foo, bar and 2 other packages');
  });

  it('correctly formats package list with 100 items', function() {
    var list = [];
    for (var i = 1; i <= 100; i++) {
      list.push('package-' + i);
    }

    var result = formatPackageList(list);
    expect(result).to.equal('package-1, package-2 and 98 other packages');
  });

  it('returns generic "dependencies" without input', function() {
    var result = formatPackageList();
    expect(result).to.equal('dependencies');
  });

  it('returns generic "dependencies" for invalid input', function() {
    var result = formatPackageList('foo');
    expect(result).to.equal('dependencies');
  });

  it('returns generic "dependencies" for empty input', function() {
    var result = formatPackageList([]);
    expect(result).to.equal('dependencies');
  });
});
