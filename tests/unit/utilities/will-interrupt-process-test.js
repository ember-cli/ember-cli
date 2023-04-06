'use strict';

let willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
let MockProcess = require('../../helpers/mock-process');
let captureExit;

let td = require('testdouble');
const { expect } = require('chai');

describe('will interrupt process', function () {
  let cb;
  beforeEach(function () {
    captureExit = require('capture-exit');
    cb = td.function();
  });

  afterEach(function () {
    willInterruptProcess.release();
  });

  describe('capture', function () {
    it('throws if already captured', function () {
      const mockProcess = new MockProcess();

      willInterruptProcess.capture(mockProcess);
      try {
        willInterruptProcess.capture(mockProcess);
        expect(true).to.equal(false);
      } catch (e) {
        expect(e.message).to.include('process already captured');
        expect(e.message).to.include('will-interrupt-process-test.js');
      }
    });

    it('throws if the process is not an EventEmitter instance', function () {
      const dissallowedArgs = [null, true, '', [], {}];

      dissallowedArgs.forEach((arg) => {
        try {
          willInterruptProcess.capture(arg);
          expect(true).to.equal(false);
        } catch (e) {
          expect(e.message).to.equal('attempt to capture bad process instance');
        }
      });
    });

    it('sets process maxListeners count', function () {
      const mockProcess = new MockProcess();

      willInterruptProcess.capture(mockProcess);

      expect(mockProcess.getMaxListeners()).to.equal(1000);
    });
  });

  describe('addHandler', function () {
    it('throws if process is not captured', function () {
      try {
        willInterruptProcess.addHandler(() => {});
        expect(true).to.equal(false);
      } catch (e) {
        expect(e.message).to.equal('process is not captured');
      }

      const mockProcess = new MockProcess();

      willInterruptProcess.capture(mockProcess);
      willInterruptProcess.release();
    });

    it('throws if process is released', function () {
      willInterruptProcess.capture(new MockProcess());
      willInterruptProcess.release();

      try {
        willInterruptProcess.addHandler(() => {});
        expect(true).to.equal(false);
      } catch (e) {
        expect(e.message).to.equal('process is not captured');
      }
    });
  });

  describe('capture-exit', function () {
    it('adds exit handler', function () {
      willInterruptProcess.capture(new MockProcess());
      willInterruptProcess.addHandler(cb);

      expect(captureExit.listenerCount()).to.equal(1);
    });

    it('removes exit handler', function () {
      willInterruptProcess.capture(new MockProcess());
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function () {});

      willInterruptProcess.removeHandler(cb);

      expect(captureExit.listenerCount()).to.equal(1);
    });

    it('removes all exit handlers', function () {
      willInterruptProcess.capture(new MockProcess());

      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function () {});

      willInterruptProcess.release();

      expect(captureExit.listenerCount()).to.equal(0);
    });
  });

  describe('process interruption signal listeners', function () {
    let _process;

    beforeEach(function () {
      _process = new MockProcess();
      willInterruptProcess.capture(_process);
    });

    it('sets up interruption signal listeners when the first handler added', function () {
      willInterruptProcess.addHandler(cb);

      expect(_process.getSignalListenerCounts()).to.eql({
        SIGINT: 1,
        SIGTERM: 1,
        message: 1,
      });
    });

    it('sets up interruption signal listeners only once', function () {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function () {});

      expect(_process.getSignalListenerCounts()).to.eql({
        SIGINT: 1,
        SIGTERM: 1,
        message: 1,
      });
    });

    it('cleans up interruption signal listener', function () {
      // will-interrupt-process doesn't have any public API to get actual handlers count
      // so here we make a side test to ensure that we don't add the same callback twice
      willInterruptProcess.addHandler(cb);

      willInterruptProcess.removeHandler(cb);

      expect(_process.getSignalListenerCounts()).to.eql({
        SIGINT: 0,
        SIGTERM: 0,
        message: 0,
      });
    });

    it(`doesn't clean up interruption signal listeners if there are remaining handlers`, function () {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(() => cb());

      willInterruptProcess.removeHandler(cb);

      expect(_process.getSignalListenerCounts()).to.eql({
        SIGINT: 1,
        SIGTERM: 1,
        message: 1,
      });
    });

    it('cleans up all interruption signal listeners', function () {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function () {});
      willInterruptProcess.addHandler(() => cb);

      willInterruptProcess.release();

      expect(_process.getSignalListenerCounts()).to.eql({
        SIGINT: 0,
        SIGTERM: 0,
        message: 0,
      });
    });
  });

  describe('Windows CTRL + C Capture', function () {
    it('exits on CTRL+C when TTY', function () {
      let _process = new MockProcess({
        exit: td.function(),
        platform: 'win',
        stdin: {
          isTTY: true,
        },
      });

      willInterruptProcess.capture(_process);
      willInterruptProcess.addHandler(cb);

      _process.stdin.emit('data', [0x03]);

      td.verify(_process.exit());
    });

    it('adds and reverts rawMode on Windows', function () {
      const _process = new MockProcess({
        platform: 'win',
        stdin: {
          isRaw: false,
          isTTY: true,
        },
      });

      willInterruptProcess.capture(_process);

      willInterruptProcess.addHandler(cb);
      expect(_process.stdin.isRaw).to.equal(true);

      willInterruptProcess.removeHandler(cb);
      expect(_process.stdin.isRaw).to.equal(false);
    });

    it('does not enable raw capture when not a Windows', function () {
      const _process = new MockProcess({
        exit: td.function(),

        stdin: {
          isTTY: true,
          setRawMode: td.function(),
        },
      });

      willInterruptProcess.capture(_process);
      willInterruptProcess.addHandler(cb);

      td.verify(_process.stdin.setRawMode(true), {
        times: 0,
      });

      _process.stdin.emit('data', [0x03]);

      td.verify(_process.exit(), { times: 0 });
    });

    it('does not enable raw capture when not a TTY', function () {
      const _process = new MockProcess({
        exit: td.function(),
        platform: 'win',
        stdin: {
          setRawMode: td.function(),
        },
      });

      willInterruptProcess.capture(_process);
      willInterruptProcess.addHandler(cb);

      td.verify(_process.stdin.setRawMode(true), {
        times: 0,
      });

      _process.stdin.emit('data', [0x03]);

      td.verify(_process.exit(), { times: 0 });
    });
  });
});
