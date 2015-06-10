import { moduleForComponent, test } from 'ember-qunit';

moduleForComponent('<%= componentPathName %>', '<%= friendlyTestDescription %>', {
  <%= testTypeDefinition %>
});

test('it renders', function(assert) {
  <%= testContent %>
});
