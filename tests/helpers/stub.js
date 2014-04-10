'use strict';

var extend = require('lodash-node/compat/objects/assign');

module.exports = {
  ember: function() {
  },
  commands: {},
  restoreCommands: function() {
    for(var key in this.commands) {
      if (!this.commands.hasOwnProperty(key)) { continue; }
      this.commands[key].run.restore();
    }
  },
  clearCommands: function() {
    this.commands = {};
  },
  stub: function stub(obj, name) {
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
  },
  stubCommand: function(name) {
    var mod;
    try {
      // deep clone
      mod = extend({}, require('../../lib/commands/' + name));
    } catch(exception) {
      // swallow the exception
    }
    this.commands[name] = mod || {};
    return this.stub(this.commands[name], 'run');
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
