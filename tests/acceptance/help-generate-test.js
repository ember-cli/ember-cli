'use strict';

var path       = require('path');
var tmp        = require('tmp-sync');
var expect     = require('chai').expect;
var runCommand = require('../helpers/run-command');
var Promise    = require('../../lib/ext/promise');
var remove     = Promise.denodeify(require('fs-extra').remove);
var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var ember      = path.join(root, 'bin', 'ember');
var tmpdir;

describe('Acceptance: ember help generate', function() {
  this.timeout(40000);

  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  it('it works', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, 'help', 'generate', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('ember generate <blueprint> <options...>');
        expect(output).to.include('  Generates new code from blueprints.');
        expect(output).to.include('  aliases: g');
        expect(output).to.include('  --dry-run (Boolean) (Default: false)');
        expect(output).to.include('    aliases: -d');
        expect(output).to.include('  --verbose (Boolean) (Default: false)');
        expect(output).to.include('    aliases: -v');
        expect(output).to.include('  --pod (Boolean) (Default: false)');
        expect(output).to.include('    aliases: -p');
        expect(output).to.include('  --dummy (Boolean) (Default: false)');
        expect(output).to.include('    aliases: -dum, -id');
        expect(output).to.include('  --in-repo-addon (String) (Default: null)');
        expect(output).to.include('    aliases: -in-repo <value>, -ir <value>');
      });
  });

  it('generate lists blueprints', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, 'help', 'generate', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('Available blueprints:');
        expect(output).to.include('ember-cli:');
        expect(output).to.include('  acceptance-test');
        expect(output).to.include('  adapter');
        expect(output).to.include('  adapter-test');
        expect(output).to.include('  addon');
        expect(output).to.include('  addon-import');
        expect(output).to.include('  app');
        expect(output).to.include('  blueprint');
        expect(output).to.include('  component');
        expect(output).to.include('  component-addon');
        expect(output).to.include('  component-test');
        expect(output).to.include('  controller');
        expect(output).to.include('  controller-test');
        expect(output).to.include('  helper');
        expect(output).to.include('  helper-addon');
        expect(output).to.include('  helper-test');
        expect(output).to.include('  http-mock');
        expect(output).to.include('  http-proxy');
        expect(output).to.include('  in-repo-addon');
        expect(output).to.include('  initializer');
        expect(output).to.include('  initializer-addon');
        expect(output).to.include('  initializer-test');
        expect(output).to.include('  lib');
        expect(output).to.include('  mixin');
        expect(output).to.include('  mixin-test');
        expect(output).to.include('  model');
        expect(output).to.include('  model-test');
        expect(output).to.include('  resource');
        expect(output).to.include('  route');
        expect(output).to.include('  route-addon');
        expect(output).to.include('  route-test');
        expect(output).to.include('  serializer');
        expect(output).to.include('  serializer-test');
        expect(output).to.include('  server');
        expect(output).to.include('  service');
        expect(output).to.include('  service-test');
        expect(output).to.include('  template');
        expect(output).to.include('  test-helper');
        expect(output).to.include('  transform');
        expect(output).to.include('  transform-test');
        expect(output).to.include('  util');
        expect(output).to.include('  util-test');
        expect(output).to.include('  view');
        expect(output).to.include('  view-test');
      });
  });

  it('generate check for various options', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, 'help', 'generate', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include(' <name>');
        expect(output).to.include(' <options...>');
        expect(output).to.include('aliases: ');
        expect(output).to.include(' (Default: ');
      });
  });

  it('generate lists overridden blueprints', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, 'generate', 'blueprint', 'component', '--silent', '--skip-installation-check');
      })
      .then(function() {
        return runCommand(ember, 'help', 'generate', '--verbose', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('my-app:');
        expect(output).to.include('  component');
        expect(output).to.include('ember-cli:');
        expect(output).to.include('  (overridden) component');
      });
  });

  it('generate missing blueprint', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, 'help', 'generate', 'asdf', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('The \'asdf\' blueprint does not exist in this project.');
      });
  });

  it('generate model', function() {
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower',
                      '--skip-git',
                      '--skip-installation-check')
      .then(function() {
        return runCommand(ember, 'help', 'generate', 'model', '--skip-installation-check', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('You may generate models with as many attrs as ' +
        'you would like to pass. The following attribute types are supported:');
        expect(output).to.include('<attr-name>');
        expect(output).to.include('<attr-name>:array');
        expect(output).to.include('<attr-name>:boolean');
        expect(output).to.include('<attr-name>:date');
        expect(output).to.include('<attr-name>:object');
        expect(output).to.include('<attr-name>:number');
        expect(output).to.include('<attr-name>:string');
        expect(output).to.include('<attr-name>:belongs-to:<model-name>');
        expect(output).to.include('<attr-name>:has-many:<model-name>');
      });
  });
});
