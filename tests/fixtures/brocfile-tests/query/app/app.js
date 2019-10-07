import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';

export default class App extends Application {
  modulePrefix = 'query';
  podModulePrefix = 'app/pods';
  Resolver = Resolver;
}

loadInitializers(App, 'query');
