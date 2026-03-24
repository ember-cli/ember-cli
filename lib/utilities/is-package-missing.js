'use strict';

module.exports = function isPackageMissing(context, packageName) {
  let pkgContent = context.project.pkg;
  let isAvailableInDevDependency = pkgContent.devDependencies && pkgContent.devDependencies[packageName];
  let isAvailableInDependency = pkgContent.dependencies && pkgContent.dependencies[packageName];
  return !(isAvailableInDevDependency || isAvailableInDependency);
};
