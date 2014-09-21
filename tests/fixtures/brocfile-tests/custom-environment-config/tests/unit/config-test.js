/*jshint strict:false */
import config from '../../config/environment';

test('the correct config is used', function() {
  equal(config.fileUsed, 'config/something-else.js');
});
