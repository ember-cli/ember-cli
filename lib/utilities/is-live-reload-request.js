'use strict';

const cleanBaseUrl = require('../utilities/clean-base-url');

module.exports = function isLiveReloadRequest(url, liveReloadPrefix) {
  return url === `${cleanBaseUrl(liveReloadPrefix)}livereload`;
};
