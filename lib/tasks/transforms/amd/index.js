'use strict';

const shimAmd = require('./amd-shim');

class AmdTransformAddon {
  /**
   * This addon is used to register a custom AMD transform for app and addons to use.
   *
   * @class AmdTransformAddon
   * @constructor
   */
  constructor(project) {
    this.project = project;
    this.name = 'amd-transform';
  }

  importTransforms() {
    return {
      amd: {
        transform: (tree, options) => {
          let nameMapping = {};
          for (let relativePath in options) {
            nameMapping[relativePath] = options[relativePath].as;
          }

          let amdTransform = shimAmd(tree, nameMapping);

          return amdTransform;
        },
        processOptions: (assetPath, entry, options) => {
          // If the import is specified to be a different name we must break because of the broccoli rewrite behavior.
          if (Object.keys(options).indexOf(assetPath) !== -1 && options[assetPath].as !== entry.as) {
            throw new Error(
              `Highlander error while importing ${assetPath}. You may not import an AMD transformed asset at different module names.`
            );
          }

          options[assetPath] = {
            as: entry.as,
          };

          return options;
        },
      },
    };
  }
}

module.exports = AmdTransformAddon;
