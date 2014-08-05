// To use it create some files under `routes/`
// e.g. `server/routes/ember-hamsters.js`
//
// module.exports = function(app) {
//   app.get('/ember-hamsters', function(req, res) {
//     res.send('hello');
//   });
// };

var bodyParser = require('body-parser');
var globSync   = require('glob').sync;
var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname })
var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname })

var moxies = mocks.concat(proxies);
var routes = moxies.map(require);

module.exports = function(app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  routes.forEach(function(route) { route(app); });
};
