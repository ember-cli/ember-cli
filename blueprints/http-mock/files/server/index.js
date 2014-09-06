module.exports = function(app) {
  var globSync   = require('glob').sync;
  var bodyParser = require('body-parser');
  var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname }).map(require);
  var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  mocks.forEach(function(route) { route(app); });

  // proxy expects a stream, but express will have turned
  // the request stream into an object because bodyParser
  // has run. We have to convert it back to stream:
  // https://github.com/nodejitsu/node-http-proxy/issues/180
  app.use(require('connect-restreamer')());
  proxies.forEach(function(route) { route(app); });
};
