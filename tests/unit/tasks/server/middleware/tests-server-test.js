'use strict';

const expect = require('chai').expect;
const TestsServerAddon = require('../../../../../lib/tasks/server/middleware/tests-server');
const Promise = require('rsvp').Promise;

describe('TestServerAddon', function() {
  describe('.serverMiddleware', function() {
    let addon, nextWasCalled, mockRequest, app;

    beforeEach(function() {
      addon = new TestsServerAddon();
      nextWasCalled = false;
      mockRequest = {
        method: 'GET',
        path: '',
        url: 'http://example.com',
        headers: {},
      };
      app = {
        use(callback) {
          return callback(mockRequest, null, function() {
            nextWasCalled = true;
          });
        },
      };
    });

    it('invokes next when the watcher succeeds', function(done) {
      addon.serverMiddleware({
        app,
        options: {
          watcher: Promise.resolve(),
        },
        finally() {
          try {
            expect(nextWasCalled).to.true;
            done();
          } catch (e) {
            done(e);
          }
        },
      });
    });

    it('invokes next when the watcher fails', function(done) {
      let mockError = 'bad things are bad';

      addon.serverMiddleware({
        app,
        options: {
          watcher: Promise.reject(mockError),
        },
        finally() {
          try {
            expect(nextWasCalled).to.true;
            done();
          } catch (e) {
            done(e);
          }
        },
      });
    });

    it('allows baseURL containing `+` character', function(done) {
      mockRequest.path = '/braden/+/tests/any-old-file';
      mockRequest.headers.accept = ['*/*'];
      addon.serverMiddleware({
        app,
        options: {
          watcher: Promise.resolve({ directory: 'nothing' }),
          baseURL: '/braden/+',
        },
        finally() {
          try {
            expect(mockRequest.url).to.equal('/braden/+/tests/index.html');
            done();
          } catch (e) {
            done(e);
          }
        },
      });
    });

    it('allows rootURL containing `+` character', function(done) {
      mockRequest.path = '/grayson/+/tests/any-old-file';
      mockRequest.headers.accept = ['text/html'];
      addon.serverMiddleware({
        app,
        options: {
          watcher: Promise.resolve({ directory: 'nothing' }),
          rootURL: '/grayson/+',
        },
        finally() {
          try {
            expect(mockRequest.url).to.equal('/grayson/+/tests/index.html');
            done();
          } catch (e) {
            done(e);
          }
        },
      });
    });
  });
});
