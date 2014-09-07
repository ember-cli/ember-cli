import Ember from 'ember';
import Application from '<%= modulePrefix %>/app';
import Router from '<%= modulePrefix %>/router';
import config from '<%= modulePrefix %>/config/environment';

export default function startApp(attrs) {
  var App;

  var attributes = Ember.merge(config, attrs); // use defaults, but you can override;

  Router.reopen({
    location: 'none'
  });

  Ember.run(function() {
    App = Application.create(attributes);
    App.setupForTesting();
    App.injectTestHelpers();
  });

  App.reset(); // this shouldn't be needed, i want to be able to "start an app at a specific URL"

  return App;
}
