'use strict';

/**
@module ember-cli
*/

const DAGMap = require('dag-map').default;
const logger = require('heimdalljs-logger')('ember-cli:addons-factory');
const heimdall = require('heimdalljs');

/**
  AddonsFactory is responsible for instantiating a collection of addons, in the right order.

  @class AddonsFactory
  @extends CoreObject
  @constructor
*/
class AddonsFactory {
  constructor(addonParent, project) {
    this.addonParent = addonParent;
    this.project = project;
  }

  initializeAddons(addonPackages) {
    let addonParent = this.addonParent;
    let project = this.project;
    let addonParentName = typeof addonParent.name === 'function' ? addonParent.name() : addonParent.name;

    let initializeAddonsToken = heimdall.start(`${addonParentName}: initializeAddons`);
    let graph = new DAGMap();
    const Addon = require('../models/addon');
    let addonInfo, emberAddonConfig;

    logger.info('initializeAddons for: ', addonParentName);
    logger.info('     addon names are:', Object.keys(addonPackages));

    for (let name in addonPackages) {
      addonInfo = addonPackages[name];
      emberAddonConfig = addonInfo.pkg['ember-addon'];

      graph.add(name, addonInfo, emberAddonConfig.before, emberAddonConfig.after);
    }

    let addons = [];
    graph.each((key, value) => {
      let addonInfo = value;
      if (addonInfo) {
        let initializeAddonToken = heimdall.start({
          name: `initialize ${addonInfo.name}`,
          addonName: addonInfo.name,
          addonInitializationNode: true,
        });
        let start = Date.now();
        let AddonConstructor = Addon.lookup(addonInfo);
        let addon;

        try {
          addon = new AddonConstructor(addonParent, project);
        } catch (e) {
          project.ui.writeError(e);
          const SilentError = require('silent-error');
          throw new SilentError(`An error occurred in the constructor for ${addonInfo.name} at ${addonInfo.path}`);
        }

        if (addon.initializeAddons) {
          addon.initializeAddons();
        } else {
          addon.addons = [];
        }
        AddonConstructor._meta_.initializeIn = Date.now() - start;
        addon.constructor = AddonConstructor;
        initializeAddonToken.stop();
        addons.push(addon);
      }
    });

    logger.info(' addon info %o', addons.map(addon => ({
      name: addon.name,
      times: {
        initialize: addon.constructor._meta_.initializeIn,
        lookup: addon.constructor._meta_.lookupIn,
      },
    })));

    initializeAddonsToken.stop();

    return addons;
  }
}

module.exports = AddonsFactory;
