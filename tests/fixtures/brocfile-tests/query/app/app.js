import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';

const App = Application.extend({
  modulePrefix: 'query',
  podModulePrefix: 'app/pods',
  Resolver: Resolver
});

loadInitializers(App, 'query');

export default App;
