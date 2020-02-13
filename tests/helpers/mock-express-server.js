'use strict';

const EventEmitter = require('events').EventEmitter;
const path = require('path');

class MockExpressServer extends EventEmitter {
  then() {
    let promise = Promise.resolve({
      directory: path.resolve(__dirname, '../fixtures/express-server'),
    });
    return promise.then.apply(promise, arguments);
  }
}

module.exports = MockExpressServer;
