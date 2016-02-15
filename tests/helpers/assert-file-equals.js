'use strict';

var expect = require('chai').expect;
var fs     = require('fs');
var EOL    = require('os').EOL;

/*
  Assert that a given file matches another.

  @method assertFileEqual
  @param {String} pathToActual
  @param {String} pathToExpected
*/
module.exports = function assertFileEquals(pathToActual, pathToExpected) {
  var actual = fs.readFileSync(pathToActual, { encoding: 'utf-8' });
  var expected = fs.readFileSync(pathToExpected, { encoding: 'utf-8' });

  if (EOL !== '\n') {
    expected = expected.replace(/\n/g, '\r\n');
  }

  expect(actual).to.equal(expected);
};
