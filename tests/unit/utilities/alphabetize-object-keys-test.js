'use strict';

var expect                = require('chai').expect;
var alphabetizeObjectKeys = require('../../../lib/utilities/alphabetize-object-keys');

describe('alphabetize-object-keys', function() {
  var dependencies = {
    'b-test-package': '^1.0.0',
    'a-test-package': '^2.0.0'
  };

  it('indents 2 spaces and ends in newline', function() {
    var newDependencies = alphabetizeObjectKeys(dependencies);

    // deep equal is not ordered
    // this just verifies the structure hasn't changed
    expect(newDependencies).to.deep.equal({
      'b-test-package': '^1.0.0',
      'a-test-package': '^2.0.0'
    });

    expect(Object.keys(newDependencies)).to.deep.equal([
      'a-test-package',
      'b-test-package'
    ]);
  });
});
