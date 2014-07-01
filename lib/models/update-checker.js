'use strict';

var Promise         = require('../ext/promise');
var emberCLIVersion = require('../utilities/ember-cli-version');
var chalk           = require('chalk');
var semver          = require('semver');

module.exports = UpdateChecker;

function UpdateChecker(ui, settings, localVersion) {
  this.ui = ui;
  this.settings = settings;
  this.localVersion = localVersion || emberCLIVersion();
}

/**
* Checks local config or npm for most recent version of ember-cli
* @param {UI} ui
* @param {Object} environment
*/

UpdateChecker.prototype.checkForUpdates = function() {
  // if 'checkForUpdates' is true, check for an updated ember-cli version
  // if environment.settings is undefined, that means there
  // is no .ember-cli file, so check by default
  if (this.settings.checkForUpdates) {
    return this.doCheck().then(function(updateInfo) {
      if (updateInfo.updateNeeded) {
        this.ui.write('\nA new version of ember-cli is available (' +
                      updateInfo.newestVersion + '). To install it, type ' +
                      chalk.green('ember update') + '.\n');
      }
      return updateInfo;
    }.bind(this));
  } else {
    return Promise.resolve({
      updateNeeded: false
    });
  }
};

UpdateChecker.prototype.doCheck = function() {
  var settings = this.settings;
  var lastVersionCheckedAt = settings.lastVersionCheckedAt;

  var now = new Date().getTime();
  var version = null;

  return new Promise(function(resolve, reject) {
    // if the last check was less than a day ago, don't remotely check version
    if (lastVersionCheckedAt && lastVersionCheckedAt > (now - 86400000)) {
      version = settings.newestVersion;
      resolve(version);
    }

    // make an http call to npm to get the latest version
    var http = require('http');
    var concat = require('concat-stream');

    http.get('http://registry.npmjs.org/ember-cli/latest', function(res) {
      res.setEncoding('utf8');

      res.pipe(concat(function (data) {
        try {
          resolve(JSON.parse(data).version);
        } catch(error) {
          reject(error);
        }
      }));

      res.on('error', reject);
    });
  }).then(function(version) {
    // save version so we don't have to check again for another day
    saveVersionInformation(version);

    return {
      updateNeeded: version && semver.lt(this.localVersion, version),
      newestVersion: version
    };
  }.bind(this))
  .catch(function(error) {
    this.ui.write('There was an error checking NPM for an update: ' + error + '\n');
    throw error;
  }.bind(this));
};

/**
* Saves updated version information to .ember-cli file
* @param {String} version
*/
function saveVersionInformation(version) {
  var Yam    = require('yam');
  var config = new Yam('ember-cli');
  var now    = new Date().getTime();

  config.set('newestVersion', version);
  config.set('lastVersionCheckedAt', now);
  config.flush();
}
