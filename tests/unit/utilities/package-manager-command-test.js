'use strict';

var packageManagerCommand = require('../../../lib/utilities/package-manager-command');
var expect = require('chai').expect;

var npmInstance = {
  commands: {
    install: function() {},
    cache: {
      clean: function() { }
    }
  }
};

describe('package-manager-command', function() {
  it('attempts to find `install` command', function() {
    var result = packageManagerCommand(npmInstance, 'install');

    expect(result).to.be.function;
  });

  it('attempts to find nested `cache clean` command', function() {
    var result = packageManagerCommand(npmInstance, 'cache clean');

    expect(result).to.be.function;
  });

  it('attempts to find non existant command', function() {
    var result = packageManagerCommand(npmInstance, 'oops');

    expect(result).to.be.undefined;
  });

  it('attempts to find not a command', function() {
    var result = packageManagerCommand(npmInstance, 'cache');

    expect(result).to.be.undefined;
  });

  it('attempts to find wuthout package manager instance', function() {
    expect(function() {
      packageManagerCommand(undefined, 'install');
    }).to.throw(Error, /No commands container specified/);
  });

});

