// Gathers objects object of a certain specified type into a hash.
//
// e.g.:
// Files:
// - ./hamster.js which exports an instance of Hamster with key='tomster'
// - ./parrot.js which exports an instance of Parrot (not a Hamster!)
//
// requireAsHash('./*.js', Hamster):
// {
//   tomster: { key: 'tomster', ...} // Same as require('./hamster.js')
// }


var globSync      = require('glob').sync;
var path          = require('path');
var getCallerFile = require('./get-caller-file');

module.exports = requireAsHash;
function requireAsHash(pattern, type) {
  var callerFileDir = path.dirname(getCallerFile());

  return globSync(pattern, { cwd: callerFileDir })
    .reduce(function(hash, file) {

      var object = require(callerFileDir + '/' + file);
      if (!type || object instanceof type) {
        if (!object.key) {
          throw new Error('Object does not have a "key" property.');
        }
        hash[object.key] = object;
      }
      return hash;
    }, {});
}
