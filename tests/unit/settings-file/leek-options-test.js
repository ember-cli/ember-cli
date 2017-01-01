'use strict';

var expect = require('chai').expect;
var MockUI = require('console-ui/mock');
var Yam = require('yam');
var cliEntry = require('../../../lib/cli');

describe('.ember-cli leek options', function() {
  var cli;
  var settings;
  var passedOptions;

  before(function() {
    settings = new Yam('ember-cli', {
      primary: process.cwd() + '/tests/fixtures/leek-config',
    });

    var mockedLeek = function(options) {
      passedOptions = options;
    };

    var mockedYam = function() {
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
