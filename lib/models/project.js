'use strict';

// Searches from the cwd upwards for a package.json. If that package.json
// includes ember-cli as devDependency then it returns
// { directory: String, packageJSON: Object } else it returns null.

var RSVP   = require('rsvp');
var path   = require('path');
var findup = RSVP.denodeify(require('findup'));

function ProjectNotFound(message) {
  this.name = 'ProjectNotFound';
  this.message = message;
  this.stack = (new Error()).stack;
}

ProjectNotFound.prototype = new Error();

function Project(root, pkg) {
  this.root = root;
  this.pkg = pkg;
}

module.exports = Project;

Project.prototype.isEmberCLIProject = function() {
  return this.pkg.devDependencies &&
    this.pkg.devDependencies['ember-cli'];
};

Project.isWithinProject = function(path) {
  return this.closest(path || process.cwd())
    .invoke('isEmberCLIProject')
    .catch(function(reason) {
      if (reason instanceof ProjectNotFound) {
        console.log('yo');
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
      throw new ProjectNotFound('No project found at or up from: `' + pathName + '`');
    } else {
      throw reason;
    }
  });
};

function closestPackageJSON(pathName) {
  return findup(pathName, 'package.json').then(function(directory) {
    return RSVP.hash({
      directory: directory,
      pkg: require(path.join(directory, 'package.json'))
    });
  });
}
