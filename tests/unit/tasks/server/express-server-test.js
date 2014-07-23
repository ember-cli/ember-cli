'use strict';

var assert        = require('../../../helpers/assert');
var ExpressServer = require('../../../../lib/tasks/server/express-server');
var MockUI        = require('../../../helpers/mock-ui');
var MockProject   = require('../../../helpers/mock-project');
var MockWatcher   = require('../../../helpers/mock-watcher');
var ProxyServer   = require('../../../helpers/proxy-server');
var request       = require('supertest');
var net           = require('net');

describe('express-server', function() {
  var subject, ui, project, proxy;

  beforeEach(function() {
    ui = new MockUI();
    project = new MockProject();
    proxy = new ProxyServer();
    subject = new ExpressServer({
      ui: ui,
      project: project,
      watcher: new MockWatcher(),
      proxyMiddleware: function() {
        return proxy.handler.bind(proxy);
      }
    });
  });

  afterEach(function() {
    try {
      subject.httpServer.close();
    } catch(err) { }
    try {
      proxy.httpServer.close();
    } catch(err) { }
  });

  describe('output', function() {
    it('with proxy', function() {
      return subject.start({
        proxy: 'http://localhost:3001/',
        host:  '0.0.0.0',
        port: '1337'
      }).then(function() {
        var output = ui.output.trim().split('\n');
        assert.deepEqual(output[1], 'Serving on http://0.0.0.0:1337');
        assert.deepEqual(output[0], 'Proxying to http://localhost:3001/');
        assert.deepEqual(output.length, 2, 'expected only two lines of output');
      });
    });

    it('without proxy', function() {
      return subject.start({
        host:  '0.0.0.0',
        port: '1337'
      }).then(function() {
        var output = ui.output.trim().split('\n');
        assert.deepEqual(output[0], 'Serving on http://0.0.0.0:1337');
        assert.deepEqual(output.length, 1, 'expected only one line of output');
      });
    });

    it('address in use', function(done) {
      var preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        })
        .then(function() {
          assert(false, 'should have rejected');
        })
        .catch(function(reason) {
          assert.equal(reason, 'Could not serve on http://0.0.0.0:1337. It is either in use or you do not have permission.');
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });
  });

  describe('behaviour', function() {
    describe('with proxy', function() {
      beforeEach(function() {
        return subject.start({
          proxy: 'http://localhost:3001/',
          host:  '0.0.0.0',
          port: '1337',
          baseURL: '/'
        });
      });

      function bypassTest(app, url, done) {
        request(app)
          .get(url)
          .set('accept', 'text/html')
          .end(function(err) {
            if (err) {
              return done(err);
            }
            assert(!proxy.called);
            done();
          });
      }
      it('bypasses proxy for /', function(done) {
        bypassTest(subject.app, '/', done);
      });
      it('bypasses proxy for files that exist', function(done) {
        bypassTest(subject.app, '/test-file.txt', done);
      });
      function apiTest(app, method, url, done) {
        var req = request(app);
        return req[method].call(req, url)
          .set('accept', 'text/json')
          .end(function(err) {
            if (err) {
              return done(err);
            }
            assert(proxy.called, 'proxy receives the request');
            assert.equal(proxy.lastReq.method, method.toUpperCase());
            assert.equal(proxy.lastReq.url, url);
            done();
          });
      }
      it('proxies GET', function(done) {
        apiTest(subject.app, 'get', '/api/get', done);
      });
      it('proxies PUT', function(done) {
        apiTest(subject.app, 'put', '/api/put', done);
      });
      it('proxies POST', function(done) {
        apiTest(subject.app, 'post', '/api/post', done);
      });
      it('proxies DELETE', function(done) {
        apiTest(subject.app, 'delete', '/api/delete', done);
      });
      // test for #1263
      it('proxies when accept contains */*', function(done) {
        request(subject.app)
          .get('/api/get')
          .set('accept', 'application/json, */*')
          .end(function(err) {
            if (err) {
              return done(err);
            }
            assert(proxy.called, 'proxy receives the request');
            done();
          });
      });
    });

    describe('without proxy', function() {
      beforeEach(function() {
        return subject.start({
          host:  '0.0.0.0',
          port: '1337',
          baseURL: '/'
        });
      });

      it('serves index.html when period in name', function(done) {
        request(subject.app)
          .get('/someurl.withperiod')
          .set('accept', 'text/html')
          .expect(200)
          .expect('Content-Type', /html/)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    describe('addons', function() {
      it('calls processAddonMiddlewares upon start', function() {
        var called = false;

        subject.processAddonMiddlewares = function() {
          called = true;
        };

        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          assert(called);
        });
      });

      it('calls serverMiddleware on the addons', function() {
        var firstCalled  = false;
        var secondCalled = false;

        project.initializeAddons = function() { };
        project.addons = [{
            serverMiddleware: function() {
              firstCalled = true;
            }
          }, {
            serverMiddleware: function() {
              secondCalled = true;
            }
          }, {
            doesntGoBoom: null
          }];

        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          assert(firstCalled);
          assert(secondCalled);
        });
      });
    });
  });
});
