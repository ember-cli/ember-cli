'use strict';

module.exports = {
  stub: function stub(obj, name, value) {
    var original = obj[name];

    obj[name] = function() {
      obj[name].called++;
      obj[name].calledWith.push(arguments);
      return value;
    };

    obj[name].restore = function() {
      obj[name] = original;
    };

    obj[name].called = 0;
    obj[name].calledWith = [];
    return obj[name];
  },
  stubPath: function stubPath(path) {
    return {
      basename: function() {
        return path;
      }
    };
  },
  stubBlueprint: function stubBlueprint() {
    return function Blueprint() {
      return {
        install: function() { }
      };
    };
  }
};
