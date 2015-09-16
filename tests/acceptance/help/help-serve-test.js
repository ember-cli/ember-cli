/*jshint multistr: true */

'use strict';

var path              = require('path');
var tmp               = require('tmp-sync');
var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var ember             = require('../../helpers/ember');
var processHelpString = require('../../helpers/process-help-string');
var Promise           = require('../../../lib/ext/promise');
var remove            = Promise.denodeify(require('fs-extra').remove);
var root              = process.cwd();
var tmproot           = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help serve', function() {
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
      'serve'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
ember serve \u001b[36m<options...>\u001b[39m' + EOL + '\
  Builds and serves your app, rebuilding on file changes.' + EOL + '\
  \u001b[90maliases: server, s\u001b[39m' + EOL + '\
  \u001b[36m--port\u001b[39m \u001b[36m(Number)\u001b[39m \u001b[36m(Default: 4200)\u001b[39m' + EOL + '\
    Change port from default' + EOL + '\
    \u001b[90maliases: -p <value>\u001b[39m' + EOL + '\
  \u001b[36m--host\u001b[39m \u001b[36m(String)\u001b[39m' + EOL + '\
    Specify host, listens on all interfaces by default' + EOL + '\
    \u001b[90maliases: -H <value>\u001b[39m' + EOL + '\
  \u001b[36m--proxy\u001b[39m \u001b[36m(String)\u001b[39m' + EOL + '\
    Proxy to specified API server' + EOL + '\
    \u001b[90maliases: -pr <value>, -pxy <value>\u001b[39m' + EOL + '\
  \u001b[36m--insecure-proxy\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Set false to proxy self-signed SSL certificates' + EOL + '\
    \u001b[90maliases: -inspr\u001b[39m' + EOL + '\
  \u001b[36m--watcher\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: events)\u001b[39m' + EOL + '\
    Set file watcher' + EOL + '\
    \u001b[90maliases: -w <value>\u001b[39m' + EOL + '\
  \u001b[36m--live-reload\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: true)\u001b[39m' + EOL + '\
    Disable live reload' + EOL + '\
    \u001b[90maliases: -lr\u001b[39m' + EOL + '\
  \u001b[36m--live-reload-host\u001b[39m \u001b[36m(String)\u001b[39m' + EOL + '\
    Set live reload host (defaults to host)' + EOL + '\
    \u001b[90maliases: -lrh <value>\u001b[39m' + EOL + '\
  \u001b[36m--live-reload-port\u001b[39m \u001b[36m(Number)\u001b[39m' + EOL + '\
    Set live reload port  (Defaults to port number within [49152...65535] )' + EOL + '\
    \u001b[90maliases: -lrp <value>\u001b[39m' + EOL + '\
  \u001b[36m--environment\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: development)\u001b[39m' + EOL + '\
    Build environment' + EOL + '\
    \u001b[90maliases: -e <value>, -dev (--environment=development), -prod (--environment=production)\u001b[39m' + EOL + '\
  \u001b[36m--output-path\u001b[39m \u001b[36m(Path)\u001b[39m \u001b[36m(Default: dist/)\u001b[39m' + EOL + '\
    Specify build path' + EOL + '\
    \u001b[90maliases: -op <value>, -out <value>\u001b[39m' + EOL + '\
  \u001b[36m--ssl\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Use SSL' + EOL + '\
  \u001b[36m--ssl-key\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: ssl/server.key)\u001b[39m' + EOL + '\
    Custom SSL Key' + EOL + '\
  \u001b[36m--ssl-cert\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: ssl/server.crt)\u001b[39m' + EOL + '\
    Custom SSL Certificate');

      expect(output).to.include(testString);
    });
  });

  it('works with alias server', function() {
    return ember([
      'help',
      'server'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember serve \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });

  it('works with alias s', function() {
    return ember([
      'help',
      's'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember serve \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
