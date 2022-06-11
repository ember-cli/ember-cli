'use strict';

const cleanBaseUrl = require('clean-base-url');

module.exports = function isLiveReloadRequest(url, liveReloadPrefix) {
  return url === `${cleanBaseUrl(liveReloadPrefix)}livereload`;
};
