'use strict';

/**
 * Returns the package manager, given an object where folks can *technically*
 * pass --pnpm --yarn --npm. But using multiple package managers at the
 * same time is not supported (by anything).
 *
 * This function defines the priority of package managers, if multiple are present.
 *
 * @private
 * @method getPackageManagerFromFlags
 * @param {{ pnpm?: boolean; yarn?: boolean; packageManager?: 'pnpm' | 'yarn' | 'npm' }} options
 * @return {'pnpm' | 'yarn' | 'npm' | undefined}
 */
function getPackageManagerFromFlags(options) {
  let { pnpm, yarn, packageManager } = options;

  if (packageManager) {
    return packageManager;
  }

  if (pnpm) {
    return 'pnpm';
  }

  if (yarn) {
    return 'yarn';
  }

  // supported for legacy reasons
  if (yarn === false) {
    return 'npm';
  }

  return undefined;
}

module.exports = { getPackageManagerFromFlags };
