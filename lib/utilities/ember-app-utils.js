'use strict';

const fs = require('fs');
const path = require('path');
const cleanBaseURL = require('clean-base-url');
const { deprecate, DEPRECATIONS } = require('../debug');

/**
 * Returns a normalized url given a string.
 * Returns an empty string if `null`, `undefined` or an empty string are passed
 * in.
 *
 * @function normalizeUrl
 * @param {String} Raw url.
 * @returns {String} Normalized url.
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
 * @function convertObjectToString
 * @param {Object} Any Javascript Object.
 * @returns {String} A string representation of a Javascript Object.
 */
function convertObjectToString(env) {
  return JSON.stringify(env || {});
}

/**
 * Returns the content for a specific type (section) for index.html.
 *
 * ```
 * {{content-for "[type]"}}
 * ```
 *
 * Supported types:
 *
 * - 'head'
 * - 'config-module'
 * - 'head-footer'
 * - 'test-header-footer'
 * - 'body-footer'
 * - 'test-body-footer'
 *
 * @function contentFor
 * @param {Object} config Ember.js application configuration
 * @param {RegExp} match Regular expression to match against
 * @param {String} type Type of content
 * @param {Object} options Settings that control the default content
 * @param {Boolean} options.autoRun Controls whether to bootstrap the
                    application or not
 * @param {Boolean} options.storeConfigInMeta Controls whether to include the
                    contents of config
 * @returns {String} The content.
*/
function contentFor(config, match, type, options) {
  let content = [];

  // This normalizes `rootURL` to the value which we use everywhere inside of Ember CLI.
  // This makes sure that the user doesn't have to account for it in application code.
  if ('rootURL' in config) {
    config.rootURL = normalizeUrl(config.rootURL);
  }

  switch (type) {
    case 'head':
      if (options.storeConfigInMeta) {
        content.push(
          `<meta name="${config.modulePrefix}/config/environment" content="${encodeURIComponent(
            JSON.stringify(config)
          )}" />`
        );
      }

      break;
    case 'config-module':
      if (options.storeConfigInMeta) {
        content.push(`var prefix = '${config.modulePrefix}';`);
        content.push(fs.readFileSync(path.join(__dirname, '../broccoli/app-config-from-meta.js')));
      } else {
        content.push(`
          var exports = {
            'default': ${JSON.stringify(config)}
          };
          Object.defineProperty(exports, '__esModule', {value: true});
          return exports;
        `);
      }

      break;
    case 'app-boot':
      if (options.autoRun) {
        let moduleToRequire = `${config.modulePrefix}/app`;
        content.push(`
          if (!runningTests) {
            require("${moduleToRequire}")["default"].create(${convertObjectToString(config.APP)});
          }
        `);
      }

      break;
    case 'test-body-footer':
      content.push(
        `<script>
document.addEventListener('DOMContentLoaded', function() {
  if (!EmberENV.TESTS_FILE_LOADED) {
    throw new Error('The tests file was not loaded. Make sure your tests index.html includes "assets/tests.js".');
  }
});
</script>`
      );

      break;
  }

  content = options.addons.reduce((content, addon) => {
    let addonContent = addon.contentFor ? addon.contentFor(type, config, content) : null;
    if (addonContent) {
      for (const deprecatedType of DEPRECATIONS.V1_ADDON_CONTENT_FOR_TYPES.options.meta.types) {
        deprecate(
          `Addon \`${addon.name}\` is using the deprecated \`${deprecatedType}\` type in its \`contentFor\` method. Please see the deprecation guide for the correct path forward.`,
          type !== deprecatedType,
          DEPRECATIONS.V1_ADDON_CONTENT_FOR_TYPES.options
        );
      }

      return content.concat(addonContent);
    }

    return content;
  }, content);

  return content.join('\n');
}

/*
 * Return a list of pairs: a pattern to match to a replacement function.
 *
 * Used to replace various tags in `index.html` and `tests/index.html`.
 *
 * @param {Object} options
 * @param {Array} options.addons A list of project's add-ons
 * @param {Boolean} options.autoRun Controls whether to bootstrap the
                    application or not
 * @param {Boolean} options.storeConfigInMeta Controls whether to include the
                    contents of config
   @returns {Array} An array of patterns to match against and replace
*/
function configReplacePatterns(options) {
  return [
    {
      match: /{{\s?rootURL\s?}}/g,
      replacement(config) {
        return normalizeUrl(config.rootURL);
      },
    },
    {
      match: /{{\s?EMBER_ENV\s?}}/g,
      replacement(config) {
        return convertObjectToString(config.EmberENV);
      },
    },
    {
      match: /{{content-for ['"](.+?)["']}}/g,
      replacement(config, match, type) {
        return contentFor(config, match, type, options);
      },
    },
    {
      match: /{{\s?MODULE_PREFIX\s?}}/g,
      replacement(config) {
        return config.modulePrefix;
      },
    },
  ];
}

module.exports = { normalizeUrl, convertObjectToString, contentFor, configReplacePatterns };
