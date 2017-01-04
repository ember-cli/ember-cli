'use strict';

const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const Yam = require('yam');
const cliEntry = require('../../../lib/cli');

describe('.ember-cli leek options', function() {
  let cli;
  let settings;
  let passedOptions;

  before(function() {
    settings = new Yam('ember-cli', {
      primary: `${process.cwd()}/tests/fixtures/leek-config`,
    });

    let mockedLeek = function(options) {
      passedOptions = options;
    };

    let mockedYam = function() {
      return settings;
    };

    cli = cliEntry({
      UI: MockUI,
      Leek: mockedLeek,
      Yam: mockedYam,
    });

  });

  it('should contain the leek options from .ember-cli file', function() {
    expect(passedOptions.adapterUrls).to.contain.keys(['event', 'exception', 'timing', 'appview']);
  });
});
