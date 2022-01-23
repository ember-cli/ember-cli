'use strict';

const td = require('testdouble');
const Command = require('../../../lib/utilities/command-generator');

describe('command-generator', function () {
  let yarn, _invoke;

  beforeEach(function () {
    yarn = new Command('yarn');
    _invoke = yarn._invoke = td.function('invoke');
  });

  afterEach(function () {
    td.reset();
  });

  it('invoke passes options', function () {
    // Works with subcommand or argument.
    yarn.invoke('install');
    td.verify(_invoke(td.matchers.isA(Array), {}));

    yarn.invoke('install', {});
    td.verify(_invoke(td.matchers.isA(Array), {}));

    yarn.invoke('install', { cwd: 'foo' });
    td.verify(_invoke(td.matchers.isA(Array), { cwd: 'foo' }));

    yarn.invoke('install', { stdio: ['default', 'default', 'default'] });
    td.verify(_invoke(td.matchers.isA(Array), { stdio: ['default', 'default', 'default'] }));

    // Works with no subcommand or argument.
    yarn.invoke();
    td.verify(_invoke(td.matchers.isA(Array), {}));

    yarn.invoke({});
    td.verify(_invoke(td.matchers.isA(Array), {}));

    yarn.invoke({ cwd: 'foo' });
    td.verify(_invoke(td.matchers.isA(Array), { cwd: 'foo' }));

    yarn.invoke({ stdio: ['default', 'default', 'default'] });
    td.verify(_invoke(td.matchers.isA(Array), { stdio: ['default', 'default', 'default'] }));

    td.verify(_invoke(), { times: 8, ignoreExtraArgs: true });
  });

  it('builds the proper invocation', function () {
    yarn.invoke();
    td.verify(_invoke([]), { ignoreExtraArgs: true });

    yarn.invoke('install');
    td.verify(_invoke(['install']), { ignoreExtraArgs: true });

    yarn.invoke('install', 'the', 'thing');
    td.verify(_invoke(['install', 'the', 'thing']), { ignoreExtraArgs: true });

    yarn.invoke('install', 'the', 'thing', {});
    td.verify(_invoke(['install', 'the', 'thing']), { ignoreExtraArgs: true });

    td.verify(_invoke(), { times: 4, ignoreExtraArgs: true });
  });
});
