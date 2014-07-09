import Ember from 'ember';
import Router from '<%= name %>/router';

var Router = Ember.Router.extend({
  location: <%= namespace %>ENV.locationType
});

Router.map(function() {});

export default Router;
