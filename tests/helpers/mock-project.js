'use strict';

var Project = require('../../lib/models/project');

function MockProject() {
  Project.apply(this, arguments);
}

MockProject.prototype.require = function(file) {
  if (file === './config/environment') {
    return function() {
      return function() {
        return { baseURL: '/' };
      };
    };
  } else if (file === './server') {
    return function() {
      return {
        listen: function() { arguments[arguments.length-1](); }
      };
    };
  }
};

MockProject.prototype.has = function(key) {
  return (/server/.test(key));
};

MockProject.prototype.name = function() {
  return 'mock-project';
};

MockProject.prototype.initializeAddons = function() {
  this.addons = [];
};

module.exports = MockProject;
