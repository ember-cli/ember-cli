import Ember from 'ember';
import { module, test } from 'qunit';
import { <%= imports %> } from '<%= testFolderRoot %>/tests/helpers/start-app';

module('<%= friendlyTestName %>', {
<%= lifeCycleHooks %>});

test('visiting /<%= dasherizedModuleName %>', function(assert) {
  visit('/<%= dasherizedModuleName %>');

  andThen(function() {
    assert.equal(currentURL(), '/<%= dasherizedModuleName %>');
  });
});
