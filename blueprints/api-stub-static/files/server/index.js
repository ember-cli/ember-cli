// To use it create some directories under `routes/`
// and then add index.json files for responses
// e.g. `server/routes/service/index.json`

var fs = require('fs');
var walkRoutes = require('./util/walkRoutes');

module.exports = function(app) {
  var rootdir = './server/routes';

  var routeHandler = function(filePath) {
    return function(req, res) {
      res.type('application/json');
      res.send(fs.readFileSync(filePath));
    };
  };

  var routes = walkRoutes(rootdir, /\.json$/);

  var start = './server/routes'.length;
  var cutoff = '/index.json'.length;

  for (var i = 0; i < routes.length; i++) {
    var filePath = routes[i];
    var last = filePath.length - cutoff - start;
    var route = filePath.substr(start, last);
    app.get(route, routeHandler(filePath));
  }
};
