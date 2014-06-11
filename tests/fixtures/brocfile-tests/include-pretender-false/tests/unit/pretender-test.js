/*jshint strict:false */
/* globals test, ok, window */

module('pretender-test');

test('pretender does not exist', function() {
  ok(!window.Pretender, 'pretender does not exist');
});
