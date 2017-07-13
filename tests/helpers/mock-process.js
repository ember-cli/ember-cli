'use strict';

let td = require('testdouble');
let EventEmitter = require('events');

module.exports = class FakeProcess extends EventEmitter {
  constructor(options) {
    super();

    options = options || {};

    const stdin = Object.assign(new EventEmitter(), {
      isRaw: process.stdin.isRaw,
      setRawMode: td.function(),
    }, options.stdin || {});

    td.when(stdin.setRawMode(td.matchers.anything())).thenDo(function(flag) {
      this.isRaw = flag;
    });

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
};
