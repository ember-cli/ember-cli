'use strict';

const { expect } = require('chai');
const HistorySupportAddon = require('../../../../../lib/tasks/server/middleware/history-support');

describe('HistorySupportAddon', function () {
  describe('.serverMiddleware', function () {
    it('add middleware when locationType is auto', function () {
      let addon = new HistorySupportAddon({
        config() {
          return {
            locationType: 'auto',
          };
        },
      });

      expect(addon.shouldAddMiddleware()).to.true;
    });

    it('add middleware when locationType is history', function () {
      let addon = new HistorySupportAddon({
        config() {
          return {
            locationType: 'history',
          };
        },
      });

      expect(addon.shouldAddMiddleware()).to.true;
    });

    it('add middleware when locationType is an unknown type', function () {
      let addon = new HistorySupportAddon({
        config() {
          return {
            locationType: 'foo-bar',
            historySupportMiddleware: true,
          };
        },
      });

      expect(addon.shouldAddMiddleware()).to.true;
    });

    it('add middleware when historySupportMiddleware is true', function () {
      let addon = new HistorySupportAddon({
        config() {
          return {
            historySupportMiddleware: true,
          };
        },
      });

      expect(addon.shouldAddMiddleware()).to.true;
    });

    it('do not add middleware when historySupportMiddleware is false and locationType is history', function () {
      let addon = new HistorySupportAddon({
        config() {
          return {
            locationType: 'history',
            historySupportMiddleware: false,
          };
        },
      });

      expect(addon.shouldAddMiddleware()).to.false;
    });
  });
});
