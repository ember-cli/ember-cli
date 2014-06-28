var fs = require('fs');

module.exports = function walkRoutes(primary, selector) {
  return (function walkThrough(readdir, relative) {
    var paths = [];
    for (var i = 0; i < readdir.length; i++) {
      var entry = readdir[i];
      var filePath = relative + '/' + entry;
      if (selector.test(entry)) {
        paths.push(filePath);
      } else {
        var innerReaddir = fs.readdirSync(filePath);
        paths = paths.concat(walkThrough(innerReaddir, filePath));
      }
    }
    return paths;
  })(fs.readdirSync(primary), primary);
};
