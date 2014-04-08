'use strict';

var Insight    = require('../../lib/utilities/insight');
var InsightLib = require('insight');
var assert     = require('../helpers/assert');
var stub       = require('../helpers/stub').stub;

var insight;
var insightLib = new InsightLib({
  trackingCode: 'test',
  packageName: 'test'
});

describe('Unit: insight wrapper', function() {

  beforeEach(function() {
    insight = new Insight({
      insight: insightLib
    });
    insight.optOut = undefined;
  });

  describe('askPermission', function() {
    it('returns false when user denies permission', function() {
      insightLib.askPermission = function(msg, cb) {
        cb(false);
      };
      var permission = insight.askPermission();
      return assert.eventually.equal(permission, false);
    });

    it('returns true when user grants permission', function() {
      insightLib.askPermission = function(msg, cb) {
        cb(true);
      };
      var permission = insight.askPermission();

      return assert.eventually.equal(permission, true);
    });
  });

  describe('track', function() {
    it('delegates to underlying lib', function() {
      var mock = stub(insightLib, 'track');
      insight.track('test', 'example');
      assert.ok(mock.called);
      assert.equal(mock.calledWith[0][0], 'test');
      assert.equal(mock.calledWith[0][1], 'example');
    });
  });
});
