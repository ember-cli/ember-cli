/* jshint node: true */

var productionConfig = require('./production.js');

module.exports = function(config) {
  productionConfig(config);
  config.set('tests', true);
};
