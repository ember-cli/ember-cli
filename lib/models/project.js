'use strict';

var Promise = require('../ext/promise');
var path    = require('path');
var findup  = Promise.denodeify(require('findup'));

function Project(root, pkg) {
  this.root = root;
  this.pkg  = pkg;
}

Project.prototype.name = function() {
  return this.pkg.name;
};

Project.prototype.isEmberCLIProject = function() {
  return this.pkg.devDependencies && this.pkg.devDependencies['ember-cli'];
};

Project.prototype.require = function(file) {
  if (/^\.\//.test(file)) { // Starts with ./
    return require(path.join(this.root, file));
  } else {
    return require(path.join(this.root, 'node_modules', file));
  }
};

Project.closest = function(pathName) {
  return closestPackageJSON(pathName)
    .then(function(result) {
      return new Project(result.directory, result.pkg);
    })
    .catch(function(reason) {
      // Would be nice if findup threw error subclasses
      if (reason && /not found/i.test(reason.message)) {
        throw new NotFoundError('No project found at or up from: `' + pathName + '`');
      } else {
        throw reason;
      }
    });
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

// Export
module.exports = Project;
