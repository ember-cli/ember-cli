'use strict';

var expect            = require('chai').expect;
var TestsServerAddon  = require('../../../../../lib/tasks/server/middleware/tests-server');
var Promise           = require('../../../../../lib/ext/promise');

describe('TestServerAddon', function () {
  describe('.serverMiddleware', function () {
    var addon, nextWasCalled, mockRequest, app;

    beforeEach(function() {
      addon = new TestsServerAddon();
      nextWasCalled = false;
      mockRequest = {
        method: 'GET',
        path: '',
        url: 'http://example.com',
        headers: {}
      };
      app = {
        use: function (callback) {
          return callback(mockRequest, null, function () { nextWasCalled = true; });
        }
      };
    });

    it('invokes next when the watcher succeeds', function(done) {
      addon.serverMiddleware({
        app: app,
        options: {
          watcher: Promise.resolve()
        },
        finally: function() {
          try {
            expect(nextWasCalled).to.true;
            done();
          } catch (e) {
            done(e);
          }
        }
      });
    });

    it('invokes next when the watcher fails', function(done) {
      var mockError = 'bad things are bad';

      addon.serverMiddleware({
        app: app,
        options: {
          watcher: Promise.reject(mockError)
        },
        finally: function() {
          try {
            expect(nextWasCalled).to.true;
            done();
          } catch (e) {
            done(e);
          }
        }
      });
    });

    it('allows baseURL containing `+` character', function(done) {
      mockRequest.path = '/braden/+/tests/any-old-file';
      mockRequest.headers.accept = ['*/*'];
      addon.serverMiddleware({
        app: app,
        options: {
          watcher: Promise.resolve({ directory: 'nothing' }),
          baseURL: '/braden/+'
        },
        finally: function() {
          try {
            expect(mockRequest.url).to.equal('/braden/+/tests/index.html');
            done();
          } catch (e) {
            done(e);
          }
        }
      });
    });

    it('allows rootURL containing `+` character', function(done) {
      mockRequest.path = '/grayson/+/tests/any-old-file';
      mockRequest.headers.accept = ['text/html'];
      addon.serverMiddleware({
        app: app,
        options: {
          watcher: Promise.resolve({directory: 'nothing'}),
          rootURL: '/grayson/+'
        },
        finally: function () {
          try {
            expect(mockRequest.url).to.equal('/grayson/+/tests/index.html');
            done();
          } catch (e) {
            done(e);
          }
        }
      });
    });
  });
});
