'use strict';

module.exports = function dependencyExists(subject, packageName, versionChecker) {
  let depInstance = subject.findAddonByName && subject.findAddonByName(packageName);
  if (!depInstance) {
    return false;
  }

  let version = depInstance.pkg.version;

  if (depInstance && versionChecker(version)) {
    return true;
  }

  return subject.addons.some(dependencyExists);
};
