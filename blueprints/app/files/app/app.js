import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
  modulePrefix: '<%= modulePrefix %>', // TODO: loaded via config
  Resolver: Resolver
});

loadInitializers(App, '<%= modulePrefix %>');

export default App;
