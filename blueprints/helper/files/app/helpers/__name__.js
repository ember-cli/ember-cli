import Ember from 'ember';

export function <%= camelizedModuleName %>(input) {
  return input;
}

export default Ember.Handlebars.makeBoundHelper(<%= camelizedModuleName %>);
