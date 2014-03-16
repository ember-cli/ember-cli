'use strict';

module.exports = function stub(obj, name) {
  obj[name] = function() {
    obj[name].called++;
    obj[name].calledWith.push(arguments);
  };

  obj[name].called = 0;
  obj[name].calledWith = [];

  return obj[name];
};
