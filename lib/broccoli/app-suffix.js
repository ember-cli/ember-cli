/* jshint ignore:start */

define('{{MODULE_PREFIX}}/config/environment', ['ember'], function(Ember) {
  try {
    var metaName = '{{MODULE_PREFIX}}/config/environment';
    var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
    var config = JSON.parse(unescape(rawConfig));

    return { 'default': config };
  }
  catch(err) {
    throw new Error('Could not read config from meta tag with name "' + metaName + '".');
  }
});

if (runningTests) {
  require('{{MODULE_PREFIX}}/tests/test-helper');
} else {
  window.{{NAMESPACE}} = require('{{MODULE_PREFIX}}/app')['default'].create({{APP_CONFIG}});
}

/* jshint ignore:end */
