'use strict';

var expect         = require('chai').expect;
var EOL            = require('os').EOL;
var stub           = require('../../helpers/stub');
var commandOptions = require('../../factories/command-options');
var Task           = require('../../../lib/models/task');
var Promise        = require('../../../lib/ext/promise');
var PortFinder     = require('portfinder');

PortFinder.basePort = 32768;

var safeRestore = stub.safeRestore;
stub = stub.stub;

var ServeCommand = require('../../../lib/commands/serve');

describe('serve command', function() {
  var tasks, options, command;

  beforeEach(function() {
    tasks = {
      Serve: Task.extend()
    };

    options = commandOptions({
      tasks: tasks
    });

    stub(tasks.Serve.prototype, 'run');

    command = new ServeCommand(options);
  });

  afterEach(function() {
    safeRestore(tasks.Serve.prototype, 'run');
  });

  it('has correct default options', function() {
    return command.validateAndRun([
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var runOps = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(runOps.port).to.be.gte(4000, 'has correct port');
      expect(runOps.liveReloadPort).to.be.within(32768, 65535, 'has correct liveReload port');
    });
  });

  it('setting --port without --live-reload-port', function() {
    return command.validateAndRun([
      '--port', '4000'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var runOps = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');

      expect(runOps.port).to.be.gte(4000, 'has port >= than chosen port');
      expect(runOps.liveReloadPort).to.be.within(32768, 65535, 'has live reload port > port');
    });
  });

  it('setting both --port and --live-reload-port', function() {
    return command.validateAndRun([
      '--port', '4000',
      '--live-reload-port', '8005'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var runOps = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');

      expect(runOps.port).to.be.gte(4000, 'has correct port');
      expect(runOps.liveReloadPort).to.be.within(8005, 65535, 'has live reload port > port');
    });
  });

  if (process.platform !== 'win32') {
    // This test fails on appveyor for an unknown reason. See last few comments
    // on PR https://github.com/ember-cli/ember-cli/pull/5391
    //
    // Works correctly on Travis and has been left for context as it does test
    // a valid code path.
    it('should throw error when -p PORT is taken', function() {
      function testServer(opts, test) {
        var server = require('http').createServer(function() {});
        return new Promise(function(resolve) {
          server.listen(opts.port, opts.host, function() {
            resolve(test(opts, server));
          });
        }).finally(function() {
          return new Promise(function(resolve) {
            server.close(function() { resolve(); });
          });
        });
      }

      return testServer({ port: '32773' }, function() {
        return command.validateAndRun([
          '--port', '32773'
        ])
        .then(function() {
          expect(true).to.equal(false, 'assertion should never run');
        })
        .catch(function(err) {
          var serveRun = tasks.Serve.prototype.run;
          expect(serveRun.called).to.equal(0, 'expected run to never be called');
          expect(err.message).to.contain('is already in use.');
        });
      });
    });
  }

  it('allows OS to choose port', function() {
    return command.validateAndRun([
      '--port', '0'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var runOps = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(runOps.port).to.be.within(32768, 65535, 'has correct liveReloadPort');
      expect(runOps.liveReloadPort).to.be.gt(runOps.port, 'has a liveReload port greater than port');
    });
  });

  it('has correct liveLoadPort', function() {
    return command.validateAndRun([
      '--live-reload-port', '4001'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(ops.liveReloadPort).to.be.gte(4001, 'has correct liveReload port');
    });
  });

  it('has correct liveReloadLoadHost', function() {
    return command.validateAndRun([
      '--live-reload-host', '127.0.0.1'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var runOps = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(runOps.liveReloadHost).to.equal('127.0.0.1', 'has correct liveReload host');
    });
  });

  it('has correct liveLoadBaseUrl', function() {
    return command.validateAndRun([
      '--live-reload-base-url', 'http://127.0.0.1:4200/'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');

      expect(ops.liveReloadBaseUrl).to.equal('http://127.0.0.1:4200/', 'has correct liveReload baseUrl');
    });
  });

  it('has correct proxy', function() {
    return command.validateAndRun([
      '--proxy', 'http://localhost:3000/'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(ops.proxy).to.equal('http://localhost:3000/', 'has correct port');
    });
  });

  it('has correct insecure proxy option', function() {
    return command.validateAndRun([
      '--insecure-proxy'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(ops.insecureProxy).to.equal(true, 'has correct insecure proxy option');
    });
  });

  it('has correct default value for insecure proxy', function() {
    return command.validateAndRun().then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(ops.insecureProxy).to.equal(false, 'has correct insecure proxy option when not set');
    });
  });

  it('requires proxy URL to include protocol', function() {
    return command.validateAndRun([
      '--proxy', 'localhost:3000'
    ]).then(function() {
      expect(false, 'it rejects when proxy URL doesn\'t include protocol').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal(
        'You need to include a protocol with the proxy URL.' + EOL + 'Try --proxy http://localhost:3000'
      );
    });
  });

  it('uses baseURL of correct environment', function() {
    options.project.config = function(env) {
      return { baseURL: env };
    };

    return command.validateAndRun([
      '--environment', 'test'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      expect(ops.baseURL).to.equal('test', 'Uses the correct environment.');
    });
  });

  it('host alias does not conflict with help alias', function() {
    return command.validateAndRun([
      '-H', 'localhost'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      expect(serveRun.called).to.equal(1, 'expected run to be called once');
      expect(ops.host).to.equal('localhost', 'has correct hostname');
    });
  });
});
