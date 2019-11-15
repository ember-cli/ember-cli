import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';

export default class App extends Application {
  modulePrefix = 'some-cool-app';
  podModulePrefix = 'some-cool-app/pods';
  Resolver = Resolver;
}

loadInitializers(App, 'some-cool-app');
