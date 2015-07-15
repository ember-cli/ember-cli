'use strict';

var expect = require('chai').expect;
var isPackageMissing  = require('../../../lib/utilities/is-package-missing');


var getContext = function(setDevDependency, setDependency) {
  var context = {
    project: {
      pkg: {}
    }
  };

  if (setDevDependency) {
    context.project.pkg['devDependencies'] = {
      'sivakumar': 'kailasam'
    };
  }

  if (setDependency) {
    context.project.pkg['dependencies'] = {
      'sivakumar': 'kailasam'
    };
  }
  return context;
};


describe('Is package missing in package.json', function() {

  it('Package is declared in dependencies', function() {
    expect(isPackageMissing(getContext(false, true), 'sivakumar')).to.be.false;
  });

  it('Package is declared in dev dependencies', function() {
    expect(isPackageMissing(getContext(true, false), 'sivakumar')).to.be.false;
  });

  it('Package is declared in both dependencies and dev dependencies', function() {
   expect(isPackageMissing(getContext(true, true), 'sivakumar')).to.be.false;
  });

  it('Package is missing', function() {
   expect(isPackageMissing(getContext(false, false), 'sivakumar')).to.be.true;
  });

});
