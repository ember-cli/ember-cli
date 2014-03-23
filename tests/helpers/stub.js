'use strict';

var noop = function() { };

module.exports = function stub(obj, name) {
  var original = obj[name];

  obj[name] = function() {
    obj[name].called++;
    obj[name].calledWith.push(arguments);

    if(obj[name].isPromise) {
      var promise = {};

      promise['then'] = noop;
      promise['catch'] = noop;
      promise['finally'] = noop;
      return promise;
    }
  };

  obj[name].restore = function() {
    obj[name] = original;
  };

  obj[name].asPromise = function() {
    obj[name].isPromise = true;
    return obj[name];
  };

  obj[name].called = 0;
  obj[name].calledWith = [];
  obj[name].isPromise = false;

  return obj[name];
};
