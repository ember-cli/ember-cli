// To use it create some files under `routes/`
// e.g. `server/routes/ember-hamsters.js`
//
// module.exports = function(app) {
//   app.get('/ember-hamsters', function(req, res) {
//     res.send('hello');
//   });
// };
//
// Example to proxy /api/* on  localhost:3000
//
// var httpProxy = require('http-proxy');
// var apiProxy = httpProxy.createProxyServer();
// 
// module.exports = function(app) {
//    app.get('/api/*', function(req, res) {
//      apiProxy.web(req, res, { target: 'http://127.0.0.1:3000' });
//    });
// };
// 

var express    = require('express');
var bodyParser = require('body-parser');
var globSync   = require('glob').sync;
var routes     = globSync('./routes/*.js', { cwd: __dirname }).map(require);

module.exports = function(emberCLIMiddleware) {
  var app = express();
  app.use(bodyParser());

  routes.forEach(function(route) { route(app); });
  app.use(emberCLIMiddleware);

  return app;
};
