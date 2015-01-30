import {
  <%= camelizedModuleName %>
} from '../../../helpers/<%= dasherizedModuleName %>';

module('<%= classifiedModuleName %>Helper');

// Replace this with your real tests.
test('it works', function() {
  var result = <%= camelizedModuleName %>(42);
  ok(result);
});
