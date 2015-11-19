import { module } from 'qunit';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';

export default function(name, options = {}) {
  const beforeEach = options.beforeEach;
  options.beforeEach = function() {
    this.application = startApp();

    if (beforeEach) {
      beforeEach.apply(this, arguments);
    }
  };

  const afterEach = options.afterEach;
  options.afterEach = function() {
    destroyApp(this.application);

    if (afterEach) {
      afterEach.apply(this, arguments);
    }
  };

  module(name, options);
}
