import { moduleForComponent, test } from 'ember-qunit';<%= testImports %>

moduleForComponent('<%= componentPathName %>', '<%= friendlyTestDescription %>', {
  <%= testOptions %>
});

test('it renders', function(assert) {
  <%= testContent %>
});
