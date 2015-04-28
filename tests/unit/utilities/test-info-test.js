'use strict';

var testInfo     = require('../../../lib/utilities/test-info');
var expect       = require('chai').expect;

describe('testInfo.humanize()', function() {
  it('should humanize strings correctly', function() {
    expect(testInfo.humanize('my-cool-feature')).to.equal('my cool feature');
    expect(testInfo.humanize('myCoolCamelCaseFeature')).to.equal('my cool camel case feature');
    expect(testInfo.humanize('this_is_snake_case')).to.equal('this is snake case');
    expect(testInfo.humanize('this-is-dasherized')).to.equal('this is dasherized');
    expect(testInfo.humanize('runonstring')).to.equal('runonstring');
  });
});


describe('testInfo.name()', function() {
  it('should return friendly name correctly', function() {
    expect(testInfo.name('my-cool-feature', 'Acceptance', null)).to.equal('Acceptance | my cool feature');
    expect(testInfo.name('myCoolCamelCaseFeature', 'Acceptance', null)).to.equal('Acceptance | my cool camel case feature');
    expect(testInfo.name('my-Mixin', 'Unit', 'Mixin')).to.equal('Unit | Mixin | my mixin');
    expect(testInfo.name('Foo', 'Unit', 'Model')).to.equal('Unit | Model | foo');
    expect(testInfo.name('foo-bar', 'Unit', 'Model')).to.equal('Unit | Model | foo bar');
  });
});

describe('testInfo.description()', function() {
  it('should return friendly description correctly', function() {
    expect(testInfo.description('x-foo', 'Unit', 'Component')).to.equal('Unit | Component | x foo');
  });
});
