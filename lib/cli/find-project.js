'use strict';

// Searches from the cwd upwards for a package.json. If that package.json
// includes ember-cli as devDependency then it returns
// { directory: String, packageJSON: Object } else it returns null.

var RSVP   = require('rsvp');
var findup = RSVP.denodeify(require('findup'));
var readFile = RSVP.denodeify(require('fs').readFile);

module.exports = findProject;
function findProject() {
  return findup(process.cwd(), 'package.json')
    .then(function(dir) {
      return readFile(dir + '/package.json', 'utf8')
        .then(function(rawPackageJSON) {
          var packageJSON = JSON.parse(rawPackageJSON);

          if (packageJSON.devDependencies['ember-cli']) {
            return {
              directory: dir,
              packageJSON: packageJSON
            };
          } else {
            return null;
          }
        });
    })
    .catch(function() { return null; });
}
