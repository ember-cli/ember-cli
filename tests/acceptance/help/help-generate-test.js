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
ember generate \u001b[33m<blueprint>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
  Generates new code from blueprints.' + EOL + '\
  \u001b[90maliases: g\u001b[39m' + EOL + '\
  \u001b[36m--dry-run\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Dry run, simulate blueprint generation without affecting your project' + EOL + '\
    \u001b[90maliases: -d\u001b[39m' + EOL + '\
  \u001b[36m--verbose\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Verbose output' + EOL + '\
    \u001b[90maliases: -v\u001b[39m' + EOL + '\
  \u001b[36m--pod\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Generate blueprint in pod structure' + EOL + '\
    \u001b[90maliases: -p\u001b[39m' + EOL + '\
  \u001b[36m--classic\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Generate blueprint in classic structure' + EOL + '\
    \u001b[90maliases: -c\u001b[39m' + EOL + '\
  \u001b[36m--dummy\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    Generate blueprint in `tests/dummy` when inside an addon project' + EOL + '\
    \u001b[90maliases: -dum, -id\u001b[39m' + EOL + '\
  \u001b[36m--in-repo-addon\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: null)\u001b[39m' + EOL + '\
    Generate blueprint in specified in-repo-addon when inside a project' + EOL + '\
    \u001b[90maliases: -in-repo <value>, -ir <value>\u001b[39m' + EOL + '\
' + EOL + '\
' + EOL + '\
  Available blueprints:' + EOL + '\
    ember-cli:' + EOL + '\
      acceptance-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an acceptance test for a feature.\u001b[39m' + EOL + '\
      adapter \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data adapter.\u001b[39m' + EOL + '\
        \u001b[36m--base-class\u001b[39m' + EOL + '\
      adapter-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data adapter unit test\u001b[39m' + EOL + '\
      addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mThe default blueprint for ember-cli addons.\u001b[39m' + EOL + '\
      addon-import \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an import wrapper.\u001b[39m' + EOL + '\
      app \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mThe default blueprint for ember-cli projects.\u001b[39m' + EOL + '\
      blueprint \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a blueprint and definition.\u001b[39m' + EOL + '\
      component \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a component. Name must contain a hyphen.\u001b[39m' + EOL + '\
        \u001b[36m--path\u001b[39m \u001b[36m(Default: components)\u001b[39m' + EOL + '\
          \u001b[90maliases: -no-path (--path=)\u001b[39m' + EOL + '\
      component-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a component. Name must contain a hyphen.\u001b[39m' + EOL + '\
      component-test \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a component integration or unit test.\u001b[39m' + EOL + '\
        \u001b[36m--test-type\u001b[39m \u001b[36m(Default: integration)\u001b[39m' + EOL + '\
          \u001b[90maliases: -i (--test-type=integration), -u (--test-type=unit), -integration (--test-type=integration), -unit (--test-type=unit)\u001b[39m' + EOL + '\
      controller \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a controller.\u001b[39m' + EOL + '\
      controller-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a controller unit test.\u001b[39m' + EOL + '\
      helper \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a helper function.\u001b[39m' + EOL + '\
      helper-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an import wrapper.\u001b[39m' + EOL + '\
      helper-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a helper unit test.\u001b[39m' + EOL + '\
      http-mock \u001b[33m<endpoint-path>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a mock api endpoint in /api prefix.\u001b[39m' + EOL + '\
      http-proxy \u001b[33m<local-path>\u001b[39m \u001b[33m<remote-url>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a relative proxy to another server.\u001b[39m' + EOL + '\
      in-repo-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mThe blueprint for addon in repo ember-cli addons.\u001b[39m' + EOL + '\
      initializer \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an initializer.\u001b[39m' + EOL + '\
      initializer-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an import wrapper.\u001b[39m' + EOL + '\
      initializer-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an initializer unit test.\u001b[39m' + EOL + '\
      lib \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a lib directory for in-repo addons.\u001b[39m' + EOL + '\
      mixin \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a mixin.\u001b[39m' + EOL + '\
      mixin-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a mixin unit test.\u001b[39m' + EOL + '\
      model \u001b[33m<name>\u001b[39m \u001b[33m<attr:type>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data model.\u001b[39m' + EOL + '\
      model-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a model unit test.\u001b[39m' + EOL + '\
      resource \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a model and route.\u001b[39m' + EOL + '\
      route \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a route and registers it with the router.\u001b[39m' + EOL + '\
        \u001b[36m--path\u001b[39m \u001b[36m(Default: )\u001b[39m' + EOL + '\
        \u001b[36m--skip-router\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
      route-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates import wrappers for a route and its template.\u001b[39m' + EOL + '\
      route-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a route unit test.\u001b[39m' + EOL + '\
      serializer \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data serializer.\u001b[39m' + EOL + '\
      serializer-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a serializer unit test.\u001b[39m' + EOL + '\
      server \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a server directory for mocks and proxies.\u001b[39m' + EOL + '\
      service \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a service.\u001b[39m' + EOL + '\
      service-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a service unit test.\u001b[39m' + EOL + '\
      template \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a template.\u001b[39m' + EOL + '\
      test-helper \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a test helper.\u001b[39m' + EOL + '\
      transform \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data value transform.\u001b[39m' + EOL + '\
      transform-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a transform unit test.\u001b[39m' + EOL + '\
      util \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a simple utility module/function.\u001b[39m' + EOL + '\
      util-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a util unit test.\u001b[39m' + EOL + '\
      view \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a view subclass.\u001b[39m' + EOL + '\
      view-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a view unit test.\u001b[39m' + EOL);

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

      var testString = processHelpString('ember generate \u001b[33m<blueprint>\u001b[39m \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
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

      var testString = processHelpString(EOL + '\
    my-app:' + EOL + '\
      component \u001b[33m<name>\u001b[39m' + EOL + '\
' + EOL + '\
    ember-cli:' + EOL);

      expect(output).to.include(testString);
      expect(output).to.include(processHelpString(EOL + '\
      \u001b[90m(overridden)\u001b[39m \u001b[90mcomponent\u001b[39m' + EOL));
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

      var testString = processHelpString(EOL + '\
\u001b[33mThe \'asdf\' blueprint does not exist in this project.\u001b[39m' + EOL + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with single blueprint', function() {
    return ember([
      'help',
      'generate',
      'component'
    ])
    .then(function(result) {
      var output = result.ui.output;

      var testString = processHelpString(EOL + '\
      component \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a component. Name must contain a hyphen.\u001b[39m' + EOL);

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

      var testString = EOL + '\
        \u001b[0m' + processHelpString('\u001b[90mYou may generate models with as many attrs as you would like to pass. The following attribute types are supported:\u001b[39m\n\
        \u001b[33m<attr-name>\u001b[39m\n\
        \u001b[33m<attr-name>\u001b[39m:array\n\
        \u001b[33m<attr-name>\u001b[39m:boolean\n\
        \u001b[33m<attr-name>\u001b[39m:date\n\
        \u001b[33m<attr-name>\u001b[39m:object\n\
        \u001b[33m<attr-name>\u001b[39m:number\n\
        \u001b[33m<attr-name>\u001b[39m:string\n\
        \u001b[33m<attr-name>\u001b[39m:your-custom-transform\n\
        \u001b[33m<attr-name>\u001b[39m:belongs-to:\u001b[33m<model-name>\u001b[39m\n\
        \u001b[33m<attr-name>\u001b[39m:has-many:\u001b[33m<model-name>\u001b[39m') + '\u001b[0m\n\
        \n\
        \u001b[0mFor instance: ' + processHelpString('\u001b[32m`ember generate model taco filling:belongs-to:protein toppings:has-many:toppings name:string price:number misc`\u001b[39m') + '\n\
        would result in the following model:\u001b[0m\n\
        \n\
        \n\
        \u001b[33m\u001b[94mimport\u001b[39m \u001b[37mDS\u001b[39m \u001b[37mfrom\u001b[39m \u001b[92m\'ember-data\'\u001b[39m\u001b[90m;\u001b[39m\n\
        \u001b[94mexport\u001b[39m \u001b[94mdefault\u001b[39m \u001b[37mDS\u001b[39m\u001b[32m.\u001b[39m\u001b[37mModel\u001b[39m\u001b[32m.\u001b[39m\u001b[37mextend\u001b[39m\u001b[90m(\u001b[39m\u001b[33m{\u001b[39m\n\
          \u001b[37mfilling\u001b[39m\u001b[93m:\u001b[39m \u001b[37mDS\u001b[39m\u001b[32m.\u001b[39m\u001b[37mbelongsTo\u001b[39m\u001b[90m(\u001b[39m\u001b[92m\'protein\'\u001b[39m\u001b[90m)\u001b[39m\u001b[32m,\u001b[39m\n\
          \u001b[37mtoppings\u001b[39m\u001b[93m:\u001b[39m \u001b[37mDS\u001b[39m\u001b[32m.\u001b[39m\u001b[37mhasMany\u001b[39m\u001b[90m(\u001b[39m\u001b[92m\'topping\'\u001b[39m\u001b[90m)\u001b[39m\u001b[32m,\u001b[39m\n\
          \u001b[37mname\u001b[39m\u001b[93m:\u001b[39m \u001b[37mDS\u001b[39m\u001b[32m.\u001b[39m\u001b[37mattr\u001b[39m\u001b[90m(\u001b[39m\u001b[92m\'string\'\u001b[39m\u001b[90m)\u001b[39m\u001b[32m,\u001b[39m\n\
          \u001b[37mprice\u001b[39m\u001b[93m:\u001b[39m \u001b[37mDS\u001b[39m\u001b[32m.\u001b[39m\u001b[37mattr\u001b[39m\u001b[90m(\u001b[39m\u001b[92m\'number\'\u001b[39m\u001b[90m)\u001b[39m\u001b[32m,\u001b[39m\n\
          \u001b[37mmisc\u001b[39m\u001b[93m:\u001b[39m \u001b[37mDS\u001b[39m\u001b[32m.\u001b[39m\u001b[37mattr\u001b[39m\u001b[90m(\u001b[39m\u001b[90m)\u001b[39m\n\
        \u001b[33m}\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m\n\
        \u001b[39m\n\
        \n\
        ' + EOL;

      expect(output).to.include(testString);
    });
  });
});
