'use strict';

// (un)Register process interruption signals(SIGINT, SIGTERM, process.kill()) handlers.
//
// When the process interrupted("CTR+C") all the registered handlers are being invoked via `capture-exit`.
// The process finishes after the last interruption handler is settled.

let exit = require('capture-exit');
exit.captureExit();

let windowsCtrlCTrap, originalIsRaw;
let handlers = [];

module.exports = {
  /**
   * Add process interruption handler
   *
   * When the first handler is added then automatically
   * sets up process interruption signals listeners
   *
   * @private
   * @method addHandler
   * @param {function} cb   Callback to be called when process interruption fired
   */
  addHandler(cb) {
    let index = handlers.indexOf(cb);
    if (index > -1) { return; }

    if (handlers.length === 0) {
      setupSignalsTrap();
    }

    handlers.push(cb);
    exit.onExit(cb);
  },

  /**
   * Remove process interruption handler
   *
   * If there are no remaining handlers after removal
   * then clean up all the process interruption signal listeners
   *
   * @private
   * @method removeHandler
   * @param {function} cb   Callback to be removed
   */
  removeHandler(cb) {
    let index = handlers.indexOf(cb);
    if (index < 0) { return; }

    handlers.splice(index, 1);
    exit.offExit(cb);

    if (handlers.length === 0) {
      teardownSignalsTrap();
    }
  },

  /**
   * Tears down all the handlers and cleans up all signal listeners
   *
   * @private
   * @method teardown
   */
  teardown() {
    while (handlers.length > 0) {
      this.removeHandler(handlers[0]);
    }
  },
};

/**
 * Sets up listeners for interruption signals
 *
 * When one of these signals is caught than raise process.exit()
 * which enforces `capture-exit` to run registered interruption handlers
 *
 * @method setupSignalsTrap
 */
function setupSignalsTrap() {
  process.on('SIGINT', _exit);
  process.on('SIGTERM', _exit);
  process.on('message', onMessage);

  if (isWindowsTTY()) {
    trapWindowsSignals();
  }
}

/**
 * Removes interruption signal listeners and tears down capture-exit
 *
 * @method teardownSignalsTrap
 */
function teardownSignalsTrap() {
  process.removeListener('SIGINT', _exit);
  process.removeListener('SIGTERM', _exit);
  process.removeListener('message', onMessage);

  if (isWindowsTTY()) {
    cleanupWindowsSignals();
  }
}

/**
 * Suppresses "Terminate batch job (Y/N)" confirmation on Windows
 *
 * @method trapWindowsSignals
 */
function trapWindowsSignals() {
  const stdin = process.stdin;

  originalIsRaw = stdin.isRaw;

  // This is required to capture Ctrl + C on Windows
  stdin.setRawMode(true);

  windowsCtrlCTrap = function(data) {
    if (data.length === 1 && data[0] === 0x03) {
      process.emit('SIGINT');
    }
  };
  stdin.on('data', windowsCtrlCTrap);
}

function cleanupWindowsSignals() {
  const stdin = process.stdin;

  stdin.setRawMode(originalIsRaw);

  stdin.removeListener('data', windowsCtrlCTrap);
}

function isWindowsTTY() {
  return (/^win/).test(process.platform) && process.stdin && process.stdin.isTTY;
}

/**
 * Handles the `message` event on the `process`.
 *
 * Calls `process.exit` if the `kill` property on the `message` is set.
 *
 * @method onMessage
 */
function onMessage(message) {
  if (message.kill) {
    _exit();
  }
}

function _exit() {
  process.exit();
}
