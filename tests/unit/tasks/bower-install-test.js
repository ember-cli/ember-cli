'use strict';

var expect      = require('chai').expect;
var BowerTask   = require('../../../lib/tasks/bower-install');
var MockUI     = require('../../helpers/mock-ui');

describe('bower install task', function() {
  var ui;

  beforeEach(function() {
    ui = new MockUI();
  });

  it('passes the "offline" config option to bower', function(done) {
    var fakeBower = {
      commands: {
        install: function(_a, _b, config) {
          expect(config.offline).to.equal(true);
          done();
        }
      }
    };

    var task = new BowerTask({
      ui: ui,
      bower: fakeBower
    });

    var options = {
      localCacheOnly: true
    };

    task.run(options);
  });
});
