'use strict';
const addonBlueprint = require('../addon');

module.exports = Object.assign({}, addonBlueprint, {
  description: 'Generates an Ember addon with a module unification layout.',
  appBlueprintName: 'module-unification-app',
  fileMap: Object.assign({}, addonBlueprint.fileMap, {
    '^src.*': 'tests/dummy/:path',
    '^addon-src/.gitkeep': 'src/.gitkeep',
  }),
});
