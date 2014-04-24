'use strict';

var rewire = require('rewire');
var assert = require('../../helpers/assert');
var MockUI = require('../../helpers/mock-ui');
var stub   = require('../../helpers/stub').stub;

var called;
var utility;
var callbacks;

function stubWatcher() {
  return function watcher() {
    called = true;
    callbacks = {};
    stub(callbacks, 'on');

    return callbacks;
  };
}

describe('buildWatcher utility', function() {
  var ui;

  before(function() {
    utility = rewire('../../../lib/utilities/build-watcher');
    utility.__set__('Watcher', stubWatcher());
  });

  beforeEach(function() {
    ui = new MockUI();
  });

  it('creates a Watcher instance', function() {
    utility();

    assert.ok(called);
  });

  it('sets up the proper callbacks', function() {
    utility();

    assert.equal(callbacks.on.calledWith[0][0], 'change');
    assert.equal(callbacks.on.calledWith[1][0], 'error');
  });

  it('the change callback does not print without an error first', function() {
    utility({ui: ui});

    callbacks.on.calledWith[0][1]();

    assert.equal(ui.output, '');
  });

  it('the change callback prints a message if there is an error', function() {
    utility({ui: ui});

    callbacks.on.calledWith[1][1](true);
    callbacks.on.calledWith[0][1]();

    assert.equal(ui.output, '\u001b[32m\n\nBuild successful.\n\u001b[39m');
  });

  it('the change callback prints a message only once if there is an error', function() {
    utility({ui: ui});

    callbacks.on.calledWith[1][1](true);
    callbacks.on.calledWith[0][1]();
    callbacks.on.calledWith[0][1]();

    assert.equal(ui.output, '\u001b[32m\n\nBuild successful.\n\u001b[39m');
  });
});

