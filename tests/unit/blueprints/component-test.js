'use strict';

var Blueprint = require('../../../lib/models/blueprint');
var assert    = require('assert');

describe('blueprint - component', function(){
  describe('entityName', function(){
    it('throws error when hyphen is not present', function(){
      var blueprint = Blueprint.lookup('component');

      assert.throws(function(){
        var nonConformantComponentName = 'form';
        blueprint.normalizeEntityName(nonConformantComponentName);
      }, /must have a hyphen/);
    });


    it('keeps existing behavior by calling Blueprint.normalizeEntityName', function(){
      var blueprint = Blueprint.lookup('component');

      assert.throws(function(){
        var nonConformantComponentName = 'x-form/';
        blueprint.normalizeEntityName(nonConformantComponentName);
      }, /trailing slash/);

    });

    it('throws error when slash is found within component', function(){
      var blueprint = Blueprint.lookup('component');

      assert.throws(function(){
        var nonConformantComponentName = 'x-form/blah';
        blueprint.normalizeEntityName(nonConformantComponentName);
      }, /due to a bug in Handlebars \(< 2.0\) slashes within components\/helpers are not allowed/);

    });
  });
});
