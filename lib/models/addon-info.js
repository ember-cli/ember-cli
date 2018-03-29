'use strict';

/**
 * @module addon-info
 *
 * A simple class to store metadata info about an addon. This used to be created
 * directly as an object in addon-discovery, but it then become confusing when
 * 'addon' was used as the name of a parameter in functions that took this object.
 * This is just for clarity. Later there may be more info added to it.
 */

class AddonInfo {
  constructor(name, path, pkg) {
    this.name = name;
    this.path = path;
    this.pkg = pkg;
  }
}

module.exports = AddonInfo;
