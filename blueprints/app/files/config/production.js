/* jshint node: true */

module.exports = function(config) {
  config.set('production', true);
  config.set('hinting', false);
  config.set('tests', process.env.EMBER_CLI_TEST_COMMAND || false);

  config.set('es3Safe', true);
  config.set('wrapInEval', false);
  config.set('minify', {
    css: {
      relativeTo: 'app/styles'
    },
    js: {
      mangle: true,
      compress: true
    }
  });

  config.set('ENV', {
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    }
  });
};
