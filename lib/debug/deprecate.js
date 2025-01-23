'use strict';

const chalk = require('chalk');
const semver = require('semver');
const assert = require('./assert');
const emberCLIVersion = require('../../package').version;

/**
 * Display a deprecation message.
 *
 * ```js
 * const { deprecate } = require('ember-cli/lib/debug');
 *
 * deprecate('The `foo` method is deprecated.', false, {
 *   for: 'ember-cli',
 *   id: 'ember-cli.foo-method',
 *   since: {
 *     available: '4.1.0',
 *     enabled: '4.2.0',
 *   },
 *   until: '5.0.0',
 *   url: 'https://example.com',
 * });
 * ```
 *
 * @method deprecate
 * @param {String} description Describes the deprecation.
 * @param {Any} condition If falsy, the deprecation message will be displayed.
 * @param {Object} options An object including the deprecation's details:
 * - `for` The library that the deprecation is for
 * - `id` The deprecation's unique id
 * - `since.available` A SemVer version indicating when the deprecation was made available
 * - `since.enabled` A SemVer version indicating when the deprecation was enabled
 * - `until` A SemVer version indicating until when the deprecation will be active
 * - `url` A URL that refers to additional information about the deprecation
 */
function deprecate(description, condition, options) {
  assert('When calling `deprecate`, you must provide a description as the first argument.', description);
  assert('When calling `deprecate`, you must provide a condition as the second argument.', arguments.length > 1);

  assert(
    'When calling `deprecate`, you must provide an options object as the third argument. The options object must include the `for`, `id`, `since` and `until` options (`url` is optional).',
    options
  );

  assert('When calling `deprecate`, you must provide the `for` option.', options.for);
  assert('When calling `deprecate`, you must provide the `id` option.', options.id);

  assert(
    'When calling `deprecate`, you must provide the `since` option. `since` must include the `available` and/or the `enabled` option.',
    options.since
  );

  assert(
    'When calling `deprecate`, you must provide the `since.available` and/or the `since.enabled` option.',
    options.since.available || options.since.enabled
  );

  assert(
    '`since.available` must be a valid SemVer version.',
    !options.since.available || isSemVer(options.since.available)
  );

  assert('`since.enabled` must be a valid SemVer version.', !options.since.enabled || isSemVer(options.since.enabled));

  assert(
    'When calling `deprecate`, you must provide a valid SemVer version for the `until` option.',
    isSemVer(options.until)
  );

  if (condition) {
    return;
  }

  if (options.for === 'ember-cli' && isDeprecationRemoved(options.until)) {
    throw new Error(
      `The API deprecated by ${options.id} was removed in ember-cli ${options.until}. The message was: ${description}. Please see ${options.url} for more details.`
    );
  }

  let message = formatMessage(description, options);

  warn(`${message}\n\n${getStackTrace()}`);
}

function isSemVer(version) {
  return semver.valid(version) !== null;
}

function formatMessage(description, options) {
  let message = [
    chalk.inverse(' DEPRECATION '),
    '\n\n',
    description,
    '\n\n',
    `ID     ${options.id}`,
    '\n',
    `UNTIL  ${options.until}`,
  ];

  if (options.url) {
    message.push('\n', `URL    ${options.url}`);
  }

  return message.join('');
}

function getStackTrace() {
  let error = new Error();
  let lines = error.stack.split('\n');

  lines.shift(); // Remove the word `Error`.

  return lines.map((line) => line.trim()).join('\n');
}

function warn(message) {
  console.warn(chalk.yellow(message));
}

function isDeprecationRemoved(until) {
  const currentEmberCLIVersion = parseFloat(process.env.OVERRIDE_DEPRECATION_VERSION ?? emberCLIVersion);

  let significantUntil = until.replace(/(\.0+)/g, '');
  return currentEmberCLIVersion >= parseFloat(significantUntil);
}

module.exports = deprecate;
module.exports._isDeprecationRemoved = isDeprecationRemoved;
