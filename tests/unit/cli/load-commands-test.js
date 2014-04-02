'use strict';

require('chai').use(require('chai-as-promised'));

var expect       = require('chai').expect;
var loadCommands = require('../../../lib/cli/load-commands');

describe('cli/load-commands.js', function() {
  it('loadCommands() should find basic commands.', function() {
    return expect(loadCommands()).to.eventually.include.keys([
      'serve',
      'build'
    ]);
  });

  it('loadCommands() should fill out optional fields.', function() {
    return loadCommands()
      .then(function(commands) {
        expect(commands.serve).to.include({
          name: 'serve',
          key: 'serve'
        });
      });
  });
});
