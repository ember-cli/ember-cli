'use strict';

var fs = require('fs');
var fixturePath = __dirname + '/../../fixtures/babel-error-stack';
var input = fs.readFileSync(fixturePath + '/input.txt').toString();
var output = fs.readFileSync(fixturePath + '/output.txt').toString();
var expect   = require('chai').expect;

var cleanBabelError = require('../../../lib/utilities/clean-babel-error');

describe('ensure clean-babel-error works', function() {
  it ('works', function(){ 
    var error = { stack: input };
    cleanBabelError(error);
    expect(error.stack).to.equal(output);
  });
});
