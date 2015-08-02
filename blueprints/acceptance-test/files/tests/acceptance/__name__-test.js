import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '<%= testFolderRoot %>/tests/helpers/start-app';

module('<%= friendlyTestName %>', {
  beforeEach: function() {
    this.application = startApp();
  },

  afterEach: function() {
    Ember.run(this.application, 'destroy');
  }
});

test('visiting /<%= dasherizedModuleName %>', function(assert) {
  visit('/<%= dasherizedModuleName %>');

  andThen(function() {
    assert.equal(currentURL(), '/<%= dasherizedModuleName %>');
  });
});
