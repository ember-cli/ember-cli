'use strict';

const find = require('ember-cli-lodash-subset').find;

module.exports = function findAddonByName(addons, name) {
  function matchAddon(name, addon) {
    return name === addon.name || (addon.pkg && name === addon.pkg.name);
  }

  return find(addons, addon => matchAddon(name, addon));
};
