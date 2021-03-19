import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'some-cool-app/config/environment';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;

  init() {
    super.init();
    window.APP_HAS_LOADED = true;
  }
}

loadInitializers(App, config.modulePrefix);