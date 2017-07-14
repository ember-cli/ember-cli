import Ember from 'ember';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';

const App = Ember.Application.extend({
  modulePrefix: 'some-cool-app',
  podModulePrefix: 'some-cool-app/pods',
  Resolver: Resolver
});

loadInitializers(App, 'some-cool-app');

export default App;
