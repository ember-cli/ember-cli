'use strict';

var expect                = require('chai').expect;
var stringifyAndNormalize = require('../../../lib/utilities/stringify-and-normalize');

describe('stringify-and-normalize', function() {
  var packageJson = {
    dependencies: {
      'test-package': '^1.0.0'
    }
  };

  it('indents 2 spaces and ends in newline', function() {
    var string = stringifyAndNormalize(packageJson);

    expect(string).to.equal('\
{\n\
  "dependencies": {\n\
    "test-package": "^1.0.0"\n\
  }\n\
}\n');
  });
});
