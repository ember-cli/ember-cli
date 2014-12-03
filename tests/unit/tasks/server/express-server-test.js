'use strict';

var assert            = require('../../../helpers/assert');
var ExpressServer     = require('../../../../lib/tasks/server/express-server');
var Promise           = require('../../../../lib/ext/promise');
var MockUI            = require('../../../helpers/mock-ui');
var MockProject       = require('../../../helpers/mock-project');
var MockWatcher       = require('../../../helpers/mock-watcher');
var MockServerWatcher = require('../../../helpers/mock-server-watcher');
var ProxyServer       = require('../../../helpers/proxy-server');
var chalk             = require('chalk');
var request           = require('supertest');
var net               = require('net');
var EOL               = require('os').EOL;
var nock              = require('nock');


describe('express-server', function() {
  var subject, ui, project, proxy, nockProxy;

  beforeEach(function() {
    ui = new MockUI();
    project = new MockProject();
    proxy = new ProxyServer();
    subject = new ExpressServer({
      ui: ui,
      project: project,
      watcher: new MockWatcher(),
      serverWatcher: new MockServerWatcher(),
      serverRestartDelayTime: 5,
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

  describe('processAppMiddlewares', function() {
    it('has a good error message if a file exists, but does not export a function', function() {
      subject.project = {
        has:     function() { return true; },
        require: function() { return {};   }
      };

      assert.throws(function() {
        subject.processAppMiddlewares();
      }, TypeError, 'ember-cli expected ./server/index.js to be the entry for your mock or proxy server');
    });
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
        assert.deepEqual(output[1], 'Serving on http://0.0.0.0:1337/');
        assert.deepEqual(output[0], 'Proxying to http://localhost:3001/');
        assert.deepEqual(output.length, 2, 'expected only two lines of output');
      });
    });

    it('without proxy', function() {
      return subject.start({
        host:  '0.0.0.0',
        port: '1337',
        baseURL: '/'
      }).then(function() {
        var output = ui.output.trim().split(EOL);
        assert.deepEqual(output[0], 'Serving on http://0.0.0.0:1337/');
        assert.deepEqual(output.length, 1, 'expected only one line of output');
      });
    });

    it('with baseURL', function() {
      return subject.start({
        host:  '0.0.0.0',
        port: '1337',
        baseURL: '/foo'
      }).then(function() {
        var output = ui.output.trim().split(EOL);
        assert.deepEqual(output[0], 'Serving on http://0.0.0.0:1337/foo/');
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
    it('app middlewares are processed before the proxy', function(done) {
      var expected = '/foo was hit';

      project.require = function() {
        return function(app) {
          app.use('/foo', function(req,res) {
            res.send(expected);
          });
        };
      };

      subject.start({
        proxy: 'http://localhost:3001/',
        host:  '0.0.0.0',
        port: '1337',
        baseURL: '/'
      })
        .then(function() {
          request(subject.app)
            .get('/foo')
            .set('accept', 'application/json, */*')
            .expect(function(res) {
              assert.equal(res.text, expected);
            })
            .end(function(err) {
              if (err) {
                return done(err);
              }
              assert(!proxy.called);
              done();
            });
        });
    });

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
            assert(!proxy.called);
            if (responseCallback) { responseCallback(response); }
            done();
          });
      }

      it('bypasses proxy for /', function(done) {
        bypassTest(subject.app, '/', done);
      });

      it('bypasses proxy for files that exist', function(done) {
        bypassTest(subject.app, '/test-file.txt', done, function(response) {
          assert.equal(response.text.trim(), 'some contents');
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
            assert(nockProxy.called, 'proxy receives the request');
            assert.equal(nockProxy.method, method.toUpperCase());
            assert.equal(nockProxy.url, url);
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
            assert(nockProxy.called, 'proxy receives the request');
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
              assert.equal(response.text.trim(), 'some contents');
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

                assert.equal(response.text.trim(), 'some other content');

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

                assert.equal(response.text.trim(), 'some other content');

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
          assert.equal(calls, 1);
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
          assert.equal(firstCalls, 1);
          assert.equal(secondCalls, 1);
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
          assert.equal(firstCalls, 2);
          assert.equal(secondCalls, 2);
        });
      });
    });

    describe('app middleware', function() {
      var passedOptions;
      var calls;

      beforeEach(function() {
        passedOptions = null;
        calls = 0;

        subject.processAppMiddlewares = function(options) {
          passedOptions = options;
          calls++;
        };
      });

      it('calls processAppMiddlewares upon start', function() {
        var realOptions = {
          host:  '0.0.0.0',
          port: '1337'
        };

        return subject.start(realOptions).then(function() {
          assert(passedOptions === realOptions);
          assert.equal(calls, 1);
        });
      });

      it('calls processAppMiddlewares upon restart', function() {
        var realOptions = {
          host:  '0.0.0.0',
          port: '1337'
        };

        var originalApp;

        return subject.start(realOptions)
          .then(function() {
            originalApp = subject.app;
            subject.changedFiles = ['bar.js'];
            return subject.restartHttpServer();
          })
          .then(function() {
            assert(subject.app);
            assert.notEqual(originalApp, subject.app);
            assert(passedOptions === realOptions);
            assert.equal(calls, 2);
          });
      });

      it('includes httpServer instance in options', function() {
        var passedOptions;

        subject.processAppMiddlewares = function(options) {
          passedOptions = options;
        };

        var realOptions = {
          host:  '0.0.0.0',
          port: '1337'
        };

        return subject.start(realOptions).then(function() {
          assert(!!passedOptions.httpServer.listen);
        });
      });
    });

    describe('serverWatcherDidChange', function() {
      it('is called on file change', function() {
        var calls = 0;
        subject.serverWatcherDidChange = function() {
          calls++;
        };

        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          subject.serverWatcher.emit('change', 'foo.txt');
          assert.equal(calls, 1);
        });
      });

      it('schedules a server restart', function() {
        var calls = 0;
        subject.scheduleServerRestart = function() {
          calls++;
        };

        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          subject.serverWatcher.emit('change', 'foo.txt');
          subject.serverWatcher.emit('change', 'bar.txt');
          assert.equal(calls, 2);
        });
      });
    });

    describe('scheduleServerRestart', function() {
      it('schedules exactly one call of restartHttpServer', function(done) {
        var calls = 0;
        subject.restartHttpServer = function() {
          calls++;
        };

        subject.serverRestartDelayTime = 10;
        subject.scheduleServerRestart();
        assert.equal(calls, 0);
        setTimeout(function() {
          assert.equal(calls, 0);
          subject.scheduleServerRestart();
        }, 4);
        setTimeout(function() {
          assert.equal(calls, 1);
          done();
        }, 15);
      });
    });

    describe('restartHttpServer', function() {
      it('restarts the server', function() {
        var originalHttpServer;
        var originalApp;
        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          ui.output = '';
          originalHttpServer = subject.httpServer;
          originalApp = subject.app;
          subject.changedFiles = ['bar.js'];
          return subject.restartHttpServer();
        }).then(function() {
          assert.equal(ui.output, EOL + chalk.green('Server restarted.') + EOL + EOL);
          assert(subject.httpServer, 'HTTP server exists');
          assert.notEqual(subject.httpServer, originalHttpServer, 'HTTP server has changed');
          assert(subject.app, 'App exists');
          assert.notEqual(subject.app, originalApp, 'App has changed');
        });
      });

      it('restarts the server again if one or more files change during a previous restart', function() {
        var originalHttpServer;
        var originalApp;
        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          originalHttpServer = subject.httpServer;
          originalApp = subject.app;
          subject.serverRestartPromise = new Promise(function(resolve) {
            setTimeout(function () {
              subject.serverRestartPromise = null;
              resolve();
            }, 20);
          });
          subject.changedFiles = ['bar.js'];
          return subject.restartHttpServer();
        }).then(function() {
          assert(subject.httpServer, 'HTTP server exists');
          assert.notEqual(subject.httpServer, originalHttpServer, 'HTTP server has changed');
          assert(subject.app, 'App exists');
          assert.notEqual(subject.app, originalApp, 'App has changed');
        });
      });

      it('emits the restart event', function() {
        var calls = 0;
        subject.on('restart', function() {
          calls++;
        });
        return subject.start({
          host:  '0.0.0.0',
          port: '1337'
        }).then(function() {
          subject.changedFiles = ['bar.js'];
          return subject.restartHttpServer();
        }).then(function() {
          assert.equal(calls, 1);
        });
      });
    });
  });
});
