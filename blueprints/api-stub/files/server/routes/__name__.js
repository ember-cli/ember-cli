var express = require('express');

module.exports = function(app) {
  var <%= camelizedModuleName %>Router = express.Router();
  <%= camelizedModuleName %>Router.get('/', function(req, res) {
    res.send({<%= dasherizedModuleName %>:[]});
  });
  app.use('/api<%= path %>', <%= camelizedModuleName %>Router);
};
