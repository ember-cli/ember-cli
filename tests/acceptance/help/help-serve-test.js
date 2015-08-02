/*jshint multistr: true */

'use strict';

var path    = require('path');
var tmp     = require('tmp-sync');
var expect  = require('chai').expect;
var EOL     = require('os').EOL;
var ember   = require('../../helpers/ember');
var Promise = require('../../../lib/ext/promise');
var remove  = Promise.denodeify(require('fs-extra').remove);
var root    = process.cwd();
var tmproot = path.join(root, 'tmp');
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

      expect(output).to.include(EOL + '\
ember serve\u001b[36m <options...>\u001b[39m' + EOL + '\
  Builds and serves your app, rebuilding on file changes.' + EOL + '\
\u001b[90m  aliases: server, s' + EOL + '\
\u001b[39m\u001b[36m  --port\u001b[39m\u001b[36m (Number)\u001b[39m\u001b[36m (Default: 4200)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -p <value>\u001b[39m' + EOL + '\
\u001b[36m  --host\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: 0.0.0.0)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -H <value>\u001b[39m' + EOL + '\
\u001b[36m  --proxy\u001b[39m\u001b[36m (String)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -pr <value>, -pxy <value>\u001b[39m' + EOL + '\
\u001b[36m  --insecure-proxy\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m Set false to proxy self-signed SSL certificates\u001b[90m' + EOL + '\
    aliases: -inspr\u001b[39m' + EOL + '\
\u001b[36m  --watcher\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: events)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -w <value>\u001b[39m' + EOL + '\
\u001b[36m  --live-reload\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: true)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -lr\u001b[39m' + EOL + '\
\u001b[36m  --live-reload-host\u001b[39m\u001b[36m (String)\u001b[39m Defaults to host\u001b[90m' + EOL + '\
    aliases: -lrh <value>\u001b[39m' + EOL + '\
\u001b[36m  --live-reload-port\u001b[39m\u001b[36m (Number)\u001b[39m (Defaults to port number within [49152...65535] )\u001b[90m' + EOL + '\
    aliases: -lrp <value>\u001b[39m' + EOL + '\
\u001b[36m  --environment\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: development)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -e <value>, -dev (--environment=development), -prod (--environment=production)\u001b[39m' + EOL + '\
\u001b[36m  --output-path\u001b[39m\u001b[36m (Path)\u001b[39m\u001b[36m (Default: dist/)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -op <value>, -out <value>\u001b[39m' + EOL + '\
\u001b[36m  --ssl\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m' + EOL + '\
\u001b[36m  --ssl-key\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: ssl/server.key)\u001b[39m' + EOL + '\
\u001b[36m  --ssl-cert\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: ssl/server.crt)\u001b[39m' + EOL);
    });
  });

  it('works with alias server', function() {
    return ember([
      'help',
      'server'
    ])
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include('ember serve\u001b[36m <options...>\u001b[39m');
    });
  });

  it('works with alias s', function() {
    return ember([
      'help',
      's'
    ])
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include('ember serve\u001b[36m <options...>\u001b[39m');
    });
  });
});
