'use strict';

var assertUtility = require('../../../lib/utilities/assert');
var assert        = require('../../helpers/assert');

describe('assert helper', function(){
  it('throws if the condition is false', function(){
    assert.throws(function() {
      assertUtility('ZOMG', false);
    }, 'ZOMG');
  });

  it('doesn\'t throw if the condition is true', function(){
    assert.doesNotThrow(function() {
      assertUtility('ZOMG', true);
    }, 'ZOMG');
  });
});
