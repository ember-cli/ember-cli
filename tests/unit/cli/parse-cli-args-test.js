'use strict';
/*jshint expr: true*/

var expect       = require('chai').expect;
var parseCLIArgs = require('../../../lib/cli/parse-cli-args');
var UI           = require('../../../lib/ui');
var through      = require('through');
var assign       = require('lodash-node/modern/objects/assign');

describe('cli/parse-cli-args.js', function() {
  var output = [];

  var environment = {
    commands: {
      serve: {
        name: 'serve',
        key: 'serve',
        aliases: ['s'],
        works: 'everywhere',
        options: [
          { name: 'port', key: 'port', type: Number, default: 4200, required: true }
        ]
      },
      developEmberCLI: {
        name: 'develop-ember-cli',
        key: 'developEmberCLI',
        aliases: [],
        works: 'everywhere',
        options: [
          { name: 'package-name', key: 'packageName', type: String, required: true }
        ]
      },
      insideProject: {
        name: 'inside-project',
        key: 'insideProject',
        aliases: [],
        works: 'insideProject',
        options: []
      },
      outsideProject: {
        name: 'outside-project',
        key: 'outsideProject',
        aliases: [],
        works: 'outsideProject',
        options: []
      },
      everywhere: {
        name: 'everywhere',
        key: 'everywhere',
        aliases: [],
        works: 'everywhere',
        options: []
      }
    },
    ui: new UI({
      inputStream: through(),
      outputStream: through(function(data) { output.push(data); })
    }),
    project: {
      directory: '',
      packageJSON: {}
    }
  };

  var parse = function(e) { return parseCLIArgs(assign({}, environment, e)); };

  it('parseCLIArgs() should find commands by name and aliases.', function() {
    output = [];

    // Valid commands

    expect(parse({ cliArgs: ['serve'] })).to.exist;
    expect(parse({ cliArgs: ['s'] })).to.exist;

    // Invalid command
    expect(parse({ cliArgs: ['something-else'] })).to.be.null;
    expect(output.shift()).to.match(/command.*something-else.*is invalid/);
  });

  it('parseCLIArgs() should find the command options.', function() {
    expect(parse({ cliArgs: ['s', '--port', '80'] }).commandOptions).to.include({
      port: 80
    });
  });

  it('parseCLIArgs() should find abbreviated command options.', function() {
    expect(parse({ cliArgs: ['s', 's', '-p', '80'] }).commandOptions).to.include({
      port: 80
    });
  });

  it('parseCLIArgs() should set default option values.', function() {
    expect(parse({ cliArgs: ['s']}).commandOptions).to.include({
      port: 4200
    });
  });

  it('parseCLIArgs() should print a message if a required option is missing.', function() {
    expect(parse({ cliArgs: ['develop-ember-cli']})).to.be.null;
    expect(output.shift()).to.match(/requires the option.*package-name/);
  });

  it('parseCLIArgs() should print a message if a task cannot need the presence/absence of a project.', function() {
    output = [];

    // Inside project
    expect(parse({ cliArgs: ['inside-project']})).to.exist;
    expect(parse({ cliArgs: ['outside-project']})).to.be.null;
    expect(output.shift()).to.match(/You cannot use.*inside an ember-cli project/);
    expect(parse({ cliArgs: ['everywhere']})).to.exist;

    // Outside project
    expect(parse({ cliArgs: ['inside-project'], project: null })).to.null;
    expect(output.shift()).to.match(/You have to be inside an ember-cli project/);
    expect(parse({ cliArgs: ['outside-project'], project: null })).to.be.exist;
    expect(parse({ cliArgs: ['everywhere'], project: null })).to.exist;
  });
});
