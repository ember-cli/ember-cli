'use strict';

var assert      = require('../../helpers/assert');
var TestServerTask    = require('../../../lib/tasks/test-server');
var MockProject = require('../../helpers/mock-project');
var MockUI      = require('../../helpers/mock-ui');
var MockWatcher = require('../../helpers/mock-watcher');

describe('test server', function() {
  var subject;

  it('transforms the options and invokes testem properly', function(done) {
    var ui = new MockUI();
    var watcher = new MockWatcher();

    subject = new TestServerTask({
      project: new MockProject(),
      ui: ui,
      addonMiddlewares: function() {
        return ['middleware1', 'middleware2'];
      },
      testem: {
        startDev: function(options) {
          assert.equal(options.file, 'blahzorz.conf');
          assert.equal(options.port, 123324);
          assert.equal(options.cwd, 'blerpy-derpy');
          assert.deepEqual(options.middleware, ['middleware1', 'middleware2']);
          done();
        }
      }
    });

    subject.run({
      configFile: 'blahzorz.conf',
      port: 123324,
      outputPath: 'blerpy-derpy',
      watcher: watcher
    });
    watcher.emit('change');
  });
});

