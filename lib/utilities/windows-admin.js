'use strict';

var Promise = require('../ext/promise');
var chalk = require('chalk');

module.exports = WindowsSymlinkChecker;

/**
 *
 * On windows users will have a much better experience if symlinks are enabled
 * an usable. This object when queried informs windows users, if they can
 * improve there build performance, and how.
 *
 *  > Windows vista: nothing we can really do, so we fall back to junctions for folders + copying of files
 *  <= Windows vista: symlinks are available but using them is somewhat tricky
 *    * if the users is an admin, the process needed to have been started with elevated privs
 *    * if the user is not an admin, a specific setting needs to be enabled
 *  <= Windows 10 Insiders build 14972
 *    * if developer mode is enabled, symlinks "just work"
 *    * https://blogs.windows.com/buildingapps/2016/12/02/symlinks-windows-10
 *
 * ```js
 * let checker = WindowsSymlinkChecker;
 * let {
 *   windows,
 *   elevated
 * } = await = checker.checkIfSymlinksNeedToBeEnabled(); // aslso emits helpful warnings
 * ```
 *
 * @public
 * @class WindowsSymlinkChecker
 */
function WindowsSymlinkChecker(ui, isWindows, canSymlink, exec) {
  this.ui = ui;
  this.isWindows = isWindows;
  this.canSymlink = canSymlink;
  this.exec = exec;
}

/**
 *
 * if not windows, will fulfill with:
 *  `{ windows: false, elevated: null)`
 *
 * if windows, and elevated will fulfill with:
 *  `{ windows: false, elevated: true)`
 *
 * if windows, and is NOT elevated will fulfill with:
 *  `{ windows: false, elevated: false)`
 *
 *  will include heplful warning, so that users know (if possible) how to
 *  achieve better windows build performance
 *
 * @public
 * @method checkIfSymlinksNeedToBeEnabled
 * @return {Promise<Object>} Object describing whether we're on windows and if admin rights exist
 */
WindowsSymlinkChecker.checkIfSymlinksNeedToBeEnabled = function(ui) {
  return this._setup(ui).checkIfSymlinksNeedToBeEnabled();
};

/**
 * sets up a WindowsSymlinkChecker
 *
 * providing it with defaults for:
 *
 * * if we are on windows
 * * if we can symlink
 * * a reference to exec
 *
 * @private
 * @method _setup
 * @param UI {UI}
 * @return {WindowsSymlinkChecker}
 */
WindowsSymlinkChecker._setup = function(ui) {
  var exec = require('child_process').exec;
  var symlinkOrCopy = require('symlink-or-copy');

  return new WindowsSymlinkChecker(ui, (/^win/).test(process.platform), symlinkOrCopy.canSymlink, exec);
};

/**
 * @public
 * @method checkIfSymlinksNeedToBeEnabled
 * @return {Promise<Object>} Object describing whether we're on windows and if admin rights exist
 */
WindowsSymlinkChecker.prototype.checkIfSymlinksNeedToBeEnabled = function() {
  return new Promise(function(resolve) {
    if (!this.isWindows) {
      resolve({
        windows: false,
        elevated: null,
      });
    } else if (this.canSymlink) {
      resolve({
        windows: true,
        elevated: null,
      });
    } else {
      resolve(this._checkForElevatedRights(this.ui));
    }
  }.bind(this));
};

/**
 *
 * Uses the eon-old command NET SESSION to determine whether or not the
 * current user has elevated rights (think sudo, but Windows).
 *
 * @private
 * @method _checkForElevatedRights
 * @param  {Object} ui - ui object used to call writeLine();
 * @return {Object} Object describing whether we're on windows and if admin rights exist
 */
WindowsSymlinkChecker.prototype._checkForElevatedRights = function() {
  var ui = this.ui;
  var exec = this.exec;

  return new Promise(function(resolve) {
    exec('NET SESSION', function(error, stdout, stderr) {
      var elevated = (!stderr || stderr.length === 0);

      if (!elevated) {
        ui.writeLine(chalk.yellow('\nRunning without permission to symlink will degrade build peformance.'));
        ui.writeLine('See http://ember-cli.com/user-guide/#windows for details.\n');
      }

      resolve({
        windows: true,
        elevated,
      });
    });
  });
};
