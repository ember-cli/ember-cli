import Ember from 'ember';

var Router = Ember.Router.extend({
  location: <%= namespace %>ENV.locationType
});

Router.map(function() {
});

export default Router;
