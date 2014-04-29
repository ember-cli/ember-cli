'use strict';

var assert           = require('../../../helpers/assert');
var liveReloadServer = require('../../../../lib/tasks/server/livereload-server');

describe('livereload-server', function() {
  it('should return immediately if `liveReload` option is false', function() {
    return liveReloadServer.start({liveReload: false})
      .then(function(result) {
        assert.equal('live-reload is disabled', result);
      });
  });
});
