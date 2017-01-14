/* eslint-env node */

// To use it create some files under `mocks/`
// e.g. `server/mocks/ember-hamsters.js`
//
// module.exports = function(app) {
//   app.get('/ember-hamsters', function(req, res) {
//     res.send('hello');
//   });
// };

module.exports = function(app) {
  const globSync   = require('glob').sync;
  var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname }).map(require);
  var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);

  // Log proxy requests
  const morgan  = require('morgan');
  app.use(morgan('dev'));

  mocks.forEach(function(route) { route(app); });
  proxies.forEach(function(route) { route(app); });

};
