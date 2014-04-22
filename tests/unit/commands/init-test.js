'use strict';

var assert   = require('../../helpers/assert');
var MockUI   = require('../../helpers/mock-ui');
var rewire   = require('rewire');
var stubPath = require('../../helpers/stub').stubPath;
var command;

describe('init command', function() {
  var ui;

  before(function() {
    ui = new MockUI();
    command = rewire('../../../lib/commands/init');
    command.__set__('path', stubPath('test'));
  });

  it('doesn\'t allow to create an application named `test`', function() {
    assert.throw(function() {
      command.run(ui);
    }, undefined);

    assert.equal(ui.output, 'Due to an issue with `compileES6` an application name of `test` cannot be used.');
  });
});
