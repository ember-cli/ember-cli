'use strict';

var path       = require('path');
var remove     = require('fs-extra').remove;
var tmp        = require('tmp-sync');
var expect     = require('chai').expect;
var runCommand = require('../helpers/run-command');

var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var ember      = path.join(root, 'bin', 'ember');
var tmpdir;

describe('Acceptance: ember help', function() {
  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function(done) {
    process.chdir(root);
    remove(tmproot, done);
  });

  it('generate lists blueprints', function() {
    this.timeout(10000);
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower')
      .then(function() {
        return runCommand(ember, 'generate', 'blueprint', 'component', '--silent');
      })
      .then(function() {
        return runCommand(ember, 'help', 'generate', '--verbose', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('my-app:');
        expect(output).to.include('  component');
        expect(output).to.include('ember-cli:');
        expect(output).to.include('  acceptance-test');
        expect(output).to.include('  adapter');
        expect(output).to.include('  app');
        expect(output).to.include('  blueprint');
        expect(output).to.include('  (overridden) component');
        expect(output).to.include('  controller');
        expect(output).to.include('  helper');
        expect(output).to.include('  http-mock');
        expect(output).to.include('  http-proxy');
        expect(output).to.include('  initializer');
        expect(output).to.include('  mixin');
        expect(output).to.include('  resource');
        expect(output).to.include('  route');
        expect(output).to.include('  service');
        expect(output).to.include('  template');
        expect(output).to.include('  util');
        expect(output).to.include('  view');
      });
  });

  it('generate single blueprint', function() {
    this.timeout(10000);
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower')
      .then(function() {
        return runCommand(ember, 'help', 'generate', 'model', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('Generates new code from blueprints.');
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

  it('generate single blueprint --help', function() {
    this.timeout(10000);
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower')
      .then(function() {
        return runCommand(ember, 'generate', 'model', '--help', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('Generates new code from blueprints.');
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

  it('generate single blueprint -h', function() {
    this.timeout(10000);
    var output = '';

    return runCommand(ember, 'init',
                      '--name=my-app',
                      '--silent',
                      '--skip-npm',
                      '--skip-bower')
      .then(function() {
        return runCommand(ember, 'generate', 'model', '-h', {
          onOutput: function(string) {
            output += string;
          }
        });
      })
      .then(function() {
        expect(output).to.include('Generates new code from blueprints.');
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
