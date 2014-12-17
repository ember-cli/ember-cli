module.exports = function(app) {
  var express = require('express');
  var <%= camelizedModuleName %>Router = express.Router();

  <%= camelizedModuleName %>Router.get('/', function(req, res) {
    res.send({
      '<%= dasherizedModuleName %>': []
    });
  });

  <%= camelizedModuleName %>Router.post('/', function(req, res) {
    res.status(201).end();
  });

  <%= camelizedModuleName %>Router.get('/:id', function(req, res) {
    res.send({
      '<%= dasherizedModuleName %>': {
        id: req.params.id
      }
    });
  });

  <%= camelizedModuleName %>Router.put('/:id', function(req, res) {
    res.send({
      '<%= dasherizedModuleName %>': {
        id: req.params.id
      }
    });
  });

  <%= camelizedModuleName %>Router.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/<%= decamelizedModuleName %>', <%= camelizedModuleName %>Router);
};
