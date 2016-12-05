'use strict';

var expect = require('chai').expect;
var Command = require('../../../lib/utilities/command-generator');

describe('command-generator', function() {
  it('defaults options', function() {
    var yarn;
    yarn = new Command('yarn');
    expect(yarn.options.retryCommands).to.deep.equal([]);

    yarn = new Command('yarn', {});
    expect(yarn.options.retryCommands).to.deep.equal([]);

    yarn = new Command('yarn', { retryCommands: ['install'] });
    expect(yarn.options.retryCommands).to.deep.equal(['install']);
  });

  it('invoke defaults options', function() {
    var yarn = new Command('yarn');

    var passedOptions = {};
    yarn._invoke = function(command, options) {
      passedOptions = options;
    };

    // Works with subcommand or argument.
    yarn.invoke('install');
    expect(passedOptions).to.deep.equal({ stdio: ['ignore', 'ignore', 'ignore'] });

    yarn.invoke('install', {});
    expect(passedOptions).to.deep.equal({ stdio: ['ignore', 'ignore', 'ignore'] });

    yarn.invoke('install', { cwd: 'foo' });
    expect(passedOptions).to.deep.equal({ cwd: 'foo', stdio: ['ignore', 'ignore', 'ignore'] });

    yarn.invoke('install', { stdio: ['default', 'default', 'default'] });
    expect(passedOptions).to.deep.equal({ stdio: ['default', 'default', 'default'] });

    // Works with no subcommand or argument.
    yarn.invoke();
    expect(passedOptions).to.deep.equal({ stdio: ['ignore', 'ignore', 'ignore'] });

    yarn.invoke({});
    expect(passedOptions).to.deep.equal({ stdio: ['ignore', 'ignore', 'ignore'] });

    yarn.invoke({ cwd: 'foo' });
    expect(passedOptions).to.deep.equal({ cwd: 'foo', stdio: ['ignore', 'ignore', 'ignore'] });

    yarn.invoke({ stdio: ['default', 'default', 'default'] });
    expect(passedOptions).to.deep.equal({ stdio: ['default', 'default', 'default'] });
  });

  it('builds the proper invocation', function() {
    var yarn = new Command('yarn');

    yarn.ci = function() { return []; };

    var invocation;
    yarn._invoke = function(command, options) {
      invocation = command;
    };

    yarn.invoke();
    expect(invocation).to.equal('yarn');

    yarn.invoke('install');
    expect(invocation).to.equal('yarn install');

    yarn.invoke('install', 'the', 'thing');
    expect(invocation).to.equal('yarn install the thing');

    yarn.invoke('install', 'the', 'thing', {});
    expect(invocation).to.equal('yarn install the thing');
  });
});

// Don't need to write individual tests for each CI since it will run on both!
it ('gets clever in CI environments', function() {
  var yarn = new Command('yarn', { retryCommands: ['install'] });

  if (process.env.TRAVIS === 'true') {
    expect(yarn.ci('install')).to.deep.equal(['travis_retry']);
  } else if (process.env.APPVEYOR === 'True') {
    expect(yarn.ci('install')).to.deep.equal(['appveyor-retry']);
  }
});
