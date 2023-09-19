'use strict';

const { expect } = require('chai');
const ExpressServer = require('../../../../lib/tasks/server/express-server');
const MockUI = require('console-ui/mock');
const MockProject = require('../../../helpers/mock-project');
const MockWatcher = require('../../../helpers/mock-watcher');
const MockServerWatcher = require('../../../helpers/mock-server-watcher');
const ProxyServer = require('../../../helpers/proxy-server');
const chalk = require('chalk');
const request = require('supertest');
const net = require('net');
const EOL = require('os').EOL;
const nock = require('nock');
const express = require('express');
const WebSocket = require('websocket').w3cwebsocket;
const FixturifyProject = require('../../../helpers/fixturify-project');

function checkMiddlewareOptions(options) {
  expect(options).to.satisfy((option) => option.rootURL);
}

function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

describe('express-server: processAppMiddlewares', function () {
  let subject, fixturifyProject;

  nock.enableNetConnect();

  function makeSubject() {
    subject = new ExpressServer({
      ui: new MockUI(),
      project: fixturifyProject.buildProjectModel(),
      watcher: new MockWatcher(),
      serverWatcher: new MockServerWatcher(),
      serverRestartDelayTime: 100,
      serverRoot: './server',
      environment: 'development',
    });
    return subject;
  }

  beforeEach(function () {
    this.timeout(1000);
    fixturifyProject = new FixturifyProject('awesome-proj', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
  });

  afterEach(async function () {
    fixturifyProject.dispose();
    await subject.stopHttpServer().catch(() => {});
  });

  it('has a good error message if a file "server.js" exists, but does not export a function', function () {
    fixturifyProject.addFiles({
      'server.js': 'module.exports = { name: "foo" }',
    });
    let subject = makeSubject();

    expect(() => {
      subject.processAppMiddlewares();
    }).to.throw(TypeError, 'ember-cli expected ./server/index.js to be the entry for your mock or proxy server');
  });

  it('has a good error message if a file "server/index.js" exists, but does not export a function', function () {
    fixturifyProject.addFiles({
      server: {
        'index.js': 'module.exports = { name: "foo" }',
      },
    });

    let subject = makeSubject();
    expect(() => {
      subject.processAppMiddlewares();
    }).to.throw(TypeError, 'ember-cli expected ./server/index.js to be the entry for your mock or proxy server');
  });

  it('returns values returned by server/index.js', function () {
    fixturifyProject.addFiles({
      server: {
        'index.js': 'module.exports = function() {return "foo"}',
      },
    });
    let subject = makeSubject();
    expect(subject.processAppMiddlewares()).to.equal('foo');
  });

  it('returns values returned by server.js', function () {
    fixturifyProject.addFiles({
      'server.js': 'module.exports = function() {return "foo"}',
    });
    let subject = makeSubject();
    expect(subject.processAppMiddlewares()).to.equal('foo');
  });

  it('returns undefined if middleware files does not exists', function () {
    let subject = makeSubject();
    expect(subject.processAppMiddlewares()).to.equal(undefined);
  });

  it('allow non MODULE_NOT_FOUND errors bubbling if issue happens during module initialization', function () {
    fixturifyProject.addFiles({
      server: {
        'index.js': 'throw new Error("OOPS")',
      },
    });
    let subject = makeSubject();
    expect(() => subject.processAppMiddlewares()).to.throw(Error, 'OOPS');
  });
});

describe('express-server', function () {
  let subject, ui, project, proxy, nockProxy;
  nock.enableNetConnect();

  beforeEach(function () {
    this.timeout(10000);
    ui = new MockUI();
    project = new MockProject();
    proxy = new ProxyServer();
    subject = new ExpressServer({
      ui,
      project,
      watcher: new MockWatcher(),
      serverWatcher: new MockServerWatcher(),
      serverRestartDelayTime: 100,
      serverRoot: './server',
      environment: 'development',
    });
  });

  afterEach(async function () {
    await subject
      .stopHttpServer()
      .catch(() => {})
      .then(() => {
        try {
          proxy.httpServer.close();
        } catch (err) {
          /* ignore */
        }
      });
  });

  it('address in use', function () {
    let preexistingServer = net.createServer();
    preexistingServer.listen(1337);

    return subject
      .start({
        host: undefined,
        port: '1337',
      })
      .then(function () {
        expect(false, 'should have rejected').to.be.ok;
      })
      .catch(function (reason) {
        expect(reason.message).to.equal(
          'Could not serve on http://localhost:1337. It is either in use or you do not have permission.'
        );
      })
      .finally(function () {
        preexistingServer.close();
      });
  });

  describe('displayHost', function () {
    it('should use the specified host if specified', function () {
      expect(subject.displayHost('1.2.3.4')).to.equal('1.2.3.4');
    });

    it('should use the use localhost if host is not specified', function () {
      expect(subject.displayHost(undefined)).to.equal('localhost');
    });
  });

  describe('output', function () {
    this.timeout(40000);

    it('address in use', function () {
      let preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      return expect(
        subject.start({
          host: undefined,
          port: '1337',
        })
      )
        .to.be.rejected.then((reason) => {
          expect(reason.message).to.equal(
            'Could not serve on http://localhost:1337. It is either in use or you do not have permission.'
          );
        })
        .finally(function () {
          preexistingServer.close();
        });
    });
  });

  describe('behaviour', function () {
    it('starts with ssl if ssl option is passed', function () {
      return subject
        .start({
          host: 'localhost',
          port: '1337',
          ssl: true,
          sslCert: 'tests/fixtures/ssl/server.crt',
          sslKey: 'tests/fixtures/ssl/server.key',
          rootURL: '/',
        })
        .then(function () {
          return new Promise(function (resolve, reject) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            request('https://localhost:1337', { strictSSL: false })
              .get('/')
              .expect(200, function (err, value) {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
                if (err) {
                  reject(err);
                } else {
                  resolve(value);
                }
              });
          });
        });
    });

    it('app middlewares are processed before the proxy', function (done) {
      let expected = '/foo was hit';

      project.require = function () {
        return function (app) {
          app.use('/foo', function (req, res) {
            res.send(expected);
          });
        };
      };

      subject
        .start({
          proxy: 'http://localhost:3001/',
          host: undefined,
          port: '1337',
          rootURL: '/',
        })
        .then(function () {
          request(subject.app)
            .get('/foo')
            .set('accept', 'application/json, */*')
            .expect((res) => {
              expect(res.text).to.equal(expected);
            })
            .end(function (err) {
              if (err) {
                return done(err);
              }
              expect(proxy.called).to.equal(false);
              done();
            });
        });
    });

    it('works with a regular express app', function (done) {
      let expected = '/foo was hit';

      project.require = function () {
        let app = express();
        app.use('/foo', function (req, res) {
          res.send(expected);
        });
        return app;
      };

      subject
        .start({
          proxy: 'http://localhost:3001/',
          host: undefined,
          port: '1337',
          rootURL: '/',
        })
        .then(function () {
          request(subject.app)
            .get('/foo')
            .set('accept', 'application/json, */*')
            .expect((res) => {
              expect(res.text).to.equal(expected);
            })
            .end(function (err) {
              if (err) {
                return done(err);
              }
              expect(proxy.called).to.equal(false);
              done();
            });
        });
    });

    describe('compression', function () {
      let longText = '<html><head></head><body>';
      for (let i = 0; i < 10000; ++i) {
        longText += 'x';
      }
      longText += '</body></html>';
      it('uses compression by default for long texts', function (done) {
        project.require = function () {
          let app = express();
          app.use('/foo', function (req, res) {
            res.send(longText);
          });
          return app;
        };

        subject
          .start({
            proxy: 'http://localhost:3001/',
            host: undefined,
            port: '1337',
            rootURL: '/',
          })
          .then(function () {
            request(subject.app)
              .get('/foo')
              .expect(function (res) {
                expect(res.text).to.equal(longText);
                expect(res.header['content-encoding']).to.equal('gzip');
              })
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                expect(proxy.called).to.equal(false);
                done();
              });
          });
      });

      it('does not use compression even for long texts when the x-no-compression header is sent in the response', function (done) {
        project.require = function () {
          let app = express();
          app.use('/foo', function (req, res) {
            res.set('x-no-compression', 'true'), res.send(longText);
          });
          return app;
        };

        subject
          .start({
            proxy: 'http://localhost:3001/',
            host: undefined,
            port: '1337',
            rootURL: '/',
          })
          .then(function () {
            request(subject.app)
              .get('/foo')
              .set('accept', 'application/json, */*')
              .expect(function (res) {
                expect(res.text).to.equal(longText);
                expect(res.header['content-encoding']).to.not.exist;
                expect(parseInt(res.header['content-length'], 10)).to.equal(longText.length);
              })
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                expect(proxy.called).to.equal(false);
                done();
              });
          });
      });

      it('does not use compression for server sent events', async function () {
        project.require = function () {
          let app = express();
          app.use('/foo', function (req, res) {
            res.set('Content-Type', 'text/event-stream');
            res.send(longText);
          });
          return app;
        };

        await subject.start({
          proxy: 'http://localhost:3001/',
          host: undefined,
          port: '1337',
          rootURL: '/',
          compression: true,
        });

        await request(subject.app)
          .get('/foo')
          .set('accept', 'application/json, */*')
          .expect(function (res) {
            expect(res.text).to.equal(longText);
            expect(res.header['content-encoding']).to.not.exist;
            expect(parseInt(res.header['content-length'], 10)).to.equal(longText.length);
          });

        expect(proxy.called).to.equal(false);
      });
    });

    describe('with proxy', function () {
      beforeEach(function () {
        return subject.start({
          proxy: 'http://localhost:3001/',
          host: undefined,
          port: '1337',
          rootURL: '/',
          liveReload: true,
        });
      });

      function bypassTest(app, url, done, responseCallback) {
        request(app)
          .get(url)
          .set('accept', 'text/html')
          .end(function (err, response) {
            if (err) {
              return done(err);
            }
            expect(proxy.called).to.equal(false);
            if (responseCallback) {
              responseCallback(response);
            }
            done();
          });
      }

      it('bypasses proxy for /', function (done) {
        bypassTest(subject.app, '/', done);
      });

      it('bypasses proxy for files that exist', function (done) {
        bypassTest(subject.app, '/test-file.txt', done, function (response) {
          expect(response.text.trim()).to.equal('some contents');
        });
      });

      function apiTest(app, method, url, done) {
        let req = request(app);
        return req[method]
          .call(req, url)
          .set('content-length', 0)
          .set('accept', 'text/json')
          .end(function (err) {
            if (err) {
              return done(err);
            }

            expect(proxy.called, 'proxy receives the request').to.equal(true);
            expect(proxy.lastReq.method).to.equal(method.toUpperCase());
            expect(proxy.lastReq.url).to.equal(url);
            done();
          });
      }

      it('proxies GET', function (done) {
        apiTest(subject.app, 'get', '/api/get', done);
      });

      it('proxies PUT', function (done) {
        apiTest(subject.app, 'put', '/api/put', done);
      });

      it('proxies POST', function (done) {
        apiTest(subject.app, 'post', '/api/post', done);
      });

      it('proxies DELETE', function (done) {
        apiTest(subject.app, 'delete', '/api/delete', done);
      });

      it('proxies websockets', function (done) {
        let number = Math.round(Math.random() * 0xffffff);
        let client = new WebSocket('ws://localhost:1337/foo');

        client.onerror = (error) => {
          done(error); // fail the test
        };

        client.onopen = () => {
          client.send(number.toString());

          setTimeout(() => {
            client.close();

            setTimeout(() => {
              expect(proxy.websocketEvents).to.deep.eql(['connect', `message: ${number}`, 'close']);
              done();
            }, 10);
          }, 10);
        };
      });

      // test for #1263
      it('proxies when accept contains */*', function (done) {
        request(subject.app)
          .get('/api/get')
          .set('accept', 'application/json, */*')
          .end(function (err) {
            if (err) {
              return done(err);
            }
            expect(proxy.called, 'proxy receives the request').to.equal(true);
            done();
          });
      });
    });

    describe('proxy with subdomain', function () {
      beforeEach(function () {
        nockProxy = {
          called: null,
          method: null,
          url: null,
        };

        return subject.start({
          proxy: 'http://api.lvh.me',
          host: undefined,
          port: '1337',
          rootURL: '/',
        });
      });

      function apiTest(app, method, url, done) {
        let req = request(app);
        return req[method]
          .call(req, url)
          .set('accept', 'text/json')
          .end(function (err) {
            if (err) {
              return done(err);
            }
            expect(nockProxy.called, 'proxy receives the request').to.equal(true);
            expect(nockProxy.method).to.equal(method.toUpperCase());
            expect(nockProxy.url).to.equal(url);
            done();
          });
      }

      it('proxies GET', function (done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            host: 'api.lvh.me',
          },
        })
          .get('/api/get')
          .reply(200, function () {
            nockProxy.called = true;
            nockProxy.method = 'GET';
            nockProxy.url = '/api/get';

            return '';
          });

        apiTest(subject.app, 'get', '/api/get', done);
      });

      it('proxies PUT', function (done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            host: 'api.lvh.me',
          },
        })
          .put('/api/put')
          .reply(204, function () {
            nockProxy.called = true;
            nockProxy.method = 'PUT';
            nockProxy.url = '/api/put';

            return '';
          });

        apiTest(subject.app, 'put', '/api/put', done);
      });

      it('proxies POST', function (done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            host: 'api.lvh.me',
          },
        })
          .post('/api/post')
          .reply(201, function () {
            nockProxy.called = true;
            nockProxy.method = 'POST';
            nockProxy.url = '/api/post';

            return '';
          });

        apiTest(subject.app, 'post', '/api/post', done);
      });

      it('proxies DELETE', function (done) {
        nock('http://api.lvh.me', {
          reqheaders: {
            host: 'api.lvh.me',
          },
        })
          .delete('/api/delete')
          .reply(204, function () {
            nockProxy.called = true;
            nockProxy.method = 'DELETE';
            nockProxy.url = '/api/delete';

            return '';
          });

        apiTest(subject.app, 'delete', '/api/delete', done);
      });

      // test for #1263
      it('proxies when accept contains */*', function (done) {
        nock('http://api.lvh.me')
          .get('/api/get')
          .reply(200, function () {
            nockProxy.called = true;
            nockProxy.method = 'GET';
            nockProxy.url = '/api/get';

            return '';
          });

        request(subject.app)
          .get('/api/get')
          .set('accept', 'application/json, */*')
          .end(function (err) {
            if (err) {
              return done(err);
            }
            expect(nockProxy.called, 'proxy receives the request').to.equal(true);
            done();
          });
      });
    });

    describe('without proxy', function () {
      function startServer(rootURL) {
        return subject.start({
          environment: 'development',
          host: undefined,
          port: '1337',
          rootURL: rootURL || '/',
        });
      }

      it('serves index.html when file not found with auto/history location', function (done) {
        startServer().then(function () {
          request(subject.app)
            .get('/someurl.withperiod')
            .set('accept', 'text/html')
            .expect(200)
            .expect('Content-Type', /html/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('GET /tests serves tests/index.html for mime of */* (hash location)', function (done) {
        project._config = {
          rootURL: '/',
          locationType: 'hash',
        };

        startServer().then(function () {
          request(subject.app)
            .get('/tests')
            .set('accept', '*/*')
            .expect(200)
            .expect('Content-Type', /html/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('GET /tests serves tests/index.html for mime of */* (auto location)', function (done) {
        startServer().then(function () {
          request(subject.app)
            .get('/tests')
            .set('accept', '*/*')
            .expect(200)
            .expect('Content-Type', /html/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('GET /tests/whatever serves tests/index.html when file not found', function (done) {
        startServer().then(function () {
          request(subject.app)
            .get('/tests/whatever')
            .set('accept', 'text/html')
            .expect(200)
            .expect('Content-Type', /html/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('GET /tests/an-existing-file.tla serves tests/an-existing-file.tla if it is found', function (done) {
        startServer().then(function () {
          request(subject.app)
            .get('/tests/test-file.txt')
            .set('accept', 'text/html')
            .expect(200)
            .expect(/some contents/)
            .expect('Content-Type', /text/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('serves index.html when file not found (with rootURL) with auto/history location', function (done) {
        startServer('/foo').then(function () {
          request(subject.app)
            .get('/foo/someurl')
            .set('accept', 'text/html')
            .expect(200)
            .expect('Content-Type', /html/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('serves index.html when file not found (with rootURL) with auto/history location on root url without trailing slash', function (done) {
        project._config = {
          rootURL: '/foo',
          locationType: 'history',
        };

        startServer('/foo').then(function () {
          request(subject.app)
            .get('/foo')
            .set('accept', 'text/html')
            .expect(200)
            .expect('Content-Type', /html/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('serves index.html when file not found (with rootURL) with custom history location', function (done) {
        project._config = {
          rootURL: '/',
          locationType: 'blahr',
          historySupportMiddleware: true,
        };

        startServer('/foo').then(function () {
          request(subject.app)
            .get('/foo/someurl')
            .set('accept', 'text/html')
            .expect(200)
            .expect('Content-Type', /html/)
            .end(function (err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
      });

      it('returns a 404 when file not found with hash location', function (done) {
        project._config = {
          rootURL: '/',
          locationType: 'hash',
        };

        startServer().then(function () {
          request(subject.app).get('/someurl.withperiod').set('accept', 'text/html').expect(404).end(done);
        });
      });

      it('files that exist in broccoli directory are served up', function (done) {
        startServer().then(function () {
          request(subject.app)
            .get('/test-file.txt')
            .end(function (err, response) {
              expect(response.text.trim()).to.equal('some contents');
              done();
            });
        });
      });

      it('serves static asset up from build output without a period in name', function (done) {
        startServer().then(function () {
          request(subject.app)
            .get('/someurl-without-period')
            .expect(200)
            .end(function (err, response) {
              if (err) {
                return done(err);
              }

              expect(response.body.toString().trim()).to.equal('some other content');

              done();
            });
        });
      });

      it('serves a static wasm file up from build output with correct Content-Type header', function (done) {
        startServer().then(function () {
          request(subject.app)
            .get('/vendor/foo.wasm')
            .expect(200)
            .end(function (err, response) {
              if (err) {
                return done(err);
              }

              expect(response.headers['content-type']).to.equal('application/wasm');

              done();
            });
        });
      });

      it('serves static asset up from build output without a period in name (with rootURL)', function (done) {
        project._config = {
          rootURL: '/foo',
        };

        startServer('/foo').then(function () {
          request(subject.app)
            .get('/foo/someurl-without-period')
            .expect(200)
            .end(function (err, response) {
              if (err) {
                return done(err);
              }

              expect(response.body.toString().trim()).to.equal('some other content');

              done();
            });
        });
      });
    });

    describe('addons', function () {
      let calls;
      beforeEach(function () {
        calls = 0;

        subject.processAddonMiddlewares = function (options) {
          checkMiddlewareOptions(options);
          calls++;
        };
      });

      it('calls processAddonMiddlewares upon start', function () {
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            expect(calls).to.equal(1);
          });
      });
    });

    describe('addon middleware', function () {
      let firstCalls;
      let secondCalls;
      beforeEach(function () {
        firstCalls = 0;
        secondCalls = 0;

        project.initializeAddons = function () {};
        project.addons = [
          {
            serverMiddleware({ options }) {
              checkMiddlewareOptions(options);
              firstCalls++;
            },
          },
          {
            serverMiddleware({ options }) {
              checkMiddlewareOptions(options);
              secondCalls++;
            },
          },
          {
            doesntGoBoom: null,
          },
        ];
      });

      it('calls serverMiddleware on the addons on start', function () {
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            expect(firstCalls).to.equal(1);
            expect(secondCalls).to.equal(1);
          });
      });

      it('calls serverMiddleware on the addons on restart', function () {
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            subject.changedFiles = ['bar.js'];
            return subject.restartHttpServer();
          })
          .then(function () {
            expect(firstCalls).to.equal(2);
            expect(secondCalls).to.equal(2);
          });
      });
    });

    describe('addon middleware is async', function () {
      let order = [];
      beforeEach(function () {
        project.initializeAddons = function () {};
        project.addons = [
          {
            serverMiddleware() {
              order.push('first');
            },
          },
          {
            serverMiddleware() {
              return new Promise(function (resolve) {
                setTimeout(function () {
                  order.push('second');
                  resolve();
                }, 50);
              });
            },
          },
          {
            serverMiddleware() {
              order.push('third');
            },
          },
        ];
      });

      it('waits for async middleware to complete before the next middleware', function () {
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            expect(order[0]).to.equal('first');
            expect(order[1]).to.equal('second');
            expect(order[2]).to.equal('third');
          });
      });
    });

    describe('addon middleware bubble errors', function () {
      beforeEach(function () {
        project.initializeAddons = function () {};
        project.addons = [
          {
            serverMiddleware() {
              return Promise.reject('addon middleware fail');
            },
          },
        ];
      });
      it('up to server start', function () {
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .catch(function (reason) {
            expect(reason).to.equal('addon middleware fail');
          });
      });
    });

    describe('app middleware', function () {
      let passedOptions;
      let calls;

      beforeEach(function () {
        passedOptions = null;
        calls = 0;

        subject.processAppMiddlewares = function (options) {
          passedOptions = options;
          calls++;
        };
      });

      it('calls processAppMiddlewares upon start', function () {
        let realOptions = {
          rootURL: '/',
          host: undefined,
          port: '1337',
        };

        return subject.start(realOptions).then(function () {
          expect(passedOptions).to.deep.equal(realOptions);
          expect(calls).to.equal(1);
        });
      });

      it('calls processAppMiddlewares upon restart', function () {
        let realOptions = {
          rootURL: '/',
          host: undefined,
          port: '1337',
        };

        let originalApp;

        return subject
          .start(realOptions)
          .then(function () {
            originalApp = subject.app;
            subject.changedFiles = ['bar.js'];
            return subject.restartHttpServer();
          })
          .then(function () {
            expect(subject.app).to.be.ok;
            expect(originalApp).to.not.equal(subject.app);
            expect(passedOptions).to.deep.equal(realOptions);
            expect(calls).to.equal(2);
          });
      });

      it('includes httpServer instance in options', function () {
        let passedOptions;

        subject.processAppMiddlewares = function (options) {
          passedOptions = options;
        };

        let realOptions = {
          host: undefined,
          port: '1337',
        };

        return subject.start(realOptions).then(function () {
          expect(!!passedOptions.httpServer.listen).to.be.ok;
        });
      });
    });

    describe('serverWatcherDidChange', function () {
      it('is called on file change', function () {
        let calls = 0;
        subject.serverWatcherDidChange = function () {
          calls++;
        };

        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            subject.serverWatcher.emit('change', 'foo.txt');
            expect(calls).to.equal(1);
          });
      });

      it('schedules a server restart', function () {
        let calls = 0;
        subject.scheduleServerRestart = function () {
          calls++;
        };

        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            subject.serverWatcher.emit('change', 'foo.txt');
            subject.serverWatcher.emit('change', 'bar.txt');
            expect(calls).to.equal(2);
          });
      });
    });

    describe('scheduleServerRestart', function () {
      it('schedules exactly one call of restartHttpServer', async function () {
        let calls = 0;

        subject.restartHttpServer = function () {
          calls++;
        };

        subject.scheduleServerRestart();
        // scheduleServerRestart is debounced and only ran after 100ms,
        // restartHttpServer shouldn't be called yet
        expect(calls).to.equal(0);

        await sleep(50);

        // after a 50ms wait, we still haven't called restartHttpServer since
        // we are still within our 100ms debounce time.
        expect(calls).to.equal(0);
        subject.scheduleServerRestart();

        await sleep(175);

        // finally, after 175ms we have finally called restartHttpServer, but
        // importantly only called it once (all of the other
        // `subject.scheduleServerRestart()` calls were within the debounce
        // window)
        expect(calls).to.equal(1);
      });
    });

    describe('restartHttpServer', function () {
      it('restarts the server', function () {
        let originalHttpServer;
        let originalApp;
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            ui.output = '';
            originalHttpServer = subject.httpServer;
            originalApp = subject.app;
            subject.changedFiles = ['bar.js'];
            return subject.restartHttpServer();
          })
          .then(function () {
            expect(ui.output).to.contains(EOL + chalk.green('Server restarted.') + EOL + EOL);
            expect(subject.httpServer, 'HTTP server exists').to.be.ok;
            expect(subject.httpServer).to.not.equal(originalHttpServer, 'HTTP server has changed');
            expect(!!subject.app).to.equal(true, 'App exists');
            expect(subject.app).to.not.equal(originalApp, 'App has changed');
          });
      });

      it('restarts the server again if one or more files change during a previous restart', function () {
        let originalHttpServer;
        let originalApp;
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            originalHttpServer = subject.httpServer;
            originalApp = subject.app;
            subject.serverRestartPromise = new Promise(function (resolve) {
              setTimeout(function () {
                subject.serverRestartPromise = null;
                resolve();
              }, 20);
            });
            subject.changedFiles = ['bar.js'];
            return subject.restartHttpServer();
          })
          .then(function () {
            expect(!!subject.httpServer).to.equal(true, 'HTTP server exists');
            expect(subject.httpServer).to.not.equal(originalHttpServer, 'HTTP server has changed');
            expect(!!subject.app).to.equal(true, 'App exists');
            expect(subject.app).to.not.equal(originalApp, 'App has changed');
          });
      });

      it('emits the restart event', function () {
        let calls = 0;
        subject.on('restart', function () {
          calls++;
        });
        return subject
          .start({
            host: undefined,
            port: '1337',
          })
          .then(function () {
            subject.changedFiles = ['bar.js'];
            return subject.restartHttpServer();
          })
          .then(function () {
            expect(calls).to.equal(1);
          });
      });
    });
  });
});
