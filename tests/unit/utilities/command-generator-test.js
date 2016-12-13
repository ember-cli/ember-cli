'use strict';

var expect = require('chai').expect;
var Command = require('../../../lib/utilities/command-generator');

describe('command-generator', function() {
  it('invoke passes options', function() {
    var yarn = new Command('yarn');

    var passedOptions = {};
    yarn._invoke = function(command, options) {
      passedOptions = options;
    };

    // Works with subcommand or argument.
    yarn.invoke('install');
    expect(passedOptions).to.deep.equal({});

    yarn.invoke('install', {});
    expect(passedOptions).to.deep.equal({});

    yarn.invoke('install', { cwd: 'foo' });
    expect(passedOptions).to.deep.equal({ cwd: 'foo' });

    yarn.invoke('install', { stdio: ['default', 'default', 'default'] });
    expect(passedOptions).to.deep.equal({ stdio: ['default', 'default', 'default'] });

    // Works with no subcommand or argument.
    yarn.invoke();
    expect(passedOptions).to.deep.equal({});

    yarn.invoke({});
    expect(passedOptions).to.deep.equal({});

    yarn.invoke({ cwd: 'foo' });
    expect(passedOptions).to.deep.equal({ cwd: 'foo' });

    yarn.invoke({ stdio: ['default', 'default', 'default'] });
    expect(passedOptions).to.deep.equal({ stdio: ['default', 'default', 'default'] });
  });

  it('builds the proper invocation', function() {
    var yarn = new Command('yarn');

    var invocation;
    yarn._invoke = function(args, options) {
      invocation = args;
    };

    yarn.invoke();
    expect(invocation).to.deep.equal([]);

    yarn.invoke('install');
    expect(invocation).to.deep.equal(['install']);

    yarn.invoke('install', 'the', 'thing');
    expect(invocation).to.deep.equal(['install', 'the', 'thing']);

    yarn.invoke('install', 'the', 'thing', {});
    expect(invocation).to.deep.equal(['install', 'the', 'thing']);
  });
});
