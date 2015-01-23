'use strict';

var expect            = require('chai').expect;
var ExpressServer     = require('../../../../lib/tasks/server/express-server');
var MockUI            = require('../../../helpers/mock-ui');
var MockProject       = require('../../../helpers/mock-project');
var MockWatcher       = require('../../../helpers/mock-watcher');
var MockServerWatcher = require('../../../helpers/mock-server-watcher');
var ProxyServer       = require('../../../helpers/proxy-server');
var request           = require('supertest');
var net               = require('net');
var EOL               = require('os').EOL;
var nock              = require('nock');


describe('express-server', function() {
  var subject, ui, project, proxy, nockProxy;

  beforeEach(function() {
    this.timeout(10000);
    ui = new MockUI();
    project = new MockProject();
    proxy = new ProxyServer();
    subject = new ExpressServer({
      ui: ui,
      project: project,
      watcher: new MockWatcher(),
      serverWatcher: new MockServerWatcher(),
      serverRestartDelayTime: 100,
      serverRoot: './server',
      proxyMiddleware: function() {
        return proxy.handler.bind(proxy);
      },
      environment: 'development'
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
        port: '1337',
        baseURL: '/'
      }).then(function() {
        var output = ui.output.trim().split(EOL);
        expect(output[1]).to.equal('Serving on http://0.0.0.0:1337/');
        expect(output[0]).to.equal('Proxying to http://localhost:3001/');
        expect(output.length).to.equal(2, 'expected only two lines of output');
      });
    });

    it('without proxy', function() {
      return subject.start({
        host:  '0.0.0.0',
        port: '1337',
        baseURL: '/'
      }).then(function() {
        var output = ui.output.trim().split(EOL);
        expect(output[0]).to.equal('Serving on http://0.0.0.0:1337/');
        expect(output.length).to.equal(1, 'expected only one line of output');
      });
    });

    it('with baseURL', function() {
      return subject.start({
        host:  '0.0.0.0',
        port: '1337',
        baseURL: '/foo'
      }).then(function() {
        var output = ui.output.trim().split(EOL);
        expect(output[0]).to.equal('Serving on http://0.0.0.0:1337/foo/');
        expect(output.length).to.equal(1, 'expected only one line of output');
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
          expect(false, 'should have rejected');
        })
        .catch(function(reason) {
          expect(reason).to.equal('Could not serve on http://0.0.0.0:1337. It is either in use or you do not have permission.');
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

      function bypassTest(app, url, done, responseCallback) {
        request(app)
          .get(url)
          .set('accept', 'text/html')
          .end(function(err, response) {
            if (err) {
              return done(err);
            }
            expect(proxy.called).to.equal(false);
            if (responseCallback) { responseCallback(response); }
            done();
          });
      }

      it('bypasses proxy for /', function(done) {
        bypassTest(subject.app, '/', done);
      });

      it('bypasses proxy for files that exist', function(done) {
        bypassTest(subject.app, '/test-file.txt', done, function(response) {
          expect(response.text.trim()).to.equal('some contents');
        });
      });

      function apiTest(app, method, url, done) {
        var req = request(app);
        return req[method].call(req, url)
          .set('accept', 'text/json')
          .end(function(err) {
            if (err) {
              return done(err);
            }

            expect(proxy.called, 'proxy receives the request');
            expect(proxy.lastReq.method).to.equal(method.toUpperCase());
            expect(proxy.lastReq.url).to.equal(url);
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
            expect(proxy.called, 'proxy receives the request');
            done();
          });
      });
    });

    describe('proxy with subdomain', function() {
      beforeEach(function() {
        nockProxy = {
          called: null,
          method: null,
          url: null
        };

        return subject.start({
          proxy: 'http://api.lvh.me',
          host:  '0.0.0.0',
          port: '1337',
          baseURL: '/'
        });
      });

      function apiTest(app, method, url, done) {
        var req = request(app);
        return req[method].call(req, url)
          .set('accept', 'text/json')
          .end(function(err) {
            if (err) {
              return done(err);
            }
            expect(nockProxy.called, 'proxy receives the request');
            expect(nockProxy.method).to.equal(method.toUpperCase());
            expect(nockProxy.url).to.equal(url);
            done();
          });
      }

      it('proxies GET', function(done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            'host': 'api.lvh.me'
          }
        }).get('/api/get')
          .reply(200, function() {
            nockProxy.called = true;
            nockProxy.method = 'GET';
            nockProxy.url = '/api/get';

            return '';
          });

        apiTest(subject.app, 'get', '/api/get', done);
      });
      it('proxies PUT', function(done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            'host': 'api.lvh.me'
          }
        }).put('/api/put')
          .reply(204, function() {
            nockProxy.called = true;
            nockProxy.method = 'PUT';
            nockProxy.url = '/api/put';

            return '';
          });

        apiTest(subject.app, 'put', '/api/put', done);
      });
      it('proxies POST', function(done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            'host': 'api.lvh.me'
          }
        }).post('/api/post')
          .reply(201, function() {
            nockProxy.called = true;
            nockProxy.method = 'POST';
            nockProxy.url = '/api/post';

            return '';
          });

        apiTest(subject.app, 'post', '/api/post', done);
      });
      it('proxies DELETE', function(done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            'host': 'api.lvh.me'
          }
        }).delete('/api/delete')
          .reply(204, function() {
            nockProxy.called = true;
            nockProxy.method = 'DELETE';
            nockProxy.url = '/api/delete';

            return '';
          });

        apiTest(subject.app, 'delete', '/api/delete', done);
      });
      // test for #1263
      it('proxies when accept contains */*', function(done) {
        nock('http://api.lvh.me')
          .get('/api/get')
          .reply(200, function() {
            nockProxy.called = true;
            nockProxy.method = 'GET';
            nockProxy.url = '/api/get';

            return '';
          });

        request(subject.app)
          .get('/api/get')
          .set('accept', 'application/json, */*')
          .end(function(err) {
            if (err) {
              return done(err);
            }
            expect(nockProxy.called, 'proxy receives the request');
            done();
          });
      });
    });

    describe('without proxy', function() {
      function startServer(baseURL) {
        return subject.start({
          host:  '0.0.0.0',
          port: '1337',
          baseURL: baseURL || '/'
        });
      }

      it('serves index.html when file not found with auto/history location', function(done) {
        return startServer()
          .then(function() {
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

      it('GET /tests serves tests/index.html for mime of */* (hash location)', function(done) {
        project._config = {
          baseURL: '/',
          locationType: 'hash'
        };

        return startServer()
          .then(function() {
            request(subject.app)
              .get('/tests')
              .set('accept', '*/*')
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

      it('GET /tests serves tests/index.html for mime of */* (auto location)', function(done) {
        return startServer()
          .then(function() {
            request(subject.app)
              .get('/tests')
              .set('accept', '*/*')
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

      it('serves index.html when file not found (with baseURL) with auto/history location', function(done) {
        return startServer('/foo')
          .then(function() {
            request(subject.app)
              .get('/foo/someurl')
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

      it('returns a 404 when file not found with hash location', function(done) {
        project._config = {
          baseURL: '/',
          locationType: 'hash'
        };

        return startServer()
          .then(function() {
            request(subject.app)
              .get('/someurl.withperiod')
              .set('accept', 'text/html')
              .expect(404)
              .end(done);
          });
      });

      it('files that exist in broccoli directory are served up', function(done) {
        return startServer()
          .then(function() {
            request(subject.app)
            .get('/test-file.txt')
            .end(function(err, response) {
              expect(response.text.trim()).to.equal('some contents');
              done();
            });
          });
      });

      it('serves static asset up from build output without a period in name', function(done) {
        return startServer()
          .then(function() {
            request(subject.app)
              .get('/someurl-without-period')
              .expect(200)
              .end(function(err, response) {
                if (err) {
                  return done(err);
                }

                expect(response.text.trim()).to.equal('some other content');

                done();
              });
          });
      });

      it('serves static asset up from build output without a period in name (with baseURL)', function(done) {
        return startServer('/foo')
          .then(function() {
            request(subject.app)
              .get('/foo/someurl-without-period')
              .expect(200)
              .end(function(err, response) {
                if (err) {
                  return done(err);
                }

                expect(response.text.trim()).to.equal('some other content');

                done();
              });
          });
      });
    });

    describe('addons', function() {
      var calls;
      beforeEach(function() {
        calls = 0;

        subject.processAddonMiddlewares = function() {
          calls++;
        };
      });

      it('calls processAddonMiddlewares upon start', function() {
        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          expect(calls).to.equal(1);
        });
      });
    });

    describe('addon middleware', function() {
      var firstCalls;
      var secondCalls;
      beforeEach(function() {
        firstCalls = 0;
        secondCalls = 0;

        project.initializeAddons = function() { };
        project.addons = [{
            serverMiddleware: function() {
              firstCalls++;
            }
          }, {
            serverMiddleware: function() {
              secondCalls++;
            }
          }, {
            doesntGoBoom: null
          }];

      });

      it('calls serverMiddleware on the addons on start', function() {
        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          expect(firstCalls).to.equal(1);
          expect(secondCalls).to.equal(1);
        });
      });

      it('calls serverMiddleware on the addons on restart', function() {
        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          subject.changedFiles = ['bar.js'];
          return subject.restartHttpServer();
        }).then(function() {
          expect(firstCalls).to.equal(2);
          expect(secondCalls).to.equal(2);
        });
      });
    });

  });
});
