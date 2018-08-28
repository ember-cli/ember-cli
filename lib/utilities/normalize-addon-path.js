'use strict';

const path = require('path');

module.exports = function normalizeAddonPath(addonPath) {
  let normalizedPath = path.normalize(addonPath);

  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.replace(/^\/+/, '');
  }

  return normalizedPath;
};
