'use strict';

const { expect } = require('chai');
const EOL = require('os').EOL;
const commandOptions = require('../../factories/command-options');
const Task = require('../../../lib/models/task');
const td = require('testdouble');
const { getPortPromise } = require('portfinder');

const ServeCommand = require('../../../lib/commands/serve');

describe('serve command', function () {
  let tasks, options, command;

  beforeEach(function () {
    tasks = {
      Serve: class extends Task {},
    };

    options = commandOptions({
      tasks,
    });

    td.replace(tasks.Serve.prototype, 'run', td.function());

    command = new ServeCommand(options);
  });

  afterEach(function () {
    td.reset();
  });

  it('has correct default options', function () {
    return command.validateAndRun(['--port', '0']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.port).to.be.gte(4200, 'has correct port');
      expect(captor.value.liveReloadPort).to.be.equal(captor.value.port, 'has correct liveReload port');
    });
  });

  it('setting --port without --live-reload-port', function () {
    return getPortPromise().then(function (port) {
      return command.validateAndRun(['--port', `${port}`]).then(function () {
        let captor = td.matchers.captor();
        td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
        expect(captor.value.port).to.equal(port, 'has correct port');
        expect(captor.value.liveReloadPort).to.be.equal(port, 'has correct liveReload port');
      });
    });
  });

  it('setting both --port and --live-reload-port', function () {
    return getPortPromise().then(function (port) {
      return command.validateAndRun(['--port', `${port}`, '--live-reload-port', '8005']).then(function () {
        let captor = td.matchers.captor();
        td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
        expect(captor.value.port).to.equal(port, 'has correct port');
        expect(captor.value.liveReloadPort).to.be.within(8005, 65535, 'has live reload port > port');
      });
    });
  });

  // Allocate opts.port on opts.host if it is available (which we check through getPortPromise)
  let testServer = function (opts, test) {
    let server = require('http').createServer(function () {});
    return getPortPromise({
      ...opts,
      stopPort: opts.port,
    })
      .then(() =>
        new Promise(function (resolve) {
          server.listen(opts.port, opts.host, () => resolve(test()));
        }).finally(() => new Promise((resolve) => server.close(() => resolve())))
      )
      .catch(() => test());
  };

  it('should throw error when -p PORT is taken', function () {
    return testServer({ port: '32773' }, function () {
      return expect(command.validateAndRun(['--port', '32773'])).to.be.rejected.then((err) => {
        td.verify(tasks.Serve.prototype.run(), { ignoreExtraArgs: true, times: 0 });
        expect(err.message).to.contain('is already in use.');
      });
    });
  });

  it('should throw descriptive error when -p PORT is taken and PORT < 1024', function () {
    return testServer({ port: '1000' }, function () {
      return expect(command.validateAndRun(['--port', '1000'])).to.be.rejected.then((err) => {
        td.verify(tasks.Serve.prototype.run(), { ignoreExtraArgs: true, times: 0 });
        expect(err.message).to.contain('you do not have permission');
      });
    });
  });

  it('allows OS to choose port by default', function () {
    return testServer({ port: '4200' }, function () {
      return command.validateAndRun().then(function () {
        let captor = td.matchers.captor();
        td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
        expect(captor.value.port).to.be.within(4201, 65535, 'has correct port');
        expect(captor.value.liveReloadPort).to.be.equal(captor.value.port, 'has correct port');
      });
    });
  });

  it('has correct liveReloadPort', function () {
    return command.validateAndRun(['--port', '0', '--live-reload-port', '4001']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.liveReloadPort).to.be.gte(4001, 'has correct liveReload port');
    });
  });

  it('has correct liveReloadHost', function () {
    return command.validateAndRun(['--port', '0', '--live-reload-host', '127.0.0.1']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.liveReloadHost).to.equal('127.0.0.1', 'has correct liveReload host');
    });
  });

  it('has correct liveReloadBaseUrl', function () {
    return command
      .validateAndRun(['--port', '0', '--live-reload-base-url', 'http://127.0.0.1:4200/'])
      .then(function () {
        let captor = td.matchers.captor();
        td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
        expect(captor.value.liveReloadBaseUrl).to.equal('http://127.0.0.1:4200/', 'has correct liveReload baseUrl');
      });
  });

  it('has correct proxy', function () {
    return command.validateAndRun(['--port', '0', '--proxy', 'http://localhost:3000/']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.proxy).to.equal('http://localhost:3000/', 'has correct port');
    });
  });

  it('has correct secure proxy option', function () {
    return command.validateAndRun(['--port', '0', '--secure-proxy', 'false']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.secureProxy).to.equal(false, 'has correct insecure proxy option');
    });
  });

  it('has correct default value for secure proxy', function () {
    return command.validateAndRun(['--port', '0']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.secureProxy).to.equal(true, 'has correct secure proxy option when not set');
    });
  });

  it('requires proxy URL to include protocol', function () {
    return expect(command.validateAndRun(['--port', '0', '--proxy', 'localhost:3000'])).to.be.rejected.then((error) => {
      expect(error.message).to.equal(
        `You need to include a protocol with the proxy URL.${EOL}Try --proxy http://localhost:3000`
      );
    });
  });

  it('has correct default value for transparent proxy', function () {
    return command.validateAndRun(['--port', '0']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.transparentProxy).to.equal(true, 'has correct transparent proxy option when not set');
    });
  });

  it('host alias does not conflict with help alias', function () {
    return command.validateAndRun(['--port', '0', '-H', 'localhost']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.host).to.equal('localhost', 'has correct hostname');
    });
  });

  it('has correct value for proxy-in-timeout', function () {
    return command.validateAndRun(['--port', '0', '--proxy-in-timeout', '300000']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.proxyInTimeout).to.equal(300000, 'has correct incoming proxy timeout option');
    });
  });

  it('has correct default value for proxy-in-timeout', function () {
    return command.validateAndRun(['--port', '0']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.proxyInTimeout).to.equal(120000, 'has correct incoming proxy timeout option when not set');
    });
  });

  it('has correct value for proxy-out-timeout', function () {
    return command.validateAndRun(['--port', '0', '--proxy-out-timeout', '30000']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.proxyOutTimeout).to.equal(30000, 'has correct outgoing proxy timeout option');
    });
  });

  it('has correct default value for proxy-out-timeout', function () {
    return command.validateAndRun(['--port', '0']).then(function () {
      let captor = td.matchers.captor();
      td.verify(tasks.Serve.prototype.run(captor.capture()), { times: 1 });
      expect(captor.value.proxyOutTimeout).to.equal(0, 'has correct outgoing proxy timeout option when not set');
    });
  });

  it('throws a meaningful error when run outside the project', function () {
    command.project.hasDependencies = function () {
      return false;
    };

    command.project.isEmberCLIProject = function () {
      return false;
    };

    command.isWithinProject = false;

    return expect(command.validateAndRun(['--port', '0'])).to.be.rejected.then((error) => {
      expect(error.message).to.match(/You have to be inside an ember-cli project/);
    });
  });

  it('waits on the serve tasks promise', async function () {
    let serveTaskResolved = false;

    tasks.Serve = class extends Task {
      run() {
        return new Promise((resolve) => {
          setTimeout(() => {
            serveTaskResolved = true;
            resolve();
          }, 10);
        });
      }
    };

    await command.validateAndRun(['--port', '0']);

    expect(serveTaskResolved).to.be.ok;
  });
});
