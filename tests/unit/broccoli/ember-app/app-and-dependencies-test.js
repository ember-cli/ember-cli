'use strict';

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

  if (experiments.MODULE_UNIFICATION) {
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
