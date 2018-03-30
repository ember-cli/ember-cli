'use strict';

module.exports = function calcAddonChain(addon) {
  let project = addon.project;
  let addonChain = [];
  while (addon !== project) {
    addonChain.push(addon.name);
    addon = addon.parent;
  }
  addonChain.push(project.name());
  return addonChain.reverse().join(' -> ');
};
