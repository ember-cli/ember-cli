import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';

Ember.MODEL_FACTORY_INJECTIONS = true;
var badJuju = JSON.parse('{"bad":"this juju",}');

var App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  juju:badJuju,
  Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;