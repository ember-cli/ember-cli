'use strict';

module.exports = function stub(obj, name) {
  var original = obj[name];

  obj[name] = function() {
    obj[name].called++;
    obj[name].calledWith.push(arguments);
  };

  obj[name].restore = function() {
    obj[name] = original;
  };

  obj[name].called = 0;
  obj[name].calledWith = [];

  return obj[name];
};
