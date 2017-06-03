'use strict';

let willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
let captureExit;

let td = require('testdouble');
let chai = require('../../chai');
let expect = chai.expect;
let EventEmitter = require('events');

class MockProcess extends EventEmitter {
  constructor(options) {
    super();

    options = options || {};

    const stdin = Object.assign(new EventEmitter(), {
      isRaw: false,
      setRawMode: td.function(),
    }, options.stdin || {});

    const topLevelProps = Object.assign({
      platform: 'MockOS',
      exit: td.function(),
    }, options);

    Object.assign(this, topLevelProps, { stdin });
  }

  getSignalListenerCounts() {
    return {
      SIGINT: this.listenerCount('SIGINT'),
      SIGTERM: this.listenerCount('SIGTERM'),
      message: this.listenerCount('message'),
    };
  }
}

describe('will interrupt process', function() {
  let cb;
  beforeEach(function() {
    captureExit = require('capture-exit');
    cb = td.function();
  });

  afterEach(function() {
    willInterruptProcess.teardown();
    willInterruptProcess.free();
  });

  describe('capture-exit', function() {
    it('adds exit handler', function() {
      willInterruptProcess.capture();
      willInterruptProcess.addHandler(cb);

      expect(captureExit.listenerCount()).to.equal(1);
    });

    it('removes exit handler', function() {
      willInterruptProcess.capture();
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});

      willInterruptProcess.removeHandler(cb);

      expect(captureExit.listenerCount()).to.equal(1);
    });

    it('removes all exit handlers', function() {
      willInterruptProcess.capture();

      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});

      willInterruptProcess.teardown();

      expect(captureExit.listenerCount()).to.equal(0);
    });
  });

  describe('process interruption signal listeners', function() {
    let process;

    beforeEach(function() {
      process = new MockProcess();
      willInterruptProcess.capture(process);
    });

    it('sets up interruption signal listeners when the first handler added', function() {
      willInterruptProcess.addHandler(cb);

      expect(process.getSignalListenerCounts()).to.eql({
        SIGINT: 1,
        SIGTERM: 1,
        message: 1,
      });
    });

    it('sets up interruption signal listeners only once', function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});

      expect(process.getSignalListenerCounts()).to.eql({
        SIGINT: 1,
        SIGTERM: 1,
        message: 1,
      });
    });

    it('cleans up interruption signal listener', function() {
      // will-interrupt-process doesn't have any public API to get actual handlers count
      // so here we make a side test to ensure that we don't add the same callback twice
      willInterruptProcess.addHandler(cb);

      willInterruptProcess.removeHandler(cb);

      expect(process.getSignalListenerCounts()).to.eql({
        SIGINT: 0,
        SIGTERM: 0,
        message: 0,
      });
    });

    it(`doesn't clean up interruption signal listeners if there are remaining handlers`, function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(() => cb());

      willInterruptProcess.removeHandler(cb);

      expect(process.getSignalListenerCounts()).to.eql({
        SIGINT: 1,
        SIGTERM: 1,
        message: 1,
      });
    });

    it('cleans up all interruption signal listeners', function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});
      willInterruptProcess.addHandler(() => cb);

      willInterruptProcess.teardown();

      expect(process.getSignalListenerCounts()).to.eql({
        SIGINT: 0,
        SIGTERM: 0,
        message: 0,
      });
    });
  });

  describe('Windows CTRL + C Capture', function() {
    it('exits on CTRL+C when TTY', function() {
      let process = new MockProcess({
        platform: 'win',
        stdin: {
          isTTY: true,
        },
      });

      willInterruptProcess.capture(process);
      willInterruptProcess.addHandler(cb);

      process.stdin.emit('data', [0x03]);

      td.verify(process.exit());
    });

    it('adds and reverts rawMode on Windows', function() {
      const process = new MockProcess({
        platform: 'win',
        stdin: {
          isTTY: true,
        },
      });

      willInterruptProcess.capture(process);
      willInterruptProcess.addHandler(cb);
      td.verify(process.stdin.setRawMode(true));

      willInterruptProcess.removeHandler(cb);
      td.verify(process.stdin.setRawMode(false));

      td.verify(process.stdin.setRawMode(), {
        ignoreExtraArgs: true,
        times: 2,
      });
    });

    it('does not enable raw capture when not a Windows', function() {
      const process = new MockProcess({
        stdin: {
          isTTY: true,
        },
      });

      willInterruptProcess.capture(process);
      willInterruptProcess.addHandler(cb);

      td.verify(process.stdin.setRawMode(true), {
        times: 0,
      });

      process.stdin.emit('data', [0x03]);

      td.verify(process.exit(), { times: 0 });
    });

    it('does not enable raw capture when not a TTY', function() {
      const process = new MockProcess({
        platform: 'win',
      });

      willInterruptProcess.capture(process);
      willInterruptProcess.addHandler(cb);

      td.verify(process.stdin.setRawMode(true), {
        times: 0,
      });

      process.stdin.emit('data', [0x03]);

      td.verify(process.exit(), { times: 0 });
    });
  });
});
