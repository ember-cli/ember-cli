'use strict';

var expect        = require('chai').expect;
var MockUI        = require('../../../helpers/mock-ui');
var MockAnalytics = require('../../../helpers/mock-analytics');
var convertToJson = require('../../../helpers/convert-help-output-to-json');
var HelpCommand   = require('../../../../lib/commands/help');
var ServeCommand  = require('../../../../lib/commands/serve');

describe('help command: serve json', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Serve': ServeCommand
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    command = new HelpCommand(options);
  });

  it('works', function() {
    return command.validateAndRun(['serve', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'serve',
        description: 'Builds and serves your app, rebuilding on file changes.',
        aliases: ['server', 's'],
        works: 'insideProject',
        availableOptions: [
          {
            name: 'port',
            default: 4200,
            aliases: ['p'],
            key: 'port',
            required: false
          },
          {
            name: 'host',
            description: 'Listens on all interfaces by default',
            aliases: ['H'],
            key: 'host',
            required: false
          },
          {
            name: 'proxy',
            aliases: ['pr', 'pxy'],
            key: 'proxy',
            required: false
          },
          {
            name: 'insecure-proxy',
            default: false,
            description: 'Set false to proxy self-signed SSL certificates',
            aliases: ['inspr'],
            key: 'insecureProxy',
            required: false
          },
          {
            name: 'watcher',
            default: 'events',
            aliases: ['w'],
            key: 'watcher',
            required: false
          },
          {
            name: 'live-reload',
            default: true,
            aliases: ['lr'],
            key: 'liveReload',
            required: false
          },
          {
            name: 'live-reload-host',
            description: 'Defaults to host',
            aliases: ['lrh'],
            key: 'liveReloadHost',
            required: false
          },
          {
            name: 'live-reload-port',
            description: '(Defaults to port number within [49152...65535])',
            aliases: ['lrp'],
            key: 'liveReloadPort',
            required: false
          },
          {
            name: 'environment',
            default: 'development',
            aliases: [
              'e',
              { dev: 'development' },
              { prod: 'production' }
            ],
            key: 'environment',
            required: false
          },
          {
            name: 'output-path',
            type: 'path',
            default: 'dist/',
            aliases: ['op', 'out'],
            key: 'outputPath',
            required: false
          },
          {
            name: 'ssl',
            default: false,
            key: 'ssl',
            required: false
          },
          {
            name: 'ssl-key',
            default: 'ssl/server.key',
            key: 'sslKey',
            required: false
          },
          {
            name: 'ssl-cert',
            default: 'ssl/server.crt',
            key: 'sslCert',
            required: false
          }
        ],
        anonymousOptions: []
      });
    });
  });

  it('works with alias server', function() {
    return command.validateAndRun(['server', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('serve');
    });
  });

  it('works with alias s', function() {
    return command.validateAndRun(['s', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('serve');
    });
  });
});
