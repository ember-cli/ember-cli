export default {
  name: '<%= dasherizedModuleName %>',
  initialize: function(container, app) {
    app.inject('route', '<%= camelizedModuleName %>', 'service:<%= camelizedModuleName %>');
  }
};
