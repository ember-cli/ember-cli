'use strict';

// Mocks a yam config file (.ember-cli)

module.exports = MockConfig;
function MockConfig() {
  return {
    'port': 999,
    'proxy': 'http://iamstef.net/ember-cli',
    'host': '0.1.0.1',
    'live-reload': true,
    'environment': 'mock-development'
  };
}

MockConfig.prototype = Object.create({});

MockConfig.prototype.constructor = MockConfig;
