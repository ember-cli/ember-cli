'use strict';

var CoreObject = require('../../../lib/models/core-object');
var assert  = require('assert');

describe('models/core-object.js', function() {

  it('can be extended with functions to add to the new class', function() {
    var called = false;

    var Klass = CoreObject.extend({
      foo: function() {
        called = true;
      }
    });

    var instance = new Klass();
    instance.foo();

    assert(called);
  });

  it('can be provided a base object to `new`', function() {
    var called = false;

    var Klass = CoreObject.extend({
      foo: function() {
        called = 'klass.foo';
      }
    });

    var instance = new Klass({
      foo: function() {
        called = 'instance.foo';
      }
    });
    instance.foo();

    assert.equal(called, 'instance.foo');
  });


  it('an extended class can be extended can be extended with functions to add to the new class', function() {
    var fooCalled = false;
    var barCalled = false;

    var Klass1 = CoreObject.extend({
      foo: function() {
        fooCalled = true;
      }
    });

    var Klass2 = Klass1.extend({
      bar: function() {
        barCalled = true;
      }
    });

    var instance = new Klass2();
    instance.foo();
    assert(fooCalled);

    instance.bar();
    assert(barCalled);
  });

  describe('_super', function() {
    it('an extended class can call methods on its parents constructor via _super.methodName', function() {
      var fooCalled = false;
      var barCalled = false;

      var Klass1 = CoreObject.extend({
        foo: function() {
          fooCalled = true;
        }
      });

      var Klass2 = Klass1.extend({
        bar: function() {
          barCalled = true;
          this._super.foo();
        }
      });

      var instance = new Klass2();

      instance.bar();
      assert(fooCalled, 'foo called');
      assert(barCalled, 'bar called');
    });

    it('an extended class can call methods on its parent via _super.otherMethodName', function() {
      var parentBarCalled = false;

      var Klass1 = CoreObject.extend({
        bar: function() {
          parentBarCalled = true;
        }
      });

      var Klass2 = Klass1.extend({
        foo: function() {
          this._super.bar();
        }
      });

      var instance = new Klass2();

      instance.foo();
      assert(parentBarCalled, 'parent foo called');
    });

    it('all ancestors methods are available via _super.methodName', function() {
      var fooCalled = false;
      var barCalled = false;
      var bazCalled = false;

      var Klass1 = CoreObject.extend({
        foo: function() {
          fooCalled = true;
        }
      });

      var Klass2 = Klass1.extend({
        bar: function() {
          barCalled = true;
          this._super.foo();
        }
      });

      var Klass3 = Klass2.extend({
        baz: function() {
          bazCalled = true;
          this._super.foo();
        }
      });

      var instance = new Klass3();

      instance.baz();
      assert(fooCalled, 'foo called');
      assert(bazCalled, 'baz called');

      fooCalled = false;
      instance.bar();
      assert(fooCalled, 'foo called');
      assert(barCalled, 'bar called');
    });
  });
});
