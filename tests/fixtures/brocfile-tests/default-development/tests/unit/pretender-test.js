/*jshint strict:false */
/* globals test, ok, window */

module('pretender-test');

test('pretender exists in development', function() {
  ok(window.Pretender, 'pretender exists');
});
