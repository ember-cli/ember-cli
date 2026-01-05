'use strict';

const { expect } = require('chai');
const { default: stripAnsi } = require('strip-ansi');
const { deprecate } = require('../../../lib/debug');

describe('deprecate', function () {
  let consoleWarn;
  let deprecations;

  beforeEach(function () {
    consoleWarn = console.warn;
    deprecations = [];

    // TODO: This should be updated once we can register deprecation handlers:
    console.warn = (deprecation) => {
      // Remove the stack trace:
      deprecations.push(stripAnsi(deprecation).split('at getStackTrace')[0].trimEnd());
    };
  });

  afterEach(function () {
    console.warn = consoleWarn;
  });

  it('it throws when the description argument is missing', function () {
    expect(() => {
      deprecate();
    }).to.throw('ASSERTION FAILED: When calling `deprecate`, you must provide a description as the first argument.');

    expect(() => {
      deprecate('');
    }).to.throw('ASSERTION FAILED: When calling `deprecate`, you must provide a description as the first argument.');
  });

  it('it throws when the condition argument is missing', function () {
    expect(() => {
      deprecate('description');
    }).to.throw('ASSERTION FAILED: When calling `deprecate`, you must provide a condition as the second argument.');
  });

  it('it throws when the options argument is missing', function () {
    expect(() => {
      deprecate('description', true);
    }).to.throw(
      'ASSERTION FAILED: When calling `deprecate`, you must provide an options object as the third argument. The options object must include the `for`, `id`, `since` and `until` options (`url` is optional).'
    );

    expect(() => {
      deprecate('description', undefined);
    }).to.throw(
      'ASSERTION FAILED: When calling `deprecate`, you must provide an options object as the third argument. The options object must include the `for`, `id`, `since` and `until` options (`url` is optional).'
    );

    expect(() => {
      deprecate('description', false, null);
    }).to.throw(
      'ASSERTION FAILED: When calling `deprecate`, you must provide an options object as the third argument. The options object must include the `for`, `id`, `since` and `until` options (`url` is optional).'
    );
  });

  it('it throws when the `for` option is missing', function () {
    expect(() => {
      deprecate('description', true, {});
    }).to.throw('ASSERTION FAILED: When calling `deprecate`, you must provide the `for` option.');
  });

  it('it throws when the `id` option is missing', function () {
    expect(() => {
      deprecate('description', true, {
        for: 'foo',
      });
    }).to.throw('ASSERTION FAILED: When calling `deprecate`, you must provide the `id` option.');
  });

  it('it throws when the `since` option is missing', function () {
    expect(() => {
      deprecate('description', true, {
        for: 'foo',
        id: 'foo',
      });
    }).to.throw(
      'ASSERTION FAILED: When calling `deprecate`, you must provide the `since` option. `since` must include the `available` and/or the `enabled` option.'
    );
  });

  it('it throws when both the `since.available` and `since.enabled` options are missing', function () {
    expect(() => {
      deprecate('description', true, {
        for: 'foo',
        id: 'foo',
        since: {},
      });
    }).to.throw(
      'ASSERTION FAILED: When calling `deprecate`, you must provide the `since.available` and/or the `since.enabled` option.'
    );
  });

  it('it throws when the `since.available` option is not a valid SemVer version', function () {
    expect(() => {
      deprecate('description', true, {
        for: 'foo',
        id: 'foo',
        since: {
          available: 'foo',
        },
      });
    }).to.throw('ASSERTION FAILED: `since.available` must be a valid SemVer version.');
  });

  it('it throws when the `since.enabled` option is not a valid SemVer version', function () {
    expect(() => {
      deprecate('description', true, {
        for: 'foo',
        id: 'foo',
        since: {
          enabled: 'foo',
        },
      });
    }).to.throw('ASSERTION FAILED: `since.enabled` must be a valid SemVer version.');
  });

  it('it throws when the `until` option is not a valid SemVer version', function () {
    expect(() => {
      deprecate('description', true, {
        for: 'foo',
        id: 'foo',
        since: {
          available: '4.0.0',
          enabled: '4.0.0',
        },
      });
    }).to.throw(
      'ASSERTION FAILED: When calling `deprecate`, you must provide a valid SemVer version for the `until` option.'
    );

    expect(() => {
      deprecate('description', true, {
        for: 'foo',
        id: 'foo',
        since: {
          available: '4.0.0',
          enabled: '4.0.0',
        },
        until: 'foo',
      });
    }).to.throw(
      'ASSERTION FAILED: When calling `deprecate`, you must provide a valid SemVer version for the `until` option.'
    );
  });

  it('it does nothing when the condition argument is truthy', function () {
    deprecate('description', true, {
      for: 'foo',
      id: 'foo',
      since: {
        available: '4.0.0',
        enabled: '4.0.0',
      },
      until: '5.0.0',
    });

    expect(deprecations).to.deep.equal([]);
  });

  it('it displays a deprecation message when the condition argument is falsy', function () {
    deprecate('description', false, {
      for: 'foo',
      id: 'foo',
      since: {
        available: '4.0.0',
        enabled: '4.0.0',
      },
      until: '5.0.0',
    });

    expect(deprecations).to.deep.equal([
      ` DEPRECATION \n
description

ID     foo
UNTIL  5.0.0`,
    ]);
  });

  it('it includes the `url` option in the deprecation message when provided', function () {
    deprecate('description', false, {
      for: 'foo',
      id: 'foo',
      since: {
        available: '4.0.0',
        enabled: '4.0.0',
      },
      until: '5.0.0',
      url: 'https://example.com',
    });

    expect(deprecations).to.deep.equal([
      ` DEPRECATION \n
description

ID     foo
UNTIL  5.0.0
URL    https://example.com`,
    ]);
  });

  it('throws an deprecation if the current ember-cli version is greater than the until version of deprecation', function () {
    expect(() => {
      deprecate('The `foo` method is deprecated', false, {
        for: 'ember-cli',
        id: 'ember-cli.foo-method',
        since: {
          available: '4.1.0',
          enabled: '4.2.0',
        },
        until: '3.0.0', // This should be less than the current emberCLIVersion to trigger the error
        url: 'https://example.com',
      });
    }).to.throw(
      'The API deprecated by ember-cli.foo-method was removed in ember-cli 3.0.0. The message was: The `foo` method is deprecated. Please see https://example.com for more details.'
    );
  });

  it('throws an deprecation if the pre-release ember-cli version is greater than the until version of deprecation', function () {
    const OVERRIDE_VERSION = process.env.OVERRIDE_DEPRECATION_VERSION;
    process.env.OVERRIDE_DEPRECATION_VERSION = '9.0.0-beta.1';
    expect(() => {
      deprecate('The `bar` method is deprecated', false, {
        for: 'ember-cli',
        id: 'ember-cli.bar-method',
        since: {
          available: '4.1.0',
          enabled: '4.2.0',
        },
        until: '9.0.0', // This should be less than the current emberCLIVersion to trigger the error
        url: 'https://example.com',
      });
    }).to.throw(
      'The API deprecated by ember-cli.bar-method was removed in ember-cli 9.0.0. The message was: The `bar` method is deprecated. Please see https://example.com for more details.'
    );
    process.env.OVERRIDE_DEPRECATION_VERSION = OVERRIDE_VERSION;
  });

  it('does not throw a deprecation if "for" is not "ember-cli"', function () {
    expect(() => {
      deprecate('The `foo` method is deprecated.', false, {
        for: 'ember-source',
        id: 'not-ember-cli.foo-method',
        since: {
          available: '4.1.0',
          enabled: '4.2.0',
        },
        until: '3.0.0',
        url: 'https://example.com',
      });
    }).to.not.throw();
  });
});
