'use strict';

let willInterruptProcess;
let captureExit;

let td = require('testdouble');
let chai = require('../../chai');
let expect = chai.expect;
let EventEmitter = require('events');

function getSignalListenersCount(emitter, event) {
  if (emitter.listenerCount) { // Present in Node >= 4.0
    return emitter.listenerCount(event);
  } else {
    // deprecated in Node 4.0
    return EventEmitter.listenerCount(emitter, event);
  }
}

function getListenerCounts() {
  return {
    SIGINT: getSignalListenersCount(process, 'SIGINT'),
    SIGTERM: getSignalListenersCount(process, 'SIGTERM'),
    message: getSignalListenersCount(process, 'message'),
    exit: captureExit.listenerCount(),
  };
}

function getSignalListenerCounts() {
  return {
    SIGINT: getSignalListenersCount(process, 'SIGINT'),
    SIGTERM: getSignalListenersCount(process, 'SIGTERM'),
    message: getSignalListenersCount(process, 'message'),
  };
}

describe('will interrupt process', function() {
  let cb;
  beforeEach(function() {
    willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
    captureExit = require('capture-exit');
    cb = td.function();
  });

  afterEach(function() {
    willInterruptProcess.teardown();
  });

  describe('capture-exit integration', function() {
    let originalExitHandlersCount;

    beforeEach(function() {
      originalExitHandlersCount = captureExit.listenerCount();
    });

    it('adds exit handler', function() {
      willInterruptProcess.addHandler(cb);

      expect(captureExit.listenerCount()).to.equal(originalExitHandlersCount + 1);
    });

    it('removes exit handler', function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});

      willInterruptProcess.removeHandler(cb);

      expect(captureExit.listenerCount()).to.equal(originalExitHandlersCount + 1);
    });

    it('removes all exit handlers', function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});

      willInterruptProcess.teardown();

      expect(captureExit.listenerCount()).to.equal(originalExitHandlersCount);
    });
  });

  describe('process interruption signal listeners', function() {
    let originalSignalListenersCounts;

    beforeEach(function() {
      originalSignalListenersCounts = getSignalListenerCounts();
    });

    it('sets up interruption signal listeners when then first handler added', function() {
      willInterruptProcess.addHandler(cb);

      expect(getSignalListenerCounts()).to.eql({
        SIGINT: originalSignalListenersCounts.SIGINT + 1,
        SIGTERM: originalSignalListenersCounts.SIGTERM + 1,
        message: originalSignalListenersCounts.message + 1,
      });
    });

    it('sets up interruption signal listeners only once', function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});

      expect(getSignalListenerCounts()).to.eql({
        SIGINT: originalSignalListenersCounts.SIGINT + 1,
        SIGTERM: originalSignalListenersCounts.SIGTERM + 1,
        message: originalSignalListenersCounts.message + 1,
      });
    });

    it('cleans up interruption signal listeners', function() {
      willInterruptProcess.addHandler(cb);
      // will-interrupt-process doesn't have any public API to get actual handlers count
      // so here we make a side test to ensure that we don't add the same callback twice
      willInterruptProcess.addHandler(cb);

      willInterruptProcess.removeHandler(cb);

      expect(getSignalListenerCounts()).to.eql(originalSignalListenersCounts);
    });

    it(`doesn't clean up interruption signal listeners if there are remaining handlers`, function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(() => cb());

      willInterruptProcess.removeHandler(cb);

      expect(getSignalListenerCounts()).to.eql({
        SIGINT: originalSignalListenersCounts.SIGINT + 1,
        SIGTERM: originalSignalListenersCounts.SIGTERM + 1,
        message: originalSignalListenersCounts.message + 1,
      });
    });

    it('cleans up all interruption signal listeners', function() {
      willInterruptProcess.addHandler(cb);
      willInterruptProcess.addHandler(function() {});
      willInterruptProcess.addHandler(() => cb);

      willInterruptProcess.teardown();

      expect(getSignalListenerCounts()).to.eql(originalSignalListenersCounts);
    });
  });

  describe('Windows CTRL + C Capture', function() {
    let originalPlatform, originalStdin;

    before(function() {
      originalPlatform = process.platform;
      originalStdin = process.platform;
    });

    after(function() {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });

      Object.defineProperty(process, 'stdin', {
        value: originalStdin,
      });
    });

    it('enables raw capture on Windows', function() {
      Object.defineProperty(process, 'platform', {
        value: 'win',
      });

      Object.defineProperty(process, 'stdin', {
        value: {
          isTTY: true,
          on: td.function(),
          setRawMode: td.function(),
        },
      });

      let trapWindowsSignals = td.function();
      let windowsCtrlCTrap = td.matchers.isA(Function);

      willInterruptProcess.addHandler(cb);
      td.verify(process.stdin.setRawMode(true));
      td.verify(process.stdin.on('data', windowsCtrlCTrap));
    });

    it('does not enable raw capture on non-Windows', function() {
      Object.defineProperty(process, 'platform', {
        value: 'mockOS',
      });

      Object.defineProperty(process, 'stdin', {
        value: {
          isTTY: true,
          on: td.function(),
          setRawMode: td.function(),
        },
      });

      let trapWindowsSignals = td.function();
      let windowsCtrlCTrap = td.matchers.isA(Function);

      willInterruptProcess.addHandler(cb);

      td.verify(process.stdin.setRawMode(true), {
        times: 0,
      });

      td.verify(process.stdin.on('data', windowsCtrlCTrap), {
        times: 0,
      });
    });
  });

});
