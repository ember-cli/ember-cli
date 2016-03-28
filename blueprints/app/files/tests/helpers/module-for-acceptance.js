import { module } from 'qunit';
import Ember from 'ember';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';

const { RSVP: { Promise } } = Ember;

export default function(name, options = {}) {
  module(name, {
    beforeEach() {
      this.application = startApp();

      if (options.beforeEach) {
        return options.beforeEach.apply(this, arguments);
      }
    },

    afterEach() {
      let result = Promise.resolve();
      if (! options.afterEach) {
        result = options.afterEach.apply(this, arguments);
      }

      destroyApp(this.application);

      return result;
    }
  });
}
