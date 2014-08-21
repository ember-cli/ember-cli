'use strict';

var assert           = require('../../../helpers/assert');
var LiveReloadServer = require('../../../../lib/tasks/server/livereload-server');
var MockUI           = require('../../../helpers/mock-ui');
var net              = require('net');
var EOL              = require('os').EOL;

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
      watcher: watcher,
      analytics: {},
      project: {
        liveReloadFilterPatterns: [],
        root: '/home/user/my-project'
      }
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
        assert.equal(ui.output, 'Livereload server on port 1337' + EOL);
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
          assert.equal(reason, 'Livereload failed on port 1337.  It is either in use or you do not have permission.' + EOL);
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });
  });

  describe('filter pattern', function() {
    var changedCount;
    var oldChanged;
    var stubbedChanged = function() {
      changedCount += 1;
    };

    var trackCount;
    var oldTrack;
    var stubbedTrack = function() {
      trackCount += 1;
    };

    beforeEach(function() {
      changedCount = 0;
      oldChanged = subject.liveReloadServer.changed;
      subject.liveReloadServer.changed = stubbedChanged;

      trackCount = 0;
      oldTrack = subject.analytics.track;
      subject.analytics.track = stubbedTrack;
    });

    afterEach(function() {
      subject.liveReloadServer.changed = oldChanged;
      subject.analytics.track = oldTrack;
      subject.project.liveReloadFilterPatterns = [];
    });

    it('triggers the liverreload server of a change when no pattern matches', function() {
      subject.didChange({filePath: ''});
      assert.equal(changedCount, 1);
      assert.equal(trackCount, 1);
    });

    it('does not trigger livereoad server of a change when there is a pattern match', function() {
      subject.project.liveReloadFilterPatterns = [/^test\/fixtures\/proxy/];
      subject.didChange({
        filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js'
      });
      assert.equal(changedCount, 0);
      assert.equal(trackCount, 0);
    });
  });
});
