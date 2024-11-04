'use strict';

module.exports = {
  get AddonInstall() {
    return require('./addon-install');
  },
  get BuildWatch() {
    return require('./build-watch');
  },
  get Build() {
    return require('./build');
  },
  get CreateAndStepIntoDirectory() {
    return require('./create-and-step-into-directory');
  },
  get DestroyFromBlueprint() {
    return require('./destroy-from-blueprint');
  },
  get GenerateFromBlueprint() {
    return require('./generate-from-blueprint');
  },
  get GitInit() {
    return require('./git-init');
  },
  get InstallBlueprint() {
    return require('./install-blueprint');
  },
  get InteractiveNew() {
    return require('./interactive-new');
  },
  get NpmInstall() {
    return require('./npm-install');
  },
  get NpmTask() {
    return require('./npm-task');
  },
  get NpmUninstall() {
    return require('./npm-uninstall');
  },
  get Serve() {
    return require('./serve');
  },
  get ShowAssetSizes() {
    return require('./show-asset-sizes');
  },
  get TestServer() {
    return require('./test-server');
  },
  get Test() {
    return require('./test');
  },
};
