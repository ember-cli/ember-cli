'use strict';

var assert           = require('../../../helpers/assert');
var LiveReloadServer = require('../../../../lib/tasks/server/livereload-server');
var MockUI           = require('../../../helpers/mock-ui');

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

  it('ensure the correct banner is printed', function() {
    return subject.start({
        liveReloadPort: 1337
      })
      .then(function() {
        assert.equal(ui.output, 'Livereload server on port 1337\n');
      });
  });
});
