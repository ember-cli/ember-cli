'use strict';

var path  = require('path');

function isSubdirectoryOf(parentPath, possibleChildPath) {
  return possibleChildPath.length > parentPath.length &&
    possibleChildPath.indexOf(parentPath) === 0;
}

// A utility function for determining what path an addon may be found at. Addons
// will only be resolved in the project's local `node_modules/` directory. This
// is in contrast to a plain `require('some-module')` lookup, which would resolve
// a library according to the paths in NODE_PATH.
//
// A description of node's lookup logic can be found here:
//
// * https://nodejs.org/api/modules.html#modules_all_together
//
// By requiring with an absolute path this logic is bypassed.
//
module.exports = function nodeModulesPath(context) {

  // Optionally configure a different home for `node_modules/` in a parent
  // directory of the project. Possible use cases for this include caching
  // the `node_modules/` directory outside of a source code checkout, and
  // ensuring the same source code (shared over a network) can be used with
  // different environments (Linux, OSX) where binary compatibility may not
  // exist.
  //
  // For example, you can specify a different home directory for modules:
  //
  //   EMBER_NODE_PATH=/opt/deps/node_modules NODE_PATH=/opt/deps/node_modules ember build
  //
  var nodePath = process.env.EMBER_NODE_PATH;
  var contextPath = path.resolve(context);

  if (nodePath) {
    var configuredPath = path.resolve(nodePath);

    // The contextPath is likely the project root, or possibly a subdirectory in
    // node_modules/ nested dependencies. If it is more specific (a subdirectory
    // of) than the configuredPath prefer the more specific contextPath.
    if (isSubdirectoryOf(configuredPath, contextPath)) {
      return path.resolve(contextPath,'node_modules');
    } else {
      return path.resolve(nodePath);
    }
  } else {
    return path.resolve(contextPath,'node_modules');
  }
};
