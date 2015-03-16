'use strict';

function registerDiagnosticsForEachAddon(registry, parent) {
  parent.initializeAddons();
  var addons = parent.addons || (parent.project && parent.project.addons);
  
  if (!addons) {
    return;
  }

  addons.forEach(function(addon) {
    if (addon.registerDiagnostics) {
      addon.registerDiagnostics('parent', registry);
    }
  });
}


module.exports.setupRegistry = function(appOrAddon) {
  var registry = appOrAddon.registry;
  if (appOrAddon.registerDiagnostics) {
    appOrAddon.registerDiagnostics('self', registry);
  }

  registerDiagnosticsForEachAddon(registry, appOrAddon);
};