/* jshint ignore:start */

define('{{MODULE_PREFIX}}/config/environment', [], function() {
  var metaName = '{{MODULE_PREFIX}}/config/environment';
  var rawConfig = jQuery('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
});

if (runningTests) {
  require('{{MODULE_PREFIX}}/tests/test-helper');
} else {
  require('{{MODULE_PREFIX}}/app')['default'].create({{APP_CONFIG}});
}

/* jshint ignore:end */
