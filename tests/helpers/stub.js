'use strict';

var MockUI        = require('./mock-ui');
var MockAnalytics = require('./mock-analytics');
var ui            = new MockUI();
var analytics     = new MockAnalytics();

module.exports = {
  stubCommandOptions: function stubCommandOptions(tasks) {
    return {
      ui:        ui,
      analytics: analytics,
      tasks:     tasks || {},
      project:   {
        isEmberCLIProject: function isEmberCLIProject() {
          return true;
        }
      }
    };
  },
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
