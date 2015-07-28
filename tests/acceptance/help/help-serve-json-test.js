'use strict';

var path          = require('path');
var tmp           = require('tmp-sync');
var expect        = require('chai').expect;
var ember         = require('../../helpers/ember');
var convertToJson = require('../../helpers/convert-help-output-to-json');
var Promise       = require('../../../lib/ext/promise');
var remove        = Promise.denodeify(require('fs-extra').remove);
var root          = process.cwd();
var tmproot       = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help --json serve', function() {
  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  it('works', function() {
    return ember([
      'help',
      'serve',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

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
            default: '0.0.0.0',
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
            description: '(Defaults to port number within [49152...65535] )',
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
    return ember([
      'help',
      'server',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('serve');
    });
  });

  it('works with alias s', function() {
    return ember([
      'help',
      's',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('serve');
    });
  });
});
