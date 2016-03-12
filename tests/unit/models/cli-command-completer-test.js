'use strict';

var expect      = require('chai').expect;
var Completer   = require('../../../lib/models/cli-command-completer');

var completer;
describe('Unit: cli-command-completer', function() {

  before(function() {
    completer = new Completer();
    completer.template = {
      commands: [
        {
          name: 'foo',
          aliases: [],
          options: [],
          commands: [
            {
              name: 'bar',
              aliases: ['b'],
              options: [
                { name: 'verbose', type: 'Boolean' },
                { name: 'parent-option', type: 'String' },
              ],
              commands: [
                {
                  name: 'nested',
                  aliases: ['n'],
                  options: [
                    { name: 'nested-option', type: 'Boolean' }
                  ],
                  commands: []
                }
              ]
            },
            {
              name: 'baz',
              aliases: [],
              options: [],
              commands: [],
            }
          ]
        }
      ]
    };
  });

  it('returns a completer object', function() {
    expect(completer.constructor).to.equal(Completer);
  });

  it('.getArgs - parses arguments correctly', function() {
    expect(completer.getArgs('ember generate model')).to.deep.equal(['ember', 'generate', 'model']);
    expect(completer.getArgs('foo  bar x  asdf  ')).to.deep.equal(['foo', 'bar', 'x', 'asdf']);
  });

  it('.isPremature - checks completeness of last command', function() {
    expect(completer.isPremature('ember gen')).to.be.true;
    expect(completer.isPremature('ember g ')).to.be.false;
  });

  it('.seeksOptions - decides to propose options correctly', function() {
    expect(completer.seeksOptions('ember g --po')).to.be.true;
    expect(completer.seeksOptions('ember g -p')).to.be.true;
    expect(completer.seeksOptions('ember g -')).to.be.true;
    expect(completer.seeksOptions('ember g -- ')).to.be.false;
    expect(completer.seeksOptions('ember g - ')).to.be.false;
    expect(completer.seeksOptions('ember g x-')).to.be.false;
  });

  it('.findCommand - identifies correct command out of a list of commands', function() {
    var commands = [
      {
        name: 'foo',
        aliases: ['f']
      },
      {
        name: 'bar',
        aliases: ['b']
      }
    ];

    expect(completer.findCommand(commands, 'foo').name).to.equal('foo');
    expect(completer.findCommand(commands, 'f').name).to.equal('foo');
    expect(completer.findCommand(commands, 'bar').name).to.equal('bar');
    expect(completer.findCommand(commands, 'fo')).to.not.exist;
  });

  it('.getCommand - gets correct command from intent', function() {
    var correctIntent = {
      arguments: ['foo', 'bar'],
      isPremature: false,
      seeksOptions: false,
    };

    var prematureIntent = {
      arguments: ['foo', 'ba'],
      isPremature: true,
      seeksOptions: false,
    };

    var incorrectIntent = {
      arguments: ['foo', 'nested'],
      isPremature: false,
      seeksOptions: false,
    };

    var optionIntent = {
      arguments: ['foo', 'bar', '-'],
      isPremature: true,
      seeksOptions: true,
    };

    expect(completer.getCommand(correctIntent).name).to.equal('bar');
    expect(completer.getCommand(prematureIntent).name).to.equal('foo');
    expect(completer.getCommand(optionIntent).name).to.equal('bar');
    expect(completer.getCommand(incorrectIntent)).to.not.exist;
  });

  it('.getCommand - aggregates parent options on command', function() {
    var intent = {
      arguments: ['foo', 'bar', 'nested'],
      isPremature: false,
      seeksOptions: false,
    };

    expect(completer.getCommand(intent).options.length).to.equal(3);
  });

  it('.getResult - shows correct commands', function() {
    var intent = {
      arguments: ['foo'],
      isPremature: false,
      seeksOptions: false,
    };

    var aliasIntent = {
      arguments: ['foo', 'b'],
      isPremature: false,
      seeksOptions: false,
    };

    expect(completer.getResult(intent)).to.deep.equal(['bar', 'baz']);
    expect(completer.getResult(aliasIntent)).to.deep.equal(['nested']);
  });

  it('.getResult - shows correct options', function() {
    var intent = {
      arguments: ['foo', '--'],
      isPremature: true,
      seeksOptions: true,
    };

    var emptyIntent = {
      arguments: ['foo', 'baz'],
      isPremature: false,
      seeksOptions: false,
    };

    var aliasIntent = {
      arguments: ['foo', 'b', '--'],
      isPremature: true,
      seeksOptions: true,
    };

    expect(completer.getResult(intent)).to.deep.equal([]);
    expect(completer.getResult(emptyIntent)).to.deep.equal([]);
    expect(completer.getResult(aliasIntent)).to.deep.equal(['--verbose', '--parent-option=']);
  });

});
