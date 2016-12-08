'use strict';

var symlinkOrCopySync = require('symlink-or-copy').sync;
var path              = require('path');
var fs                = require('fs-extra');
var runCommand        = require('./run-command');
var Promise           = require('../../lib/ext/promise');
var tmp               = require('./tmp');
var existsSync        = require('exists-sync');
var copy              = Promise.denodeify(fs.copy);
var exec              = Promise.denodeify(require('child_process').exec);
var root = path.resolve(__dirname, '..', '..');

var PackageCache = require('../../lib/utilities/package-cache');

var runCommandOptions = {
  // Note: We must override the default logOnFailure logging, because we are
  // not inside a test.
  log: function() {
    return; // no output for initial application build
  }
};

function handleResult(result) {
  if (result.output) { console.log(result.output.join('\n')); }
  if (result.errors) { console.log(result.errors.join('\n')); }
  throw result;
}

function applyCommand(command, name /*, ...flags*/) {
  var flags = [].slice.call(arguments, 2, arguments.length);
  var args = [path.join('..', 'bin', 'ember'), command, '--disable-analytics', '--watcher=node', '--skip-git', name, runCommandOptions];

  flags.forEach(function(flag) {
    args.splice(2, 0, flag);
  });

  return runCommand.apply(undefined, args);
}

function createTmp(command) {
  var targetPath = path.join(root, 'common-tmp');
  return tmp.setup(targetPath).then(function() {
    process.chdir(targetPath);
    return command();
  });
}

/**
 * Use `createTestTargets` in the before hook to do the initial
 * setup of a project. This will ensure that we limit the amount of times
 * we go to the network to fetch dependencies.
 * @param  {String} projectName The name of the project. Can be an app or addon.
 * @param  {Object} options
 * @property {String} options.command The command you want to run
 * @return {Promise}  The result of the running the command
 */
function createTestTargets(projectName, options) {
  var command = function() {
    return applyCommand(options.command, projectName, '--skip-npm', '--skip-bower');
  };
  options = options || {};
  options.command = options.command || 'new';

  return createTmp(function() {
    return command().catch(handleResult);
  });
}

/**
 * Tears down the targeted project download directory
 * @return {Promise}
 */
function teardownTestTargets() {
  return tmp.teardown(path.join(root, 'common-tmp'));
}

/**
 * Creates symbolic links from the dependency temp directories
 * to the project that is under test.
 * @param  {String} projectName The name of the project under test
 * @return {Promise}
 */
function linkDependencies(projectName) {
  var targetPath = path.join(root, 'tmp', projectName);
  return tmp.setup(targetPath).then(function() {
    return copy(path.join(root, 'common-tmp', projectName), targetPath);
  }).then(function() {
    var nodeManifest = fs.readFileSync(path.join(targetPath, 'package.json'));

    var packageCache = new PackageCache({ linkEmberCLI: true });
    packageCache.create('node', 'npm', nodeManifest);

    var nodeModulesPath = path.join(targetPath, 'node_modules');

    if (!existsSync(nodeModulesPath)) {
      symlinkOrCopySync(path.join(packageCache.get('node'), 'node_modules'), nodeModulesPath);
    }

    process.chdir(targetPath);
  });
}

/**
 * Clean a test run and optionally assert.
 * @return {Promise}
 */
function cleanupRun(projectName) {
  var targetPath = path.join(root, 'tmp', projectName);
  return tmp.teardown(targetPath);
}

module.exports = {
  createTestTargets: createTestTargets,
  linkDependencies: linkDependencies,
  teardownTestTargets: teardownTestTargets,
  cleanupRun: cleanupRun
};
