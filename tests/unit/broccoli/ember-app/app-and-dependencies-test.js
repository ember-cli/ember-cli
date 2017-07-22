'use strict';

const td = require('testdouble');
const co = require('co');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const EmberApp = require('../../../../lib/broccoli/ember-app');
const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;
const walkSync = require('walk-sync');
const experiments = require("../../../../lib/experiments/index.js");

describe('EmberApp#appAndDependencies', function() {
  let input;

  beforeEach(co.wrap(function *() {
    process.env.EMBER_ENV = 'development';

    input = yield createTempDir();

    input.write({
      'node_modules': {
        'fake-template-preprocessor': {
          'package.json': JSON.stringify({
            name: 'fake-template-preprocessor',
            main: 'index.js',
            keywords: ['ember-addon'],
          }),
          'index.js': `
             module.exports = {
               name: 'fake-template-preprocessor',
               setupPreprocessorRegistry(type, registry) {
                 registry.add('template', { ext: 'hbs', toTree(tree) { return tree; } }  )
               }
             }
          `,
        },
      },
      'config': {
        'environment.js': `module.exports = function() { return { modulePrefix: 'test-app' }; };`,
      },
    });
  }));

  afterEach(function() {
    delete process.env.EMBER_ENV;
    return input.dispose();
  });

  function createApp(options) {
    options = options || {};

    let pkg = { name: 'ember-app-test', dependencies: { 'fake-template-preprocessor': '*' } };

    let cli = new MockCLI();
    let project = new Project(input.path(), pkg, cli.ui, cli);

    return new EmberApp({
      project,
      name: pkg.name,
      _ignoreMissingLoader: true,
      sourcemaps: { enabled: false },
    }, options);
  }

  function getFiles(path) {
    return walkSync(path, {
      ignore: ['vendor/ember-cli/**/*'],
      directories: false,
    });
  }

  it('results in a tree containing final loose modules', co.wrap(function *() {
    input.write({
      'app': {
        'index.html': 'foobar',
        'routes': {
          'application.js': 'export default class { }',
        },
        'templates': {
          'application.hbs': 'hi hi',
        },
      },
    });

    let app = createApp();
    let output = yield buildOutput(app.appAndDependencies());
    let actualFiles = getFiles(output.path());

    expect(actualFiles).to.deep.equal([
      'ember-app-test/config/environments/development.json',
      'ember-app-test/config/environments/test.json',
      'ember-app-test/index.html',
      'ember-app-test/routes/application.js',
      'ember-app-test/templates/application.hbs',
    ]);
  }));

  describe('dependencies tree hooks', function() {
    beforeEach(function() {
      input.write({
        'app': {
          'index.html': 'foobar',
          'routes': {
            'application.js': 'export default class { }',
          },
          'templates': {
            'application.hbs': 'hi hi',
          },
        },
      });
    });

    it('`_preMergeJavascript` is called with an array of trees if defined', function() {
      let app = createApp();

      app._preMergeJavascript = td.function();

      app.appAndDependencies();

      // this test is arbitrary abit
      // mostly b/c it's a private hook and we are not sure about all the arguments
      // that are going to be passed in
      td.verify(
        app._preMergeJavascript(
          td.matchers.anything(),
          td.matchers.anything(),
          td.matchers.anything(),
          td.matchers.anything(),
          td.matchers.anything(),
          td.matchers.anything(),
          td.matchers.anything(),
          td.matchers.anything()
        )
      );
    });

    it('`_processedTemplatesTree` is called with addon template trees and app template tree', function() {
      let app = createApp();

      app._processedTemplatesTree = td.function();

      app.appAndDependencies();

      td.verify(
        app._processedTemplatesTree(
          td.matchers.argThat(n => n.length >= 1),
          td.matchers.isA(Object)
        )
      );
    });

    it('`_mergeAddonTrees` is called with addon app trees', function() {
      let app = createApp();

      app._mergeAddonTrees = td.function();

      app.appAndDependencies();

      td.verify(
        app._mergeAddonTrees(
          td.matchers.argThat(n => n.length >= 1)
        )
      );
    });

    it('`_processedVendorTree` is called with addon vendor trees', function() {
      let app = createApp();

      app._processedVendorTree = td.function();

      app.appAndDependencies();

      td.verify(
        app._processedVendorTree(
          td.matchers.argThat(n => n.length >= 1)
        )
      );
    });

    it('`_processedAppTree` is called with addon app trees and app tree', function() {
      let app = createApp();

      app._processedAppTree = td.function();

      app.appAndDependencies();

      td.verify(
        app._processedAppTree(
          td.matchers.argThat(n => n.length >= 1),
          td.matchers.isA(Object)
        )
      );
    });

    it('`_processedExternalTree` is called with vendor, bower, addon and node modules trees', function() {
      let app = createApp();

      app._processedExternalTree = td.function();

      app.appAndDependencies();

      td.verify(
        app._processedExternalTree(
          td.matchers.isA(Object),
          undefined,
          td.matchers.isA(Object),
          td.matchers.isA(Object)
        )
      );
    });
  });

  if (experiments.MODULE_UNIFICATION) {
    it('`_processedSrcTree` is called with addon src tree', function() {
      input.write({
        'src': {
          'ui': {
            'index.html': 'foobar',
            'routes': {
              'application': {
                'route.js': 'export default class { }',
                'template.hbs': 'hi hi',
              },
            },
          },
        },
      });

      let app = createApp();

      app._processedSrcTree = td.function();

      app.appAndDependencies();

      td.verify(
        app._processedSrcTree(
          td.matchers.isA(Object)
        )
      );
    });

    it('works properly without an app directory', co.wrap(function *() {
      input.write({
        'src': {
          'ui': {
            'index.html': 'foobar',
            'routes': {
              'application': {
                'route.js': 'export default class { }',
                'template.hbs': 'hi hi',
              },
            },
          },
        },
      });

      let app = createApp();
      let output = yield buildOutput(app.appAndDependencies());
      let actualFiles = getFiles(output.path());

      expect(actualFiles).to.deep.equal([
        'ember-app-test/config/environments/development.json',
        'ember-app-test/config/environments/test.json',
        'ember-app-test/src/ui/index.html',
        'ember-app-test/src/ui/routes/application/route.js',
        'ember-app-test/src/ui/routes/application/template.hbs',
      ]);
    }));

    it('merges src with with app', co.wrap(function *() {
      input.write({
        'app': {
          'routes': {
            'index.js': 'export default class {}',
          },
        },
        'src': {
          'ui': {
            'index.html': 'foobar',
            'routes': {
              'application': {
                'route.js': 'export default class { }',
                'template.hbs': 'hi hi',
              },
            },
          },
        },
      });

      let app = createApp();
      let output = yield buildOutput(app.appAndDependencies());
      let actualFiles = getFiles(output.path());

      expect(actualFiles).to.deep.equal([
        'ember-app-test/config/environments/development.json',
        'ember-app-test/config/environments/test.json',
        'ember-app-test/routes/index.js',
        'ember-app-test/src/ui/index.html',
        'ember-app-test/src/ui/routes/application/route.js',
        'ember-app-test/src/ui/routes/application/template.hbs',
      ]);
    }));
  }
});
