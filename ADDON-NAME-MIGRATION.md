# Addon Name Migration

Prior to 3.5.1 of ember-cli we would allow the name of the addon; specified in the index.js, and the name in the package.json to differ. We would like to canonicalize the name so they are the same. While we feel that this divergence is uncommon, addons that did not have a canonicalized name would produce code that did not align to the package name. This will make efforts like tree-shaking much easier to do as there doesn't need to be multiple resolution rules for `import`s in application code. This also will make debugging code much easier because the runtime module name will reflect the NPM package name.

### For Addon Authors

To help migrate this category of addons we have created a utility for providing a migration path for your consumers. [ember-cli/canonicalize-addon-name](https://github.com/ember-cli/canonicalize-addon-name) provides functionality to add runtime deprecations. It also provides a codemod that you can provide to your consumers to help them migrate.

### For Addon Consumers

If you have encountered this warning please open an issue up against the offending addon, so they can provide you with a migration path.