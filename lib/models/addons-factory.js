'use strict';

/**
@module ember-cli
*/

var CoreObject = require('core-object');
var DAG = require('../utilities/DAG');
var logger = require('heimdalljs-logger')('ember-cli:addons-factory');
var heimdall = require('heimdalljs');

/**
  AddonsFactory is responsible for instantiating a collection of addons, in the right order.

  @class AddonsFactory
  @extends CoreObject
  @constructor
*/
var AddonsFactory = CoreObject.extend({
  init(addonParent, project) {
    this._super();

    this.addonParent = addonParent;
    this.project = project;
  },

  initializeAddons(addonPackages) {
    var addonParent = this.addonParent;
    var project = this.project;
    var addonParentName = typeof addonParent.name === 'function' ? addonParent.name() : addonParent.name;

    var initializeAddonsToken = heimdall.start(`${addonParentName}: initializeAddons`);
    var graph = new DAG();
    var Addon = require('../models/addon');
    var addonInfo, emberAddonConfig;

    logger.info('initializeAddons for: ', addonParentName);
    logger.info('     addon names are:', Object.keys(addonPackages));

    for (var name in addonPackages) {
      addonInfo = addonPackages[name];
      emberAddonConfig = addonInfo.pkg['ember-addon'];

      graph.addEdges(name, addonInfo, emberAddonConfig.before, emberAddonConfig.after);
    }

    var addons = [];
    graph.topsort(vertex => {
      var addonInfo = vertex.value;
      if (addonInfo) {
        var initializeAddonToken = heimdall.start({
          name: `initialize ${addonInfo.name}`,
          addonName: addonInfo.name,
          addonInitializationNode: true,
        });
        var start = Date.now();
        var AddonConstructor = Addon.lookup(addonInfo);
        var addon = new AddonConstructor(addonParent, project);
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
  },
});

module.exports = AddonsFactory;
