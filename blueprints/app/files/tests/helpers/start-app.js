import Ember from 'ember';
import Application from '../../app';
import config from '../../config/environment';


export function startApp(attrs) {
  var application;

  var attributes = Ember.merge({}, config.APP);
  attributes = Ember.merge(attributes, attrs); // use defaults, but you can override;

  Ember.run(function() {
    application = Application.create(attributes);
    application.setupForTesting();
    application.injectTestHelpers();
  });

  return application;
}

export function getAppInstance(application) {
  return Ember.run(application, 'buildInstance');
}

// export startApp as default for backwards compatability
export default startApp;
