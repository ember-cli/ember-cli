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
  let input, output;

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
                registry.add('template', {
                  isDefaultForType: true,
                  name: 'fake-template-preprocessor',
                  ext: 'hbs',
                  toTree(tree) { return tree; }
                });
              }
            };
          `,
        },
      },
      'config': {
        'environment.js': `module.exports = function() { return { modulePrefix: 'test-app' }; };`,
      },
    });
  }));

  afterEach(co.wrap(function *() {
    delete process.env.EMBER_ENV;
    yield input.dispose();

    if (output) {
      yield output.dispose();
    }
  }));

  function createApp(options) {
    options = options || {};

    let pkg = {
      name: 'ember-app-test',
      dependencies: {
        'fake-template-preprocessor': '*',
        'my-addon': '*',
      },
    };

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
    output = yield buildOutput(app.appAndDependencies());
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
      output = yield buildOutput(app.appAndDependencies());
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
      output = yield buildOutput(app.appAndDependencies());
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

  it('moduleNormalizerDisabled', co.wrap(function *() {
    input.write({
      'node_modules': {
        'my-addon': {
          'addon': {
            'index.js': `define('amd', function() {});`,
          },
          'package.json': JSON.stringify({
            name: 'my-addon',
            main: 'index.js',
            keywords: ['ember-addon'],
          }),
          'index.js': `
            module.exports = {
              name: 'my-addon',
              setupPreprocessorRegistry(type, registry) {
                registry.add('template', { ext: 'hbs', toTree(tree) { return tree; } });
                registry.add('js', { ext: 'js', toTree(tree) { return tree; } });
              },
            }
          `,
        },
      },
    });

    let app = createApp({
      moduleNormalizerDisabled: true,
    });

    let addon = app.project.findAddonByName('my-addon');

    addon.treeForAddon = tree => {
      const Funnel = require('broccoli-funnel');
      return new Funnel(tree, {
        destDir: 'modules/my-addon',
      });
    };

    output = yield buildOutput(app.appAndDependencies());
    let actualFiles = getFiles(output.path());

    expect(actualFiles).to.contain(
      'addon-modules/modules/my-addon/index.js'
    );
  }));

  it('amdFunnelDisabled', co.wrap(function *() {
    input.write({
      'node_modules': {
        'my-addon': {
          'addon': {
            'index.js': `define('amd', function() {});`,
          },
          'package.json': JSON.stringify({
            name: 'my-addon',
            main: 'index.js',
            keywords: ['ember-addon'],
          }),
          'index.js': `
            module.exports = {
              name: 'my-addon',
              setupPreprocessorRegistry(type, registry) {
                registry.add('template', { ext: 'hbs', toTree(tree) { return tree; } });
                registry.add('js', { ext: 'js', toTree(tree) { return tree; } });
              },
            }
          `,
        },
      },
    });

    let app = createApp({
      amdFunnelDisabled: true,
    });

    let tree;

    app.registry.add('js', {
      ext: 'js',
      toTree(_tree) {
        tree = _tree;
        return _tree;
      },
    });

    app.addonTree();

    output = yield buildOutput(tree);
    let actualFiles = getFiles(output.path());

    expect(actualFiles).to.deep.equal([
      'my-addon/index.js',
    ]);
  }));

  it('uses preprocessor that is marked by default', co.wrap(function *() {
    let app = createApp();

    app.registry.add('js', {
      ext: 'js',
      name: 'addon1',
      isDefaultForType: true,
      toTree(tree) {
        return tree;
      },
    });

    app.registry.add('js', {
      ext: 'js',
      name: 'addon2',
      toTree(tree) {
        expect(true).to.equal(false);
        return tree;
      },
    });

    yield buildOutput(app.addonTree());
  }));

  it('uses all registered preprocessors if none is marked by default', co.wrap(function *() {
    let count = 0;
    let app = createApp();

    app.registry.add('js', {
      ext: 'js',
      name: 'addon1',
      toTree(tree) {
        count++;
        return tree;
      },
    });

    app.registry.add('js', {
      ext: 'js',
      name: 'addon2',
      toTree(tree) {
        count++;
        return tree;
      },
    });

    yield buildOutput(app.addonTree());

    expect(count).to.equal(2);
  }));

  it('throws an exception if more than one preprocessor is marked as default', co.wrap(function *() {
    let exceptionMessage;
    let app = createApp();

    app.registry.add('template', {
      ext: 'hbs',
      name: 'faulty-addon',
      isDefaultForType: true,
      toTree(tree) {
        return tree;
      },
    });

    yield co(function *() {
      output = yield buildOutput(app.addonTree());
    }).catch(e => {
      exceptionMessage = e.message;
    }).then(() => {
      expect(exceptionMessage).to.equal(
        `There are multiple preprocessor plugins marked as default for 'template': fake-template-preprocessor, faulty-addon`
      );
    });
  }));
});
