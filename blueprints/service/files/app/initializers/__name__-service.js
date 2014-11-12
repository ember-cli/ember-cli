export function initialize(container, application) {
  application.inject('route', '<%= camelizedModuleName %>Service', 'service:<%= dasherizedModuleName %>');
}

export default {
  name: '<%= dasherizedModuleName %>-service',
  initialize: initialize
};
