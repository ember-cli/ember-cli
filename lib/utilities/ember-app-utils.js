'use strict';

const cleanBaseURL = require('clean-base-url');

/**
 * Returns a normalized url given a string.
 * Returns an empty string if `null`, `undefined` or an empty string are passed
 * in.
 *
 * @method normalizeUrl
 * @param {String} Raw url.
 * @return {String} Normalized url.
*/
function normalizeUrl(rootURL) {
  if (rootURL === undefined || rootURL === null || rootURL === '') {
    return '';
  }

  return cleanBaseURL(rootURL);
}

/**
 * Converts Javascript Object to a string.
 * Returns an empty object string representation if a "falsy" value is passed
 * in.
 *
 * @method convertObjectToString
 * @param {Object} Any Javascript Object.
 * @return {String} A string representation of a Javascript Object.
*/
function convertObjectToString(env) {
  return JSON.stringify(env || {});
}

/**
 * Returns the <base> tag for index.html.
 *
 * @method calculateBaseTag
 * @param {String} baseURL
 * @param {String} locationType 'history', 'none' or 'hash'.
 * @return {String} Base tag or an empty string
*/
function calculateBaseTag(baseURL, locationType) {
  let normalizedBaseUrl = cleanBaseURL(baseURL);

  if (locationType === 'hash') {
    return '';
  }

  return normalizedBaseUrl ? `<base href="${normalizedBaseUrl}" />` : '';
}

module.exports = { normalizeUrl, convertObjectToString, calculateBaseTag };
