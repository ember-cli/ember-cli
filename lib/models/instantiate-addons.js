'use strict';

/**
@module ember-cli
*/

const DAGMap = require('dag-map').default;
const logger = require('heimdalljs-logger')('ember-cli:addons-factory');
const heimdall = require('heimdalljs');
const SilentError = require('silent-error');

/**
 * Create instances of a set of "child" addons for a parent addon or project.
 *
 * @method instantiateAddons
 * @param {Object} parent an Addon or Project that is the direct containing object of the list
 *   of children defined in addonPackages.
 * @param {Project} project the project that contains the parent (so either the addon's project
 *   if parent is an addon, or the project itself if it is a project). It is possible when
 *   constructing custom addon instances that the project will actually be undefined--various
 *   addon tests do this, for example.
 * @param {Object} a map of addon name (including scope) to an AddonInfo with the name, path and
 *   'pkg' object for that addon's package.json). These are what is turned into addons.
 */
function instantiateAddons(parent, project, addonPackages) {
  // depending on whether this is really a project or an addon, the 'name' property may be a getter.
  let parentName = typeof parent.name === 'function' ? parent.name() : parent.name;

  logger.info('instantiateAddons for: ', parentName);

  let addonNames = Object.keys(addonPackages || {});

  if (addonNames.length === 0) {
    logger.info('    no addons');
    return [];
  } else {
    logger.info('    addon names are:', addonNames);
  }

  let initializeAddonsToken = heimdall.start(`${parentName}: initializeAddons`);
  let graph = new DAGMap();
  let addonInfo, emberAddonConfig;

  addonNames.forEach((name) => {
    addonInfo = addonPackages[name];
    emberAddonConfig = addonInfo.pkg['ember-addon'];

    graph.add(name, addonInfo, emberAddonConfig.before, emberAddonConfig.after);
  });

  let addons = [];
  let timings = new Map();

  graph.each((key, value) => {
    let addonInfo = value;
    if (addonInfo) {
      let initializeAddonToken = heimdall.start({
        name: `initialize ${addonInfo.name}`,
        addonName: addonInfo.name,
        addonInitializationNode: true,
      });

      let start = Date.now();

      let pkgInfo = parent.packageInfoCache.getEntry(addonInfo.path);

      if (!pkgInfo || !pkgInfo.valid) {
        throw new SilentError(
          `The \`${addonInfo.pkg.name}\` addon could not be found at \`${addonInfo.path}\` or was otherwise invalid.`
        );
      }

      // get an instance of the addon. If that fails it will throw.
      let addon = pkgInfo.getAddonInstance(parent, project);

      timings.set(addon, Date.now() - start);

      initializeAddonToken.stop();

      addons.push(addon);
    }
  });

  logger.info(
    ' addon info %o',
    addons.map((addon) => ({
      name: addon.name,
      initializeTotalMillis: timings.get(addon),
    }))
  );

  initializeAddonsToken.stop();

  return addons;
}

module.exports = instantiateAddons;
