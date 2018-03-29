/**
 * Performance cache for information about packages (projects/addons/"apps"/modules)
 * under an initial root directory and resolving addon/dependency links to other packages.
 */
var fs = require("fs-extra");
var path = require("path");
var pathParse = path.parse || require("path-parse");
var Addon = require("./addon.js");
var Project = require("./project.js");

/**
 * Resolve the real path for a file, return null if does not
 * exist or is not a file, return the real path otherwise.
 */
var realFilePathCache = Object.create(null);
var realDirectoryPathCache = Object.create(null);

/**
 * Resolve the real path for a file, return null if does not
 * exist or is not a file or FIFO, return the real path otherwise.
 *
 * @private
 * @method getRealFilePath
 * @param  {String} file file path
 * @return {String} real path or null
 */
function getRealFilePath(file) {
  let realPath;
  
  try {
    realPath = realFilePathCache[file];

    if (realPath) {
      return realPath;
    }

    let stat = fs.statSync(file);
    
    if (stat.isFile() || stat.isFIFO()) {
      realPath = fs.realpathSync(file);
    }
  } catch (e) {
    if (e !== null && (typeof e === 'object') && (e.code === "ENOENT" || e.code === "ENOTDIR")) {
      realPath = null;
    } else {
      throw e;
    }
  }
  
  realFilePathCache[file] = realPath;
  return realPath;
}

/**
 * Resolve the real path for a directory, return null if does not
 * exist or is not a directory, return the real path otherwise.
 *
 * @private
 * @method getRealDirectoryPath
 * @param  {String} file file path
 * @return {String} real path or null
 */
function getRealDirectoryPath(dir) {
  let realPath;
  
  try {
    realPath = realDirectoryPathCache[dir];

    if (realPath) {
      return realPath;
    }

    let stat = fs.statSync(dir);

    if (stat.isDirectory()) {
      realPath = fs.realpathSync(dir);
    }
  } catch (e) {
    if (e !== null && (typeof e === 'object') && (e.code === "ENOENT" || e.code === "ENOTDIR")) {
      realPath = null;
    } else {
      throw e;
    }
  }

  realDirectoryPathCache[dir] = realPath;
  return realPath;
}

/**
 * Small utility class to store a single error during processing.
 */
class ErrorEntry {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

/**
 * Small utility class to store a list of errors during processing.
 * Instances of this exist in the PackageInfo and PackageInfoCache
 * objects.
 */
class ErrorList {
  constructor() {
    this.errors = [];
  }

  /**
   * Add an error. The error obj is optional, and can be anything.
   * We do this so we don't really need to create a series of error
   * classes.
   */
  addError(errorType, errorData) {
    this.errors.push(new ErrorEntry(errorType, errorData));
  }

  insertError(errorEntry) {
    this.errors.push(errorEntry);
  }

  getErrors() {
    return this.errors;
  }

  hasErrors() {
    return (this.errors.length > 0);
  }
}

const PACKAGE_JSON = "package.json";

const ERROR_PACKAGE_DIR_MISSING = "packageDirectoryMissing";
const ERROR_PACKAGE_JSON_MISSING = "packageJsonMissing";
const ERROR_PACKAGE_JSON_PARSE = "packageJsonParse";
const ERROR_EMBER_ADDON_MAIN_MISSING = "emberAddonMainMissing";
const ERROR_DEPENDENCIES_MISSING = "dependenciesMissing";
const ERROR_NODEMODULES_ENTRY_MISSING = "modulesEntryMissing";

class PackageInfo {
  constructor(pkgObj, realPath, cache) {
    this.pkg = pkgObj;
    this.pkg['ember-addon'] = this.pkg['ember-addon'] || {};
    this.realPath = realPath;
    this.cache = cache;
    this.errors = new ErrorList();

    // other fields that will be set as needed:
    //  this.addonConstructor (ctor function or object - addons only)
    //  this.addonMainPath (when setting up addonConstructor - addons only)
    //  this.inRepoAddons   (list of PackageInfo - project only)
    //  this.internalAddons (list of PackageInfo - project only)
    //  this.cliInfo       (PackageInfo - project only)
    //  this.dependencyPackages (obj keyed by dependency name: PackageInfo)
    //     NOTE: these are ALL dependencies, not just addons
    //  this.devDependencyPackages (obj keyed by devDependency name: PackageInfo)
    //     NOTE: these are ALL dependencies, not just addons
    //  this.nodeModules    (NodeModulesList)
  }

  // Make various fields of the pkg object available.
  get name() {
    return this.pkg.name;
  }

  _addError(errorType, errorData) {
    this.errors.addError(errorType, errorData);
  }

  _insertError(errorEntry) {
    this.errors.insertError(errorEntry);
  }

  _hasErrors() {
    return this.errors.hasErrors();
  }

  /**
   * Add a reference to an in-repo addon PackageInfo object.
   */
  _addInRepoAddon(inRepoAddonPkg) {
    if (!this.inRepoAddons) {
      this.inRepoAddons = [];
    }
    this.inRepoAddons.push(inRepoAddonPkg);
  }

  /**
   * Add a reference to an internal addon PackageInfo object.
   * "internal" addons (note: not in-repo addons) only exist in 
   * Projects, not other packages. Since the cache is loaded from
   * 'loadProject', this can be done appropriately.
   */
  _addInternalAddon(internalAddonPkg) {
    if (!this.internalAddons) {
      this.internalAddons = [];
    }
    this.internalAddons.push(internalAddonPkg);
  }

  /**
   * For each dependency in the given list, find the corresponding 
   * PackageInfo object in the cache (going up the file tree if 
   * necessary, as in the node resolution algorithm). Return a map
   * of the dependencyName to PackageInfo object. Caller can then
   * store it wherever they like.
   *
   * Note: this is not to be  called until all packages that can be have 
   * been added to the cache. 
   * 
   * Note: this is for ALL dependencies, not just addons. To get just
   * addons, filter the result by calling pkgInfo.isAddon().
   */
  _addDependencies(dependencies) {
    if (!dependencies) {
      return null;
    }

    let dependencyNames = Object.keys(dependencies);

    if (dependencyNames.length === 0) {
      return null;
    }

    let packages = Object.create(null);

    let missingDependencies = [];
    
    dependencyNames.forEach(dependencyName => {
      let dependencyPackage;

      // much of the time the package will have dependencies in
      // a node_modules inside it, so check there first because it's
      // quicker since we have the reference. Only check externally
      // if we don't find it there.
      if (this.nodeModules) {
        dependencyPackage = this.nodeModules._findPackage(dependencyName);
      }

      if (!dependencyPackage) {
        dependencyPackage = this.cache._findPackage(
          dependencyName,
          path.dirname(this.realPath)  
        );
      }

      if (dependencyPackage) {
        packages[dependencyName] = dependencyPackage;
      } else {
        missingDependencies.push(dependencyName);
      }
    });

    if (missingDependencies.length > 0) {
      this._addError(ERROR_DEPENDENCIES_MISSING, missingDependencies);
    }

    return packages;
  }

  isAddon() {
    let val =
        Array.isArray(this.pkg.keywords) && (this.pkg.keywords.indexOf("ember-addon") >= 0);
    return val;
  }

  // XXX Should this move to Addon.js (and change appropriately to use the cache here?)
  getAddonConstructor() {
    if (this.isAddon() && !this.addonConstructor) {
      if (!this.addonMainPath) {
        return null;
      }

      let module = require(this.addonMainPath);
      let mainDir = path.dirname(this.addonMainPath);

      let ctor;

      if (typeof module === "function") {
        ctor = module;
        ctor.prototype.root = ctor.prototype.root || mainDir;
        ctor.prototype.pkg = ctor.prototype.pkg || this.pkg;
      } else {
        ctor = Addon.extend(
          Object.assign({ root: mainDir, pkg: this.pkg }, module)
        );
      }

      ctor._meta_ = {
        modulePath: this.addonMainPath,
        //        lookupDuration,
        initializeIn: 0
      };

      this.addonConstructor = ctor;
    }

    return this.addonConstructor;
  }
}

class NodeModulesList {
  constructor(realPath, cache) {
    this.realPath = realPath;
    this.cache = cache;
    this.entries = Object.create(null);
    this.errors = new ErrorList();
  }

  _addError(errorType, errorData) {
    this.errors.addError(errorType, errorData);
  }

  _insertError(errorEntry) {
    this.errors.insertError(errorEntry);
  }

  _hasErrors() {
    return this.errors.hasErrors();
  }

  _addEntry(entryName, entryVal) {
    this.entries[entryName] = entryVal;
  }

  /**
   * Given a package name (which may include a scope on the front),
   * return the PackageInfo that corresponds to the name. 
   *
   * Returns null if the package is not found.
   */
  _findPackage(packageName) {
    let val;

    if (packageName.startsWith("@")) {
      let parts = packageName.split("/");
      let entry = this.entries[parts[0]]; // scope
      val =
        entry instanceof NodeModulesList
        ? entry._findPackage(parts[1]) // the real name
        : null;
    } else {
      val = this.entries[packageName];
    }

    return val;
  }
}

/**
 * Class that stores entries that are either PackageInfo or NodeModulesList objects.
 * The entries are stored in a map keyed by real directory path.
 */
class PackageInfoCache {
  constructor() {
    this.entries = Object.create(null);
    this.errors = new ErrorList();
  }

  _insertError(errorEntry) {
    this.errors.insertError(errorEntry);
  }

  /**
   * Private method to ask just if our PIC-level errors object has errors.
   */
  _hasErrors() {
    return this.errors.hasErrors();
  }

  /**
   * Callable externally, does the cache have any objects with errors?
   */
  hasErrors() {
    if (this._hasErrors) {
      return true;
    }

    let paths = Object.keys(this.entries);

    if (paths.find(entryPath => this.getEntry(entryPath)._hasErrors())) {
      return true;
    }

    return false;
  }

  /**
   * Gather all the errors in the PIC and any cached objects, then dump them
   * out to the console.
   */
  showErrors() {
    this._showObjErrors(this);

    let paths = Object.keys(this.entries).sort();

    paths.forEach(entryPath => {
      this._showObjErrors(this.getEntry(entryPath));
    });
  }

  _showObjErrors(obj) {
    if (!obj._hasErrors()) {
      return;
    }

    console.log("");
    let rootPath;
    
    if (obj instanceof PackageInfoCache) {
      console.warn("Top level errors:");
      rootPath = this.realPath;
    } else {
      console.warn(obj.realPath + ":");
      rootPath = obj.realPath;
    }

    let errorList = obj.errors;

    errorList.getErrors().forEach(errorEntry => {
      switch(errorEntry.type) {
      case ERROR_PACKAGE_DIR_MISSING:
        console.warn(`   Missing package directory at relative path '${path.relative(rootPath, errorEntry.data)}'`);
        break;
      case ERROR_PACKAGE_JSON_MISSING:
        console.warn(`   Missing package.json file at relative path '${path.relative(rootPath, errorEntry.data)}'`);
        break;
      case ERROR_PACKAGE_JSON_PARSE:
        console.warn(`   Error parsing package.json file at relative path '${path.relative(rootPath, errorEntry.data)}'`);
        break;
      case ERROR_EMBER_ADDON_MAIN_MISSING:
        console.warn(`   Missing ember-addon 'main' file at relative path '${path.relative(rootPath, errorEntry.data)}'`);
        break;
      case ERROR_DEPENDENCIES_MISSING:
        let missingDependencies = errorEntry.data;
        if (missingDependencies.length === 1) {
          console.warn(`   Missing dependency '${missingDependencies[0]}'`);
        } else {
          console.warn(`   Missing dependencies:`);
          missingDependencies.forEach(dependencyName => {
            console.warn(`      ${dependencyName}`);
          });
        }
        break;
      case ERROR_NODEMODULES_ENTRY_MISSING:
        console.warn(`   Missing node_modules entry '[${errorEntry.data}'`);
        break;
      }
    });
  }

  /**
   * Do the actual processing of the root directory of a project, given a 
   * Project object (we need the object in order to find the internal addons).
   * Read the root package and the tree below it, then go back through the tree to
   * construct references between the various items (e.g., locate the actual
   * cache entries for particular addons, resolve the constructor function
   * for each package, etc.
   */
  loadProject(projectObj) {

    let val = this._readPackage(projectObj.root, projectObj);

    if (val instanceof PackageInfo) {
      // Resolve the node_module dependencies across all packages after they have
      // been loaded into the cache, because we don't know when a particular package
      // will enter the cache.
      let packageInfos = this._getPackageInfos();
      packageInfos.forEach(packageInfo => {
        // Since loadProject can be called multiple times for different projects,
        // we don't want to reprocess any packages that happen to be common
        // between them. We'll handle this by marking any packageInfo once it
        // has been processed here, then ignore it in any later processing.
        if (!packageInfo.processed) {
          let pkgs = packageInfo._addDependencies(packageInfo.pkg.dependencies);
          if (pkgs) {
            packageInfo.dependencyPackages = pkgs;
          }

          // for Projects only, we also add the devDependencies
          if (packageInfo === val) {
            pkgs = packageInfo._addDependencies(packageInfo.pkg.devDependencies);
            if (pkgs) {
              packageInfo.devDependencyPackages = pkgs;
            }
          }
          packageInfo.processed = true;
        }
      });
    } else {
      this._insertError(val);
    }

    return val;
  }

  _addEntry(path, entry) {
    this.entries[path] = entry;
  }

  getEntry(path) {
    return this.entries[path];
  }

  contains(path) {
    return this.entries[path] !== undefined;
  }

  _getPackageInfos() {
    let result = Object.values(this.entries).filter(entry => entry instanceof PackageInfo);
    return result;
  }

  // Find a PackageInfo cache entry with the given path. If there is
  // no entry in the startPath, do as done in resolve.sync() - travel up
  // the directory hierarchy, attaching 'node_modules' to each directory and
  // seeing if the directory exists and has the relevant entry.
  //
  // We'll do things a little differently, though, for speed.
  //
  // If there is no cache entry, we'll try to use _readNodeModulesList to create
  // a new cache entry and its contents. If the directory does not exist,
  // We'll create a NodeModulesList cache entry anyway, just so we don't have
  // to check with the file system more than once for that directory (we
  // waste a bit of space, but gain speed by not hitting the file system
  // again for that path).
  // Once we have a NodeModulesList, check for the package name, and continue
  // up the path until we hit the root or the PackageInfo is found.
  _findPackage(packageName, startPath) {
    let parsedPath = pathParse(startPath);
    let root = parsedPath.root;

    let currPath = startPath;

    while (currPath !== root) {
      let endsWithNodeModules = (path.basename(currPath) === "node_modules");

      let nodeModulesPath = (endsWithNodeModules ? currPath : currPath + path.sep + "node_modules");

      let nodeModulesList = this._readNodeModulesList(nodeModulesPath);

      // _readNodeModulesList only returns a NodeModulesList or null
      if (nodeModulesList) {
        let pkg = nodeModulesList._findPackage(packageName);
        if (pkg) {
          return pkg;
        }
      }

      currPath = path.dirname(currPath);
    }

    return null;
  }


  /**
   * Given a directory that supposedly contains a package, if there is a
   * readable package.json create a PackageInfo object and try to fill it out.
   * Assuming there are no "fatal" errors (like a missing package.json), 
   * return the PackageInfo object, after installing it as an entry in 
   * our entries cache, keyed on real path.
   *
   * If there is no package.json or it's bad or the package is an addon with
   * no main, the only thing we can do is return an ErrorEntry to the caller.
   * Once past all those problems, if any error occurs with any of the contents
   * of the package, they'll be cached in the PackageInfo itself.
   *
   * In summary, only PackageInfo or ErrorEntry will be returned.
   *
   * Projects are somewhat different than other package types in that they
   * also may have 'internal' (as opposed to 'in repo') addons. Unfortunately,
   * there is nothing in the package.json to identify a Project. To handle
   * that, if the 'project' parameter is set, that's indicating this package 
   * is for a project so we should process those internal addons as well.
   */
  _readPackage(pkgDir, project) {

    let realPath = getRealDirectoryPath(pkgDir);
    if (!realPath) {
      return new ErrorEntry(ERROR_PACKAGE_DIR_MISSING, pkgDir);
    }

    let pkgInfo = this.getEntry(realPath);
    if (pkgInfo) {
      return pkgInfo;
    }

    let packageJsonPath = path.join(realPath, PACKAGE_JSON);
    let pkgfile = getRealFilePath(packageJsonPath);
    if (!pkgfile) {
      return new ErrorEntry(ERROR_PACKAGE_JSON_MISSING, packageJsonPath);
    }

    let pkg;

    try {
      pkg = fs.readJsonSync(pkgfile);
    } catch (e) {
      return new ErrorEntry(ERROR_PACKAGE_JSON_PARSE, pkgfile);
    }

    // If we have an ember-addon, check that the main exists and points
    // to a valid file.
    let ctor;

    if (Array.isArray(pkg.keywords) && (pkg.keywords.indexOf("ember-addon") >= 0)) {
      let main = pkg.main;

      if (!main || main === "." || main === "./") {
        main = "index.js";
        pkg.main = main;
      } else if (!path.extname(main)) {
        main = main + ".js";
        pkg.main = main;
      }

      let mainPath = path.join(realPath, main);
      let mainRealPath = getRealFilePath(mainPath);

      if (mainRealPath) {
        pkgInfo = new PackageInfo(pkg, realPath, this);
        pkgInfo.addonMainPath = mainRealPath;
      } else {
        return new ErrorEntry(ERROR_EMBER_ADDON_MAIN_MISSING, mainPath);
      }
    } else {
      pkgInfo = new PackageInfo(pkg, realPath, this);
    }

    // If we get to here without errors, we're basically 'okay' as far as
    // adding the PackageInfo for the package to the cache. Later errors
    // go in the PackageInfo.
    this._addEntry(realPath, pkgInfo);

    // Steps:

    // Process the project here, rather than internally, so it doesn't
    // have to know too much about how the cache works.
    if (project) {
      pkgInfo.project = project; 

      let val;

      if (project.cli) {
        val = this._readPackage(project.cli.root);

        if (val instanceof PackageInfo) {
          pkgInfo.cliInfo = val;
        } else {
          // CLI package was not able to be created.
          pkgInfo._insertError(val);
        }
      }

      // add any internal addons in the project. Since internal addons are
      // optional, we don't want to just call _readPackage without checking,
      // since that would return an error if they aren't present.
      project.supportedInternalAddonPaths().forEach(internalAddonPath => {
        if (getRealDirectoryPath(internalAddonPath)) {
          val = this._readPackage(internalAddonPath);
          
          if (val instanceof PackageInfo) {
            pkgInfo._addInternalAddon(val);
          } else {
            // internal addon package was not able to be created.
            pkgInfo._insertError(val);
          } 
        }
      })
    }

    let emberAddonInfo = pkg["ember-addon"];

    // Set up packageInfos for any in-repo addons
    if (emberAddonInfo) {
      let paths = emberAddonInfo.paths;

      if (paths) {
        paths.forEach(p => {
          let addonPath = path.join(realPath, p); // real path, though may not exist
          let val = this._readPackage(addonPath);  
          if (val instanceof PackageInfo) {
            pkgInfo._addInRepoAddon(val);
          } else {
            // package was not able to be created.
            pkgInfo._insertError(val);
          }
        });
      }
    }

    // read addon modules from node_modules. We read the whole directory
    // because it's assumed that npm/yarn may have placed addons in the
    // directory from lower down in the project tree, and we want to get
    // the data into the cache ASAP. It may not necessarily be a 'real' error
    // if we find an issue, if nobody below is actually invoking the addon.
    let nodeModules = this._readNodeModulesList(
      path.join(realPath, "node_modules")
    );

    if (nodeModules) {
      pkgInfo.nodeModules = nodeModules;
    }

    return pkgInfo;
  }

  /**
   * Process a directory of modules in a given package directory.
   *
   * We will allow cache entries for node_modules that actually
   * have no contents, just so we don't have to hit the file system more
   * often than necessary--it's much quicker to check an in-memory object.
   * object.
   *
   * Note: only a NodeModulesList or null is returned.
   */
  _readNodeModulesList(nodeModulesDir) {
    let realPath = getRealDirectoryPath(nodeModulesDir);

    if (!realPath) {
      // NOTE: because we call this when searching for objects in node_modules
      // directories that may not exist, we'll just return null here.
      // If it actually is an error in some case, the caller can create the
      // error there.
      return null;
    }

    let nodeModulesList = this.getEntry(realPath);
    if (nodeModulesList) {
      return nodeModulesList;
    }

    // At this point we know the directory node_modules exists and we can
    // process it. Further errors will be recorded here, or in the objects
    // that correspond to the node_modules entries.
    nodeModulesList = new NodeModulesList(realPath, this);

    let entries = fs.readdirSync(realPath); // should not fail because getRealDirectoryPath passed

    entries.forEach(entryName => {
      // entries should be either a package or a scoping directory. I think
      // there can also be files, but we'll ignore those.

      if (entryName.startsWith(".") || entryName.startsWith("_")) {
        // we explicitly want to ignore these, according to the
        // definition of a valid package name.
        return;
      }

      let entryPath = path.join(realPath, entryName);

      if (getRealFilePath(entryPath)) {
        // we explicitly want to ignore valid regular files in node_modules.
        // This is a bit slower than just checking for directories, but we need to be sure.
        return;
      }

      // At this point we have an entry name that should correspond to
      // a directory, which should turn into either a NodeModulesList or
      // PackageInfo. If not, it's an error on this NodeModulesList.
      let entryVal;

      if (entryName.startsWith("@")) {
        // we should have a scoping directory.
        entryVal = this._readNodeModulesList(entryPath);

        // readModulesDir only returns NodeModulesList or null
        if (entryVal instanceof NodeModulesList) {
          nodeModulesList._addEntry(entryName, entryVal);
        } else {
          // This (null return) really should not occur, unless somehow the 
          // dir disappears between the time of fs.readdirSync and now.
          nodeModulesList._addError(ERROR_NODEMODULES_ENTRY_MISSING, entryName);
        }
      } else {
        // we should have a package.
        entryVal = this._readPackage(entryPath);

        if (entryVal instanceof PackageInfo) {
          nodeModulesList._addEntry(entryName, entryVal);
        } else {
          nodeModulesList._insertError(entryVal);
        }
      }
    });

    this._addEntry(realPath, nodeModulesList);

    return nodeModulesList;
  }
}

module.exports = PackageInfoCache;

/*
let t1 = process.hrtime();

var cache = new PackageInfoCache();
cache.loadProject("/Users/dcombs/dev/voyager-web_trunk");
cache.loadProject("/Users/dcombs/dev/voyager-web_trunk/core");
cache.loadProject("/Users/dcombs/dev/voyager-web_trunk/extended");

let timeDiff = process.hrtime(t1);
console.log(`Overall processing took ${(timeDiff[0] * 1e9 + timeDiff[1]).toLocaleString()} ns`);

cache.showErrors();
*/
