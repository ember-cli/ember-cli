'use strict';

var requireLocal = require('../utilities/require-local');

module.exports.supportedPlugins = {
  'handlebars': 'broccoli-template',
  'emblem': 'broccoli-emblem-compiler'
};

module.exports.handlebars = function(tree) {
  var filter = requireLocal('broccoli-template');
  return filter(tree, {
    extensions: ['hbs', 'handlebars'],
    compileFunction: 'Ember.Handlebars.compile'
  });
};

module.exports.emblem = function(tree) {
  var filter = requireLocal('broccoli-emblem-compiler');
  return filter(tree);
};
