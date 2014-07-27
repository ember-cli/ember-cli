import Ember from 'ember';

function <%= camelizedModuleName %>(value) {
  return value;
}

export { <%= camelizedModuleName %> };

export default Ember.Handlebars.makeBoundHelper(<%= camelizedModuleName %>);
