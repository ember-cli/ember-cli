/* jshint ignore:start */

define('{{MODULE_PREFIX}}/config/environment', ['ember'], function(Ember) {
  {{content-for 'config-module'}}
});

if (runningTests) {
  require('{{MODULE_PREFIX}}/tests/test-helper');
} else {
  require('{{MODULE_PREFIX}}/app')['default'].create({{APP_CONFIG}});
}

/* jshint ignore:end */
