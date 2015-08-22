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

describe('Acceptance: ember help generate', function() {
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
      'generate'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
ember generate \u001b[33m<blueprint>\u001b[39m\u001b[36m <options...>\u001b[39m' + EOL + '\
  Generates new code from blueprints.' + EOL + '\
\u001b[90m  aliases: g' + EOL + '\
\u001b[39m\u001b[36m  --dry-run\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -d\u001b[39m' + EOL + '\
\u001b[36m  --verbose\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -v\u001b[39m' + EOL + '\
\u001b[36m  --pod\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -p\u001b[39m' + EOL + '\
\u001b[36m  --classic\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -c\u001b[39m' + EOL + '\
\u001b[36m  --dummy\u001b[39m\u001b[36m (Boolean)\u001b[39m\u001b[36m (Default: false)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -dum, -id\u001b[39m' + EOL + '\
\u001b[36m  --in-repo-addon\u001b[39m\u001b[36m (String)\u001b[39m\u001b[36m (Default: null)\u001b[39m\u001b[90m' + EOL + '\
    aliases: -in-repo <value>, -ir <value>\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias g', function() {
    return ember([
      'help',
      'g'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('ember generate \u001b[33m<blueprint>\u001b[39m\u001b[36m <options...>\u001b[39m');

      expect(output).to.include(testString);
    });
  });

  it('lists blueprints', function() {
    return ember([
      'help',
      'generate'
    ])
    .then(function(result) {
      var output = result.ui.output;

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

  it('lists overridden blueprints', function() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
      return ember([
        'generate',
        'blueprint',
        'component'
      ]);
    })
    .then(function() {
      return ember([
        'help',
        'generate',
        '--verbose'
      ]);
    })
    .then(function(result) {
      var output = result.ui.output;

      expect(output).to.include('    my-app:');
      expect(output).to.include(processHelpString('      component \u001b[33m<name>\u001b[39m'));
      expect(output).to.include('    ember-cli:');
      expect(output).to.include(processHelpString('      \u001b[90m(overridden) \u001b[39m\u001b[90mcomponent\u001b[39m'));
    });
  });

  it('handles missing blueprint', function() {
    return ember([
      'help',
      'generate',
      'asdf'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('The \'asdf\' blueprint does not exist in this project.');

      expect(output).to.include(testString);
    });
  });

  it('works with single blueprint', function() {
    return ember([
      'help',
      'generate',
      'model'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
      model \u001b[33m<name>\u001b[39m \u001b[33m<attr:type>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data model.\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('handles extra help', function() {
    return ember([
      'help',
      'generate',
      'model'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString('\u001b[90mYou may generate models with as many attrs as you would like to pass. The following attribute types are supported:\u001b[39m\n\
        \u001b[33m<attr-name>\u001b[39m\n\
        \u001b[33m<attr-name>\u001b[39m:array\n\
        \u001b[33m<attr-name>\u001b[39m:boolean\n\
        \u001b[33m<attr-name>\u001b[39m:date\n\
        \u001b[33m<attr-name>\u001b[39m:object\n\
        \u001b[33m<attr-name>\u001b[39m:number\n\
        \u001b[33m<attr-name>\u001b[39m:string\n\
        \u001b[33m<attr-name>\u001b[39m:your-custom-transform\n\
        \u001b[33m<attr-name>\u001b[39m:belongs-to:\u001b[33m<model-name>\u001b[39m\n\
        \u001b[33m<attr-name>\u001b[39m:has-many:\u001b[33m<model-name>\u001b[39m');

      expect(output).to.include(testString);
    });
  });
});
