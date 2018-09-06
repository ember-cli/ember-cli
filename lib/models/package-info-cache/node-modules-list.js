'use strict';

const ErrorList = require('./error-list');

/**
 * Class that stores information about a node_modules directory (i.e., the
 * packages and subdirectories in the directory). It is one of the
 * two types of entries in a PackageInfoCache. It is only created by the
 * PackageInfoCache.
 *
 * @public
 * @class NodeModulesList
 */
class NodeModulesList {
  constructor(realPath, cache) {
    this.realPath = realPath;
    this.cache = cache;
    this.entries = Object.create(null);
    this.errors = new ErrorList();
  }

  /**
   * Given error data, add an ErrorEntry to the ErrorList for this object.
   *
   * @protected
   * @method addError
   * @param {String} errorType one of the Errors.ERROR_* constants.
   * @param {Object} errorData any error data relevant to the type of error
   * being created. See showErrors().
   */
  addError(errorType, errorData) {
    this.errors.addError(errorType, errorData);
  }

  /**
   * Indicate if there are any errors in the NodeModulesList itself (not
   * including errors within the individual entries).
   *
   * @public
   * @method hasErrors
   */
  hasErrors() {
    return this.errors.hasErrors();
  }

  /**
   * Add an entry (PackageInfo or NodeModulesList instance) to the entries
   * for this list. This is only called by PackageInfoCache. It is not intended
   * to be called directly by anything else.
   *
   * @protected
   * @method addEntry
   * @param {String} entryName the name of the entry, i.e., the name of the
   * file or subdirectory in the directory listing.
   * @param {Object} entryVal the PackageInfo or NodeModulesList tha corresponds
   * to the given entry name in the file system.
   */
  addEntry(entryName, entryVal) {
    this.entries[entryName] = entryVal;
  }

  /**
   * Return a PackageInfo object for a given package name (which may include
   * a scope)
   *
   * @public
   * @method findPackage
   * @param {String} packageName the name (possibly including a scope) of
   *    the PackageInfo the caller wants returned.
   * @return the desired PackageInfo if one exists for the given name, else null.
   */
  findPackage(packageName) {
    let val;

    if (packageName.startsWith('@')) {
      let parts = packageName.split('/');
      let entry = this.entries[parts[0]]; // scope
      val =
        entry instanceof NodeModulesList
          ? entry.findPackage(parts[1]) // the real name
          : null;
    } else {
      val = this.entries[packageName];
    }

    return val;
  }
}

module.exports = NodeModulesList;
