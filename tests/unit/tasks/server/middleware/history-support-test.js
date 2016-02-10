'use strict';

var expect              = require('chai').expect;
var HistorySupportAddon = require('../../../../../lib/tasks/server/middleware/history-support');

describe('HistorySupportAddon', function () {
  describe('.serverMiddleware', function () {
    it('add middleware when locationType is auto', function() {
      var addon = new HistorySupportAddon({
        config: function() {
          return {
            locationType: 'auto'
          };
        }
      });

      expect(addon.shouldAddMiddleware()).to.true;
    });

    it('add middleware when locationType is history', function() {
      var addon = new HistorySupportAddon({
        config: function() {
          return {
            locationType: 'history'
          };
        }
      });

      expect(addon.shouldAddMiddleware()).to.true;
    });

    it('add middleware when historySupportMiddleware is true', function() {
      var addon = new HistorySupportAddon({
        config: function() {
          return {
            historySupportMiddleware: true
          };
        }
      });

      expect(addon.shouldAddMiddleware()).to.true;
    });

    it('do not add middleware when historySupportMiddleware is false and locationType is history', function() {
      var addon = new HistorySupportAddon({
        config: function() {
          return {
            locationType: 'history',
            historySupportMiddleware: false
          };
        }
      });

      expect(addon.shouldAddMiddleware()).to.false;
    });
  });
});
