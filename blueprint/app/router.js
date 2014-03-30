// For `/tests` site
var testsURLPrefix = /^\/tests/.test(document.location.pathname) ? '/tests' : '';

var Router = Ember.Router.extend({
  rootURL: testsURLPrefix + ENV.rootURL,
  location: 'history'
});

Router.map(function() {
  this.route('component-test');
  this.route('helper-test');
  // this.resource('posts', function() {
  //   this.route('new');
  // });
});

export default Router;
