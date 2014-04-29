'use strict';

// Searches from the cwd upwards for a package.json. If that package.json
// includes ember-cli as devDependency then it returns
// { directory: String, packageJSON: Object } else it returns null.

var Promise = require('../ext/promise');
var path    = require('path');
var findup  = Promise.denodeify(require('findup'));

function ProjectNotFoundError(message) {
  this.name = 'ProjectNotFoundError';
  this.message = message;
  this.stack = (new Error()).stack;
}

ProjectNotFoundError.constructor = ProjectNotFoundError;
ProjectNotFoundError.prototype = new Error();

function Project(root, pkg) {
  this.root = root;
  this.pkg = pkg;
}

module.exports = Project;
module.exports.ProjectNotFoundError = ProjectNotFoundError;

var NULL_PROJECT;

module.exports.NULL_PROJECT = NULL_PROJECT = new Project(undefined, undefined);

NULL_PROJECT.isEmberCLIProject = function() {
  return false;
};

Project.prototype.isEmberCLIProject = function() {
  return this.pkg.devDependencies &&
    this.pkg.devDependencies['ember-cli'];
};

Project.isWithinProject = function(path) {
  return this.closest(path || process.cwd())
    .invoke('isEmberCLIProject')
    .catch(function(reason) {
      if (reason instanceof ProjectNotFoundError) {
        return false;
      } else {
        throw reason;
      }
    });
};

Project.closest = function(pathName) {
  return closestPackageJSON(pathName).then(function(result) {
    return new Project(result.directory, result.pkg);
  }).catch(function(reason) {
    // would be nice if findup threw error subclasses
    if (reason && /not found/i.test(reason.message)) {
      throw new ProjectNotFoundError('No project found at or up from: `' + pathName + '`');
    } else {
      throw reason;
    }
  });
};

function closestPackageJSON(pathName) {
  return findup(pathName, 'package.json').then(function(directory) {
    return Promise.hash({
      directory: directory,
      pkg: require(path.join(directory, 'package.json'))
    });
  });
}
