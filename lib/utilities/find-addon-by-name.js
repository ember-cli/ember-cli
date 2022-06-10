'use strict';

let HAS_FOUND_ADDON_BY_NAME = Object.create(null);

/*
  Finds an addon given a specific name.

  The `name` value in an addon's `package.json` file takes priority over the
  `name` value in an addon's `index.js` file.
*/
module.exports = function findAddonByName(addons, name) {
  let exactMatchFromPkg = addons.find((addon) => addon.pkg && addon.pkg.name === name);

  if (exactMatchFromPkg) {
    return exactMatchFromPkg;
  }

  let exactMatchFromIndex = addons.find((addon) => addon.name === name);
  if (exactMatchFromIndex) {
    let pkg = exactMatchFromIndex.pkg;

    if (HAS_FOUND_ADDON_BY_NAME[name] !== true) {
      HAS_FOUND_ADDON_BY_NAME[name] = true;
      console.warn(
        `The addon at \`${exactMatchFromIndex.root}\` has different values in its addon index.js ('${
          exactMatchFromIndex.name
        }') and its package.json ('${pkg && pkg.name}').`
      );
    }

    return exactMatchFromIndex;
  }

  return null;
};

module.exports._clearCaches = function () {
  HAS_FOUND_ADDON_BY_NAME = Object.create(null);
};
