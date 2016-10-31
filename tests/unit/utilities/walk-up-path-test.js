'use strict';

var expect = require('chai').expect;
var walkUp = require('../../../lib/utilities/walk-up-path');

describe('walk-up-path', function() {
  it('walks up paths', function() {
    var paths = walkUp('app/templates/my/test.hbs');

    expect(paths).to.deep.equal([
      'app/templates/my',
      'app/templates',
      'app',
    ]);
  });

  it('walks up paths beginning with a slash', function() {
    var paths = walkUp('/app/templates/my/test.hbs');

    expect(paths).to.deep.equal([
      '/app/templates/my',
      '/app/templates',
      '/app',
    ]);
  });

  it('walks up paths that have same folder names', function() {
    var paths = walkUp('foo/foo/bar.hbs');

    expect(paths).to.deep.equal([
      'foo/foo',
      'foo'
    ]);
  });
});
