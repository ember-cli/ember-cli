'use strict';

var find = require('ember-cli-lodash-subset').find;

module.exports = function findAddonByName(addons, name) {
  function matchAddon(name, addon) {
    return name === addon.name || (addon.pkg && name === addon.pkg.name);
  }

  return find(addons, function(addon) {
    return matchAddon(name, addon);
  });
};
