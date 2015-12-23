import Ember from 'ember';
import config from 'meta/tag/module';

export default Ember.Route.extend({
  model() {
    return config;
  }
});
