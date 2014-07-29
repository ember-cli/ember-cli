/* jshint node: true */

var productionConfig = require('./production.js');

module.exports = function(config) {
  productionConfig(config);

  config.set('production', false);
  config.set('tests', true);
  config.set('hinting', true, {
    js
  });


  config.set('wrapInEval', true);
};
