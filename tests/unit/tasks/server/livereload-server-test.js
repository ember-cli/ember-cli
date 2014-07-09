'use strict';

var assert           = require('../../../helpers/assert');
var LiveReloadServer = require('../../../../lib/tasks/server/livereload-server');
var MockUI           = require('../../../helpers/mock-ui');
var net              = require('net');

var MockWatcher  = require('../../../helpers/mock-watcher');
describe('livereload-server', function() {
  var subject;
  var ui;
  var watcher;

  beforeEach(function() {
    ui = new MockUI();
    watcher = new MockWatcher();

    subject = new LiveReloadServer({
      ui: ui,
      watcher: watcher
    });
  });

  afterEach(function() {
    try {
      subject.liveReloadServer.close();
    } catch (err) { }
  });

  describe('output', function() {
    it('correctly indicates which port livereload is present on', function() {
      return subject.start({
        liveReloadPort: 1337,
        liveReload: true
      }).then(function() {
        assert.equal(ui.output, 'Livereload server on port 1337\n');
      });
    });

    it('informs of error during startup', function(done) {
      var preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      return subject.start({
          liveReloadPort: 1337,
          liveReload: true
        })
        .catch(function(reason) {
          assert.equal(reason, 'Livereload failed on port 1337.  It is either in use or you do not have permission.\n');
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });
  });
});
