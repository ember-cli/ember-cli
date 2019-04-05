'use strict';

const expect = require('../../chai').expect;
const MockProject = require('../../helpers/mock-project');
const commandOptions = require('../../factories/command-options');
const UninstallNpmCommand = require('../../../lib/commands/uninstall-npm');

describe('uninstall:npm command', function() {
  let command;

  let msg = 'This command has been removed. Please use `npm uninstall ' + '<packageName> --save-dev` instead.';

  beforeEach(function() {
    let project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    let options = commandOptions({
      project,
    });

    command = new UninstallNpmCommand(options);
  });

  it('throws a friendly silent error with no args', function() {
    return expect(command.validateAndRun([])).to.be.rejected.then(error => {
      expect(error.message).to.equal(msg, 'expect error to have a helpful message');
    });
  });

  it('throws a friendly silent error with args', function() {
    return expect(command.validateAndRun(['moment', 'lodash'])).to.be.rejected.then(error => {
      expect(error.message).to.equal(msg, 'expect error to have a helpful message');
    });
  });
});
