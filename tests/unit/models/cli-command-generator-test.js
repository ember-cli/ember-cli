'use strict';

var fs          = require('fs');
var stub        = require('../../helpers/stub').stub;
var expect      = require('chai').expect;
var Generator   = require('../../../lib/models/cli-command-generator');
var CliCommand  = require('../../../lib/models/cli-command');
var MockProject = require('../../helpers/mock-project');

var generator;

describe('Unit: cli-command-generator', function() {

  it('returns a generator object', function() {
    generator = new Generator();
    expect(generator.constructor).to.equal(Generator);
  });

  it('assumes closest project if none is given', function() {
    generator = new Generator();
    expect(generator.project).to.exist;
  });

  it('reloads addons for given project', function() {
    var project = new MockProject();
    stub(project, 'blueprintLookupPaths', []);
    var reloadAddons = stub(project, 'reloadAddons');
    generator = new Generator(project);
    expect(reloadAddons.called).to.equal(1);
  });

  it('appends to zsh config file', function() {
    generator = new Generator();
    fs.openSync(process.cwd() + '/.zsh-config.tmp', 'w');
    generator.setupZshConfig(process.cwd() + '/.zsh-config.tmp');
    var content = fs.readFileSync(process.cwd() + '/.zsh-config.tmp', 'utf8');
    fs.unlink(process.cwd() + '/.zsh-config.tmp', 'utf8');
    expect(content).to.match(/ember --completion/);
  });

  it('appends to bash config file', function() {
    generator = new Generator();
    fs.openSync(process.cwd() + '/.bash-config.tmp', 'w');
    generator.setupBashConfig(process.cwd() + '/.bash-config.tmp');
    var content = fs.readFileSync(process.cwd() + '/.bash-config.tmp', 'utf8');
    fs.unlink(process.cwd() + '/.bash-config.tmp', 'utf8');
    expect(content).to.match(/.ember\/completion\.sh/);
  });

  var root, sub1, recursive, nested, result;
  describe('JSON generation', function() {

    before(function() {
      nested = new CliCommand({
        aliases: ['nest'],
        name: 'nested',
        availableOptions: [
          { name: 'server', type: String }
        ],
        cliCommands: function() {
          return [];
        }
      });

      sub1 = new CliCommand({
        name: 'sub1',
        aliases: ['s', '1'],
        availableOptions: [
          { name: 'pod', type: Boolean }
        ],
        cliCommands: function() {
          return [
            nested
          ];
        }
      });

      recursive = new CliCommand({
        name: 'recursive',
        cliCommands: function(generator, oldCommands) {
          if (oldCommands.indexOf('recursive') === -1) {
          return [
            root
          ];
          } else {
            return [];
          }
        }
      });

      root = new CliCommand({
        name: 'root',
        cliCommands: function() {
          return [
            sub1,
            recursive
          ];
        }
      });

      generator = new Generator();
      result = generator.buildCommand(root, []);
    });

    it('builds root command', function() {
      expect(result).to.have.deep.property('name', 'root');
      expect(result).to.have.deep.property('commands.length', 2);
    });

    it('builds sub command', function() {
      var command = result.commands[0];
      expect(command.name).to.equal('sub1');
      expect(command.commands.length).to.equal(1);
      expect(command.aliases).to.deep.equal(['s', '1']);
      expect(command.options).to.deep.equal([{ name: 'pod', type: 'Boolean'}]);
    });

    it('builds nested command', function() {
      var command = result.commands[0].commands[0];
      expect(command.name).to.equal('nested');
      expect(command.commands).to.empty;
      expect(command.aliases).to.deep.equal(['nest']);
      expect(command.options).to.deep.equal([{name: 'server', type: 'String'}]);
    });

    describe('on recursive commands', function() {

      it('builds recursive command', function() {
        var command = result.commands[1];
        expect(command.name).to.equal('recursive');
        expect(command.commands.length).to.equal(1);
        expect(command.aliases).to.be.empty;
        expect(command.options).to.be.empty;
      });

      it('builds nested commands of recursive command', function() {
        expect(result).to.have.deep.property('commands[1].commands[0].name', 'root');
        expect(result).to.have.deep.property('commands[1].commands[0].commands.length', 2);

        expect(result).to.have.deep.property('commands[1].commands[0].commands[0].name', 'sub1');
        expect(result).to.have.deep.property('commands[1].commands[0].commands[0].commands.length', 1);

        expect(result).to.have.deep.property('commands[1].commands[0].commands[0].commands[0].name', 'nested');
        expect(result).to.have.deep.property('commands[1].commands[0].commands[0].commands[0].commands.length', 0);
        expect(result).to.have.deep.property('commands[1].commands[0].commands[0].commands[0].aliases.length', 1);
        expect(result).to.have.deep.property('commands[1].commands[0].commands[0].commands[0].aliases[0]', 'nest');
      });

      it('stops recursion', function() {
        var command = result.commands[1].commands[0].commands[1];
        expect(command.name).to.equal('recursive');
        expect(command.commands).to.be.empty;
        expect(command.aliases).to.be.empty;
      });

    });

  });

});
