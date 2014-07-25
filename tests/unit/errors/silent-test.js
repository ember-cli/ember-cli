'use strict';

var SilentError = require('../../../lib/errors/silent');
var assert      = require('../../helpers/assert');

describe('SilentError', function() {
  var error;

  it('should suppress the stack trace by default', function() {
    error = new SilentError();
    assert(error.suppressStacktrace, 'suppressesStacktrace should be true');
  });

  describe('with EMBER_VERBOSE_ERRORS set', function() {
    beforeEach(function() {
      delete process.env.EMBER_VERBOSE_ERRORS;
    });

    it('should suppress stack when true', function() {
      process.env.EMBER_VERBOSE_ERRORS = 'true';
      error = new SilentError();
      assert(!error.suppressStacktrace, 'suppressesStacktrace should be false');
    });

    it('shouldn\'t suppress stack when false', function() {
      process.env.EMBER_VERBOSE_ERRORS = 'false';
      error = new SilentError();
      assert(error.suppressStacktrace, 'suppressesStacktrace should be true');
    });
  });
});
