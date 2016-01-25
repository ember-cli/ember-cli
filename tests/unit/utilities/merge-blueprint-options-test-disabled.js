'use strict';

var expect                = require('chai').expect;
var map                   = require('lodash/map');
var stub                  = require('../../helpers/stub');
var Blueprint             = require('../../../lib/models/blueprint');
var Project               = require('../../../lib/models/project');
var Command               = require('../../../lib/models/command');
var mergeBlueprintOptions = require('../../../lib/utilities/merge-blueprint-options');

var safeRestore = stub.safeRestore;
stub = stub.stub;

describe('merge-blueprint-options', function() {
  var TestCommand = Command.extend({
    name: 'test-command',
    description: 'Runs a test command.',
    aliases: ['t'],
    works: 'everywhere',

    availableOptions: [
      { name: 'verbose',    type: Boolean, default: false, aliases: ['v'] }
    ],

    beforeRun: mergeBlueprintOptions
  });

  afterEach(function() {
    safeRestore(Blueprint, 'lookup');
  });

  function buildCommand() {
    return new TestCommand({
      project: new Project(process.cwd(), { name: 'some-random-name' })
    });
  }

  it('it works as a command\'s beforeRun()', function() {
    var command, availableOptions;

    stub(Blueprint, 'lookup', function(name) {
      expect(name).to.equal('test-blueprint');
      return {
        availableOptions: [
          { name: 'custom-blueprint-option', type: String }
        ]
      };
    }, true);

    command = buildCommand();
    command.beforeRun(['test-blueprint']);

    availableOptions = map(command.availableOptions, 'name');
    expect(availableOptions).to.contain('verbose');
    expect(availableOptions).to.contain('custom-blueprint-option');
  });
});
