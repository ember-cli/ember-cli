'use strict';

const { expect } = require('chai');
const walkUp = require('@ember-tooling/blueprint-model/utilities/walk-up-path');

describe('walk-up-path', function () {
  it('walks up paths', function () {
    let paths = walkUp('app/templates/my/test.hbs');

    expect(paths).to.deep.equal(['app/templates/my', 'app/templates', 'app']);
  });

  it('walks up paths beginning with a slash', function () {
    let paths = walkUp('/app/templates/my/test.hbs');

    expect(paths).to.deep.equal(['/app/templates/my', '/app/templates', '/app']);
  });

  it('walks up paths that have same folder names', function () {
    let paths = walkUp('foo/foo/bar.hbs');

    expect(paths).to.deep.equal(['foo/foo', 'foo']);
  });
});
