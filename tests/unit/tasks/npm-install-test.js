'use strict';

var expect      = require('chai').expect;
var NpmInstall  = require('../../../lib/tasks/npm-install');
var MockUI      = require('../../helpers/mock-ui');

describe('npm install task', function() {
  var ui;

  beforeEach(function() {
    ui = new MockUI();
  });

  it('passes the appropriate "cache-min" option to npm', function(done) {
    var fakeNpm = {
      load: function(options /*, _cb */) {
        expect(options['cache-min']).to.equal(7776000);
        done();
      }
    };

    var task = new NpmInstall({
      ui: ui,
      npm: fakeNpm,

      // Disable logging hides our test output so turn these into noops
      disableLogger: function () {},
      restoreLogger: function () {}
    });

    var options = {
      preferLocalCache: true
    };

    task.run(options);
  });
});
