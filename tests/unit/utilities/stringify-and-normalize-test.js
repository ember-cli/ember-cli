'use strict';

const { expect } = require('chai');
const stringifyAndNormalize = require('../../../lib/utilities/stringify-and-normalize');

describe('stringify-and-normalize', function () {
  let packageJson = {
    dependencies: {
      'test-package': '^1.0.0',
    },
  };

  it('indents 2 spaces and ends in newline', function () {
    let string = stringifyAndNormalize(packageJson);

    expect(string).to.equal(
      '\
{\n\
  "dependencies": {\n\
    "test-package": "^1.0.0"\n\
  }\n\
}\n'
    );
  });
});
