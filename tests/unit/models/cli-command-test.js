'use strict';

var expect    = require('chai').expect;
var CliCommand = require('../../../lib/models/cli-command');

var command;
describe('Unit: cli-command', function() {

  it('returns `null` without options', function() {
    var command = new CliCommand();
    expect(command).to.not.be;
  });

  it('returns `null` without options.name', function() {
    var command = new CliCommand({
      aliases: ['a']
    });
    expect(command).to.not.be;
  });

  describe('defaults missing', function() {
    before(function() {
      command = new CliCommand({
        name: 'bar'
      });
    });

    it('cliCommands to empty array', function() {
      expect(command).to.include.property('commands').that.is.an('array').and.empty;
    });

    it('empty aliases', function() {
      expect(command).to.include.property('aliases').that.is.an('array').and.empty;
    });

    it('empty options', function() {
      expect(command).to.include.property('aliases').that.is.an('array').and.empty;
    });
  });

  describe('on valid options', function() {
    before(function() {
      command = new CliCommand({
        name: 'foo',
        aliases: ['f', 'fo'],
        availableOptions: [
          {
            name: 'pod',
            type: Boolean,
            otherKeys: true
          },
          {
            name: 'in-repo-addon',
            type: String,
            otherKeys: true
          }
        ],
        cliCommands: function() {
          return [1,2,3];
        }
      });
    });

    it('name', function() {
      expect(command.name).to.equal('foo');
    });

    it('commands', function() {
      expect(command.commands()).to.deep.equal([1,2,3]);
    });

    it('aliases', function() {
      expect(command.aliases).to.deep.equal(['f', 'fo']);
    });

    it('options', function() {
      expect(command).to.have.deep.property('options[0].name', 'pod');
      expect(command).to.have.deep.property('options[0].type', 'Boolean');

      expect(command).to.have.deep.property('options[1].name', 'in-repo-addon');
      expect(command).to.have.deep.property('options[1].type', 'String');
    });

  });

  describe('nested command', function() {
    before(function() {
      command = new CliCommand(command);
    });

    it('name', function() {
      expect(command.name).to.equal('foo');
    });

    it('commands', function() {
      expect(command.commands()).to.deep.equal([1,2,3]);
    });

    it('aliases', function() {
      expect(command.aliases).to.deep.equal(['f', 'fo']);
    });

    it('options', function() {
      expect(command).to.have.deep.property('options[0].name', 'pod');
      expect(command).to.have.deep.property('options[0].type', 'Boolean');

      expect(command).to.have.deep.property('options[1].name', 'in-repo-addon');
      expect(command).to.have.deep.property('options[1].type', 'String');
    });

  });

});
