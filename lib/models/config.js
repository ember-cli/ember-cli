'use strict';

var isObject      = require('lodash-node/modern/objects/isObject');
var isUndefined   = require('lodash-node/modern/objects/isUndefined');
var defaults      = require('lodash-node/modern/objects/defaults');
var merge         = require('lodash-node/modern/objects/merge');


function Config() {
  this.options = Object.create(null);
  this.groupOptions = Object.create(null);
}

// getter
Config.prototype.get = function(group, key) {
  var argc = arguments.length;
  var options = this.options;

  if (argc === 1) {
    // group getter
    return this.options[group] || false;
  } else if (argc === 2) {
    if (options[group] !== undefined && options[group][key] !== undefined) {
      return options[group][key];
    } else {
      return this.get(group);
    }
  }
};

// setter
Config.prototype.set = function(group) {
  var len = arguments.length;
  if(len >= 2 && !isObject(arguments[1])) {
    this.groupOptions[arguments[0]] = arguments[1];
  }

  var newOptions;
  if (isObject(arguments[1])) {
    newOptions = arguments[1];
  } else if (isObject(arguments[2])) {
    this.set(group, arguments[1]);
    newOptions = arguments[2];
  }

  this.options[group] = merge(newOptions, this.options[group], defaults);
};

Config.prototype.isEnabled = function() {
  return !!this.get.apply(this, arguments);
};

Config.prototype.push = function (group, key, option) {
  if(isUndefined(this.options[group]) || isUndefined(this.options[group][key])) {
    this.options[group] = this.options[group] || {};
    this.options[group][key] = [];
  }

  this.options[group][key].push(option);
};


module.exports = Config;
