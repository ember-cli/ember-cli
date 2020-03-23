'use strict';

const path = require('path');
const ember = require('../helpers/ember');
let root = process.cwd();

describe('Acceptance: missing a before/after addon', function () {
  beforeEach(function () {
    process.chdir(path.join(root, 'tests', 'fixtures', 'missing-before-addon'));
  });

  afterEach(function () {
    process.chdir(root);
  });

  it('does not break ember-cli', function () {
    return ember(['help']);
  });
});
