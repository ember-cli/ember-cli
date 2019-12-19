'use strict';

const INVALID_PROJECT_NAMES = ['test', 'ember', 'ember-cli', 'vendor', 'public', 'app', 'addon', 'application'];

/**
 * Checks if the string starts with a number.
 *
 * @method startsWithNumber
 * @return {Boolean}
 */
function startsWithNumber(name) {
  return /^\d.*$/.test(name);
}

function containsInvalidSlash(name) {
  let indexOfFirstSlash = name.indexOf('/');
  let isScoped = name[0] === '@' && indexOfFirstSlash !== -1;

  let containsInvalidSlash = isScoped ? name.indexOf('/', indexOfFirstSlash + 1) > -1 : name.includes('/');

  return containsInvalidSlash;
}

/**
 * Checks if project name is valid.
 *
 * Invalid names are some of the internal constants that Ember CLI uses, such as
 * `app`, `ember`, `ember-cli`, `test`, and `vendor`. Names that start with
 * numbers are considered invalid as well.
 *
 * @method validProjectName
 * @param {String} name The name of Ember CLI project
 * @return {Boolean}
 */
module.exports = function isValidProjectName(projectName) {
  let lowerSanitizedName = projectName.toLowerCase();

  if (
    INVALID_PROJECT_NAMES.includes(lowerSanitizedName) ||
    lowerSanitizedName.includes('.') ||
    containsInvalidSlash(lowerSanitizedName) ||
    startsWithNumber(lowerSanitizedName)
  ) {
    return false;
  }

  return true;
};
