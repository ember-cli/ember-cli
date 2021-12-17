'use strict';

function allPkgInfosEqualAtIndex(paths, index) {
  const itemToCheck = paths[0][index];
  return paths.every((pathToLazyEngine) => pathToLazyEngine[index] === itemToCheck);
}

class HostInfoCache {
  constructor(project) {
    this.project = project;
    this._bundledPackageInfoCache = new Map();
    this._hostAddonInfoCache = new Map();
    this._lcaHostCache = new Map();
  }

  /**
   * Given a path (calculated as part of `getHostAddonInfo`), return the correct
   * "bundle host". A bundle host is considered the project or lazy engine.
   *
   * For example, given the following package structure:
   *
   *      --Project--
   *       /      \
   *      /        \
   * Lazy Engine A  \
   *              Addon A
   *                |
   *                |
   *           Lazy Engine B
   *            /          \
   *           /            \
   *      Lazy Engine A   Lazy Engine C
   *
   * The provided paths for lazy engine A would look like:
   *
   * - [Project]
   * - [Project, Addon A, Lazy Engine B]
   *
   * For this project structure, this function would return [Project, [Project]]
   *
   * Similarly, given the following project structure:
   *
   *            --Project--
   *             /      \
   *            /        \
   *     Lazy Engine A    \
   *          /        Lazy Engine B
   *         /               |
   *        /                |
   *  Lazy Engine C     Lazy Engine C
   *
   * The provided paths for lazy engine C would look like:
   *
   * - [Project, Lazy Engine A]
   * - [Project, Lazy Engine B]
   *
   * In this case, the host is the project and would also return [Project, [Project]]
   *
   * @method _findNearestBundleHost
   * @param {Array<PackageInfo[]>} paths The found paths to a given bundle host
   * @return {[PackageInfo, PackageInfo[]]}
   * @private
   */
  _findNearestBundleHost(paths, pkgInfoForLazyEngine) {
    // building an engine in isolation (it's considered the project, but it's
    // also added as a dependency to the project by `ember-cli`)
    if (this.project._packageInfo === pkgInfoForLazyEngine) {
      return [this.project._packageInfo, [this.project._packageInfo]];
    }

    const shortestPath = paths.reduce(
      (acc, pathToLazyEngine) => Math.min(acc, pathToLazyEngine.length),
      Number.POSITIVE_INFINITY
    );

    const pathsEqualToShortest = paths.filter((pathToLazyEngine) => pathToLazyEngine.length === shortestPath);
    const [firstPath] = pathsEqualToShortest;

    for (let i = firstPath.length - 1; i >= 0; i--) {
      const pkgInfo = firstPath[i];

      if (pkgInfo.isForBundleHost() && allPkgInfosEqualAtIndex(pathsEqualToShortest, i)) {
        return [pkgInfo, firstPath.slice(0, i + 1)];
      }
    }

    // this should _never_ be triggered
    throw new Error(
      `[ember-cli] Could not find a common host for: \`${pkgInfoForLazyEngine.name}\` (located at \`${pkgInfoForLazyEngine.realPath}\`)`
    );
  }

  /**
   * Returns a `Set` of package-info objects that a given bundle host is
   * _directly_ responsible for bundling (i.e., it excludes other bundle
   * hosts/lazy engines when it encounters these)
   *
   * @method _getBundledPackageInfos
   * @param {PackageInfo} pkgInfoToStartAt
   * @return {Set<PackageInfo>}
   * @private
   */
  _getBundledPackageInfos(pkgInfoToStartAt) {
    let pkgInfos = this._bundledPackageInfoCache.get(pkgInfoToStartAt);

    if (pkgInfos) {
      return pkgInfos;
    }

    if (!pkgInfoToStartAt.isForBundleHost()) {
      throw new Error(
        `[ember-cli] \`${pkgInfoToStartAt.name}\` is not a bundle host; \`getBundledPackageInfos\` should only be used to find bundled package infos for a project or lazy engine`
      );
    }

    pkgInfos = new Set();
    this._bundledPackageInfoCache.set(pkgInfoToStartAt, pkgInfos);

    let findAddons = (currentPkgInfo) => {
      if (!currentPkgInfo.valid || !currentPkgInfo.addonMainPath) {
        return;
      }

      if (pkgInfos.has(currentPkgInfo)) {
        return;
      }

      if (currentPkgInfo.isForBundleHost()) {
        return;
      }

      pkgInfos.add(currentPkgInfo);

      let addonPackageList = currentPkgInfo.discoverAddonAddons();
      addonPackageList.forEach((pkgInfo) => findAddons(pkgInfo));
    };

    let addonPackageList = pkgInfoToStartAt.project
      ? pkgInfoToStartAt.discoverProjectAddons()
      : pkgInfoToStartAt.discoverAddonAddons();

    addonPackageList.forEach((pkgInfo) => findAddons(pkgInfo));

    return pkgInfos;
  }

  /**
   * This function intends to return a common host for a bundle host (lazy engine). The root
   * package info should be the starting point (i.e., the project's package info). We do this
   * by performing a breadth-first traversal until we find the intended lazy engine (represented
   * as a package-info & the 1st argument passed to this function). As part of the traversal, we keep
   * track of all paths to said engine; then, once we find the intended engine we use this to determine
   * the nearest common host amongst all shortest paths.
   *
   * Some context:
   *
   * For a given engine/bundle host, this finds the lowest common ancestor that is considered a
   * host amongst _all_ engines by the same name in the project.
   *
   * For example, given the following package structure:
   *
   *      --Project--
   *       /      \
   *      /        \
   * Lazy Engine A  \
   *              Addon A
   *                |
   *                |
   *           Lazy Engine B
   *            /          \
   *           /            \
   *      Lazy Engine A   Lazy Engine C
   *
   * - The LCA host for Lazy Engine A is the project
   * - The LCA host for Lazy Engine B is the project
   * - The LCA host for Lazy Engine C is Lazy Engine B
   *
   * This also returns `hostAndAncestorBundledPackageInfos`, which are all bundled addons above a given host:
   *
   * - `hostAndAncestorBundledPackageInfos` for lazy engine A includes all non-lazy dependencies of its LCA host & above (in this case, just the project)
   * - `hostAndAncestorBundledPackageInfos` for lazy engine B includes all non-lazy dependencies of its LCA host & above (in this case, just the project)
   * - `hostAndAncestorBundledPackageInfos` for lazy engine C includes non-lazy deps of lazy engine B & non-lazy deps of the project (LCA host & above)
   *
   * This is intended to mimic the behavior of `ancestorHostAddons` in `ember-engines`:
   * https://github.com/ember-engines/ember-engines/blob/master/packages/ember-engines/lib/engine-addon.js#L333
   *
   * Unfortunately, we can't easily repurpose the logic in `ember-engines` since the algorithm has to be different;
   * in `ember-engines` we need access to the actual addon instance, however, this is intended to be used _during_
   * addon instantiation, so we only have access to package-info objects. In having said this, we _can_ repurpose
   * the `hostPackageInfo` to determine the LCA host; see below `findLCAHost`.
   *
   * @method getHostAddonInfo
   * @param {PackageInfo} packageInfoForLazyEngine
   * @return {{ hostPackageInfo: PackageInfo, hostAndAncestorBundledPackageInfos: Set<PackageInfo> }}
   */
  getHostAddonInfo(packageInfoForLazyEngine) {
    const cacheKey = `${this.project._packageInfo.realPath}-${packageInfoForLazyEngine.realPath}`;

    let hostInfoCacheEntry = this._hostAddonInfoCache.get(cacheKey);

    if (hostInfoCacheEntry) {
      return hostInfoCacheEntry;
    }

    if (!packageInfoForLazyEngine.isForEngine()) {
      throw new Error(
        `[ember-cli] \`${packageInfoForLazyEngine.name}\` is not an engine; \`getHostAddonInfo\` should only be used to find host information about engines`
      );
    }

    const queue = [{ pkgInfo: this.project._packageInfo, path: [] }];
    const visited = new Set();
    const foundPaths = [];

    while (queue.length) {
      const { pkgInfo: currentPackageInfo, path } = queue.shift();

      const {
        addonMainPath,
        inRepoAddons = [],
        dependencyPackages = {},
        devDependencyPackages = {},
      } = currentPackageInfo;

      const isCurrentPackageInfoProject = this.project._packageInfo === currentPackageInfo;

      // don't process non-ember addons
      if (!isCurrentPackageInfoProject && typeof addonMainPath !== 'string') {
        continue;
      }

      // store found paths
      if (currentPackageInfo === packageInfoForLazyEngine) {
        foundPaths.push([...path]);
      }

      // don't process a given `PackageInfo` object more than once
      if (!visited.has(currentPackageInfo)) {
        visited.add(currentPackageInfo);

        // add current package info to current path
        path.push(currentPackageInfo);

        queue.push(
          ...[...inRepoAddons, ...Object.values(dependencyPackages), ...Object.values(devDependencyPackages)].map(
            (pkgInfo) => ({ pkgInfo, path: [...path] })
          )
        );
      }
    }

    const [hostPackageInfo, foundPath] = this._findNearestBundleHost(foundPaths, packageInfoForLazyEngine);

    const hostAndAncestorBundledPackageInfos = foundPath
      .filter((pkgInfo) => pkgInfo.isForBundleHost())
      .reduce((acc, curr) => {
        acc.push(...this._getBundledPackageInfos(curr));
        return acc;
      }, []);

    hostInfoCacheEntry = {
      hostPackageInfo,
      hostAndAncestorBundledPackageInfos: new Set(hostAndAncestorBundledPackageInfos),
    };

    this._hostAddonInfoCache.set(cacheKey, hostInfoCacheEntry);
    return hostInfoCacheEntry;
  }

  /**
   * This returns the LCA host for a given engine; we use the associated package info
   * to compute this (see `getHostAddonInfo` above); this finds the lowest common ancestor
   * that is considered a host amongst _all_ engines by the same name in the project. This
   * function is intended to replace the original behavior in `ember-engines`.
   *
   * For more info, see the original implementation here:
   *
   * https://github.com/ember-engines/ember-engines/blob/master/packages/ember-engines/lib/utils/find-lca-host.js
   *
   * @method findLCAHost
   * @param {EngineAddon} engineInstance
   * @return {EngineAddon|EmberApp}
   */
  findLCAHost(engineInstance) {
    // only compute once for a given engine
    // we're using the engine name as the cache key here because regardless of its
    // version, lazy engines will always get output to: `engines-dist/${engineName}`
    let lcaHost = this._lcaHostCache.get(engineInstance.name);

    if (lcaHost) {
      return lcaHost;
    }

    if (!engineInstance._packageInfo.isForEngine()) {
      throw new Error(
        `[ember-cli] \`findLCAHost\` should only be used for engines; \`${engineInstance.name}\` is not an engine`
      );
    }

    const { hostPackageInfo } = this.getHostAddonInfo(engineInstance._packageInfo);

    let curr = engineInstance;

    while (curr && curr.parent) {
      if (curr.app) {
        lcaHost = curr.app;
        break;
      }

      if (curr._packageInfo === hostPackageInfo) {
        lcaHost = curr;
        break;
      }

      curr = curr.parent;
    }

    if (lcaHost) {
      this._lcaHostCache.set(engineInstance.name, lcaHost);
      return lcaHost;
    }

    // this should _never_ be triggered
    throw new Error(
      `[ember-cli] Could not find an LCA host for: \`${engineInstance.name}\` (located at \`${
        engineInstance.packageRoot || engineInstance.root
      }\`)`
    );
  }
}

module.exports = HostInfoCache;
