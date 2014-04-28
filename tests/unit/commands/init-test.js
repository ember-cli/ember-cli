'use strict';

var path     = require('path');
var assert   = require('../../helpers/assert');
var MockUI   = require('../../helpers/mock-ui');
var rewire   = require('rewire');
var stubPath = require('../../helpers/stub').stubPath;
var Promise  = require('../../../lib/ext/promise');

var command;

describe('init command', function() {
  var ui;

  beforeEach(function() {
    ui = new MockUI();
    command = rewire('../../../lib/commands/init');
    command.ui = ui;
  });

  it('doesn\'t allow to create an application named `test`', function() {
    command.__set__('path', stubPath('test'));

    return command.run({ tasks: {} }, {})
      .then(function() {
        assert.ok(false, 'should have rejected with an application name of test');
      })
      .catch(function() {
        assert.equal(ui.output, 'Due to an issue with `compileES6` an application name of `test` cannot be used.');
      });

  });

  it('Uses the name of the closest project to when calling installBlueprint', function() {

    var env = {
      project: {pkg: { name: 'some-random-name'}},
      tasks: {
        installBlueprint: {
          run: function(ui, blueprintOpts) {
            assert.equal(blueprintOpts.rawName, 'some-random-name');
            return Promise.reject('Called run');
          }
        }
      }
    };

    return command.run(env, {})
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });

  });

  it('Uses process.cwd if no package is found when calling installBlueprint', function() {
    var env = {
      tasks: {
        installBlueprint: {
          run: function(ui, blueprintOpts) {
            assert.equal(blueprintOpts.rawName, path.basename(process.cwd()));
            return Promise.reject('Called run');
          }
        }
      }
    };

    return command.run(env, {})
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });
});
