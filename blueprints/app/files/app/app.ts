import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from '<%= modulePrefix %>/config/environment';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);

<% if (typescript) { %>
// This "side-effect"-type import provides auto-complete, go-to-def, etc. for
// Ember's internals throughout your application, so don't remove it!
import 'ember-source/types';
<% } else { %>
// This "type definition" import comment provides auto-complete, go-to-def, etc.
// for Ember's internals throughout your application, so don't remove it!
/**
  @typedef {import('ember-source/types')} Types
*/
<% } %>
