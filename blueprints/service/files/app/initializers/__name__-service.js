export default {
  name: '<%= dasherizedModuleName %>-service',
  initialize: function(container, app) {
    app.inject('route', '<%= camelizedModuleName %>Service', 'service:<%= dasherizedModuleName %>');
  }
};
