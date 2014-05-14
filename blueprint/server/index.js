// To use it create some files under `routes/`
// e.g. `server/routes/ember-hamsters.js`
//
// module.exports = function(app) {
//   app.get('/ember-hamsters', function(req, res) {
//     res.send('hello');
//   });
// };

var express    = require('express');
var globSync   = require('glob').sync;
var routes     = globSync('./routes/*.js', { cwd: __dirname }).map(require);

module.exports = function(emberCLIMiddleware) {
  var app = express();

  app.use(emberCLIMiddleware);
  // Here is where you specify your own middlewares

  routes.forEach(function(route) { route(app); });

  return app;
};
