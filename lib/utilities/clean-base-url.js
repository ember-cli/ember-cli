'use strict';

module.exports = function(baseURL) {
  if (typeof baseURL !== 'string') { return; }
  // Makes sure it starts and ends with a slash
  if (baseURL[0] !== '/') { baseURL = '/' + baseURL; }
  if (baseURL.length > 1 && baseURL[baseURL.length - 1] !== '/') { baseURL = baseURL + '/'; }
  return baseURL;
};
