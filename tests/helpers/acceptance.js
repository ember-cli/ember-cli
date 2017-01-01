'use strict';

var symlinkOrCopySync = require('symlink-or-copy').sync;
var path = require('path');
var fs = require('fs-extra');
var runCommand = require('./run-command');
var Promise = require('../../lib/ext/promise');
var root = path.resolve(__dirname, '..', '..');

var PackageCache = require('../../tests/helpers/package-cache');
var CommandGenerator = require('../../tests/helpers/command-generator');

var quickTemp = require('quick-temp');
var dirs = {};

var runCommandOptions = {
  // Note: We must override the default logOnFailure logging, because we are
  // not inside a test.
  log() {
    return; // no output for initial application build
  },
};

function handleResult(result) {
  if (result.output) { console.log(result.output.join('\n')); }
  if (result.errors) { console.log(result.errors.join('\n')); }
  throw result;
}

function applyCommand(command, name /*, ...flags*/) {
  var flags = [].slice.call(arguments, 2, arguments.length);
  var binaryPath = path.resolve(path.join(__dirname, '..', '..', 'bin', 'ember'));
  var args = [binaryPath, command, name, '--disable-analytics', '--watcher=node', '--skip-git', runCommandOptions];

  flags.forEach(function(flag) {
    args.splice(2, 0, flag);
  });

  return runCommand.apply(undefined, args);
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
  var outputDir = quickTemp.makeOrReuse(dirs, projectName);

  options = options || {};
  options.command = options.command || 'new';

  return applyCommand(options.command, projectName, '--skip-npm', '--skip-bower', '--directory=' + outputDir)
    .catch(handleResult);
}

/**
 * Tears down the targeted project download directory
 */
function teardownTestTargets() {
  // Remove all tmp directories created in this run.
  var dirKeys = Object.keys(dirs);
  for (var i = 0; i < dirKeys.length; i++) {
    quickTemp.remove(dirs, dirKeys[i]);
  }
}

/**
 * Creates symbolic links from the dependency temp directories
 * to the project that is under test.
 * @param  {String} projectName The name of the project under test
 * @return {String} The path to the hydrated fixture.
 */
function linkDependencies(projectName) {
  var sourceFixture = dirs[projectName]; // original fixture for this acceptance test.
  var runFixture = quickTemp.makeOrRemake(dirs, projectName + '-clone');

  fs.copySync(sourceFixture, runFixture);

  var nodeManifest = fs.readFileSync(path.join(runFixture, 'package.json'));

  var packageCache = new PackageCache(root);
  packageCache.create('node', 'yarn', nodeManifest, [{ name: 'ember-cli', path: root }]);

  var nodeModulesPath = path.join(runFixture, 'node_modules');
  symlinkOrCopySync(path.join(packageCache.get('node'), 'node_modules'), nodeModulesPath);

  process.chdir(runFixture);

  return runFixture;
}

/**
 * Clean a test run.
 */
function cleanupRun(projectName) {
  process.chdir(root);
  quickTemp.remove(dirs, projectName + '-clone');
}

module.exports = {
  createTestTargets,
  linkDependencies,
  teardownTestTargets,
  cleanupRun,
};
