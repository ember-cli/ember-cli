'use strict';

module.exports = {
  AddonInstall: require('./addon-install'),
  BuildWatch: require('./build-watch'),
  Build: require('./build'),
  CreateAndStepIntoDirectory: require('./create-and-step-into-directory'),
  DestroyFromBlueprint: require('./destroy-from-blueprint'),
  GenerateFromBlueprint: require('./generate-from-blueprint'),
  GitInit: require('./git-init'),
  InstallBlueprint: require('./install-blueprint'),
  InteractiveNew: require('./interactive-new'),
  NpmInstall: require('./npm-install'),
  NpmTask: require('./npm-task'),
  NpmUninstall: require('./npm-uninstall'),
  Serve: require('./serve'),
  ShowAssetSizes: require('./show-asset-sizes'),
  TestServer: require('./test-server'),
  Test: require('./test'),
};
