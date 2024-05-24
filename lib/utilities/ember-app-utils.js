'use strict';

const fs = require('fs');
const path = require('path');
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
 * @method contentFor
 * @param {Object} config Ember.js application configuration
 * @param {RegExp} match Regular expression to match against
 * @param {String} type Type of content
 * @param {Object} options Settings that control the default content
 * @param {Boolean} options.autoRun Controls whether to bootstrap the
                    application or not
 * @param {Boolean} options.storeConfigInMeta Controls whether to include the
                    contents of config
 * @return {String} The content.
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
      if (options.strictESModules && options.storeConfigInMeta) {
        content.push(`
          let config = {};
          try {
            let metaName = '${config.modulePrefix}/config/environment';
            let rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
            config = JSON.parse(decodeURIComponent(rawConfig));
          }
          catch(err) {
            throw new Error('Could not read config from meta tag with name "' + metaName + '".');
          }
          export default config;
        `);
      } else if (options.strictESModules && !options.storeConfigInMeta) {
        content.push(`
          export default ${JSON.stringify(config)}
        `);
      } else if (options.storeConfigInMeta) {
        content.push(`define('${config.modulePrefix}/config/environment', [], function() {`);
        content.push(`var prefix = '${config.modulePrefix}';`);
        content.push(fs.readFileSync(path.join(__dirname, '../broccoli/app-config-from-meta.js')));
        content.push(`});`);
      } else {
        content.push(`define('${config.modulePrefix}/config/environment', [], function() {`);
        content.push(`
        var exports = {
            'default': ${JSON.stringify(config)}
          };
          Object.defineProperty(exports, '__esModule', {value: true});
          return exports;
        `);
        content.push(`});`);
      }

      break;
    case 'app-boot':
      if (options.autoRun) {
        if (options.strictESModules) {
          content.push(`(async () => {
  const { default: App } = await PRIVATE_SYSTEM_HERE.import('ember-test-app/app');
  const { default: ENV } = await PRIVATE_SYSTEM_HERE.import('ember-test-app/config/environment');
  App.create(ENV.APP)
})();
`);
        } else {
          let moduleToRequire = `${config.modulePrefix}/app`;
          content.push(`
          if (!runningTests) {
            require("${moduleToRequire}")["default"].create(${convertObjectToString(config.APP)});
          }
        `);
        }
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
      if (options.strictESModules && type === 'config-module') {
        throw new Error(`Addons may not customize contentFor config-module when using strict-es-modules`);
      }
      if (options.strictESModules && type === 'app-boot') {
        throw new Error(`Addons may not customize contentFor app-boot when using strict-es-modules`);
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
   @return {Array} An array of patterns to match against and replace
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
