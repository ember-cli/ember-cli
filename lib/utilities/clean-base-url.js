'use strict';

module.exports = function cleanBaseURL(baseURL) {
  if (typeof baseURL !== 'string') {
    return;
  }

  if (baseURL[baseURL.length - 1] !== '/') {
    baseURL = baseURL + '/';
  }

  // Check if this is a full URL with a protocol
  let hasProtocol = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(baseURL);

  if (hasProtocol) {
    return baseURL;
  }

  // For path-only URLs, ensure leading slash
  if (baseURL[0] !== '/') {
    baseURL = '/' + baseURL;
  }

  return baseURL;
};
