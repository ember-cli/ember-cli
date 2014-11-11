import Ember from 'ember';

function <%= camelizedModuleName %>(input) {
  return input;
};

export default Ember.Handlebars.makeBoundHelper(<%= camelizedModuleName %>);
