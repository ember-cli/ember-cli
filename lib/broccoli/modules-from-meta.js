/* jshint ignore:start */

define('~ember-cli/config-modules', ['ember'], function(Ember) {

  {{content-for 'config-module'}}

  Ember['default'].$('meta[data-module=true]').each(function(index, meta) {
    define(meta.name, [], function() {
      try {
        return {
          'default': JSON.parse(unescape(meta.content))
        };
      } catch (e) {
        throw new Error('Could not read config from meta tag with name "' + meta.name + '".');
      }
    })
  });
});

/* jshint ignore:end */
