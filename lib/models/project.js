'use strict';

var Promise = require('../ext/promise');
var path    = require('path');
var findup  = Promise.denodeify(require('findup'));
var RSVP    = require('rsvp');
var resolve = RSVP.denodeify(require('resolve'));
var fs      = require('fs');
var assign  = require('lodash-node/modern/objects/assign');

var findupSync  = require('findup').sync;

function Project(root, pkg) {
  this.root = root;
  this.pkg  = pkg;
}

Project.prototype.name = function() {
  return this.pkg.name;
};

Project.prototype.isEmberCLIProject = function() {
  return this.pkg.devDependencies && 'ember-cli' in this.pkg.devDependencies;
};

Project.prototype.config = function(env) {
  if (fs.existsSync(path.join(this.root, 'config', 'environment.js'))) {
    return this.require('./config/environment')(env);
  } else {
    return { };
  }
};

Project.prototype.has = function(file) {
  return fs.existsSync(path.join(this.root, file)) || fs.existsSync(path.join(this.root, file + '.js'));
};

Project.prototype.resolve = function(file) {
  return resolve(file, {
    basedir: this.root
  });
};

Project.prototype.require = function(file) {
  if (/^\.\//.test(file)) { // Starts with ./
    return require(path.join(this.root, file));
  } else {
    return require(path.join(this.root, 'node_modules', file));
  }
};

Project.prototype.dependencies = function() {
  return assign({}, this.pkg['devDependencies'], this.pkg['dependencies']);
};

Project.prototype.availableAddons = function() {
  return Object.keys(this.dependencies()).filter(function(name) {
    if (name === 'ember-cli') { return false; }

    var addonPkg = require(path.join(this.root, 'node_modules', name, 'package.json'));

    if ((addonPkg.keywords || []).indexOf('ember-cli-addon') > -1) {
      return true;
    }

  }, this);
};

Project.prototype.initializeAddons = function() {
  this.addons = this.availableAddons().map(function(name) {
    var addonPkg = require(path.join(this.root, 'node_modules', name, 'package.json'));
    var Addon;
    if (addonPkg['ember-addon-main']) {
      Addon = require(path.join(this.root, 'node_modules', name, addonPkg['ember-addon-main']));
    } else {
      Addon = require(path.join(this.root, 'node_modules', name));
    }

    return new Addon(this);
  }, this);
};

Project.closest = function(pathName) {
  return closestPackageJSON(pathName)
    .then(function(result) {
      return new Project(result.directory, result.pkg);
    })
    .catch(function(reason) {
      handleFindupError(pathName, reason);
    });
};

Project.closestSync = function(pathName) {
  try {
    var directory = findupSync(pathName, 'package.json');

    return new Project(directory, require(path.join(directory, 'package.json')));
  } catch(reason) {
    handleFindupError(pathName, reason);
  }
};

var NULL_PROJECT = new Project(undefined, undefined);

NULL_PROJECT.isEmberCLIProject = function() {
  return false;
};

NULL_PROJECT.name = function() {
  return path.basename(process.cwd());
};

Project.NULL_PROJECT = NULL_PROJECT;

function NotFoundError(message) {
  this.name = 'NotFoundError';
  this.message = message;
  this.stack = (new Error()).stack;
}

NotFoundError.constructor = NotFoundError;
NotFoundError.prototype = Object.create(Error.prototype);

Project.NotFoundError = NotFoundError;

function closestPackageJSON(pathName) {
  return findup(pathName, 'package.json')
    .then(function(directory) {
      return Promise.hash({
        directory: directory,
        pkg: require(path.join(directory, 'package.json'))
      });
    });
}

function handleFindupError(pathName, reason) {
  // Would be nice if findup threw error subclasses
  if (reason && /not found/i.test(reason.message)) {
    throw new NotFoundError('No project found at or up from: `' + pathName + '`');
  } else {
    throw reason;
  }
}

// Export
module.exports = Project;
