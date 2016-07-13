import Ember from 'ember';

var config;

try {
  var metaName = '{{MODULE_PREFIX}}/config/environment';
  var rawConfig = Ember.$('meta[name="' + metaName + '"]').attr('content');
  config = JSON.parse(unescape(rawConfig));
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

export default config;
