'use strict';

/**
@module ember-cli
*/

const DAG = require('../utilities/DAG');
let logger = require('heimdalljs-logger')('ember-cli:addons-factory');
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
    let graph = new DAG();
    const Addon = require('../models/addon');
    let addonInfo, emberAddonConfig;

    logger.info('initializeAddons for: ', addonParentName);
    logger.info('     addon names are:', Object.keys(addonPackages));

    for (let name in addonPackages) {
      addonInfo = addonPackages[name];
      emberAddonConfig = addonInfo.pkg['ember-addon'];

      graph.addEdges(name, addonInfo, emberAddonConfig.before, emberAddonConfig.after);
    }

    let addons = [];
    graph.topsort(vertex => {
      let addonInfo = vertex.value;
      if (addonInfo) {
        let initializeAddonToken = heimdall.start({
          name: `initialize ${addonInfo.name}`,
          addonName: addonInfo.name,
          addonInitializationNode: true,
        });
        let start = Date.now();
        let AddonConstructor = Addon.lookup(addonInfo);
        let addon = new AddonConstructor(addonParent, project);
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
