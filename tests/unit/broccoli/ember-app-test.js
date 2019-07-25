'use strict';

const co = require('co');
const path = require('path');
const Project = require('../../../lib/models/project');
const expect = require('chai').expect;
const td = require('testdouble');
const broccoliTestHelper = require('broccoli-test-helper');
const { WatchedDir, UnwatchedDir } = require('broccoli-source');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

const MockCLI = require('../../helpers/mock-cli');
const { isExperimentEnabled } = require('../../../lib/experiments');
const mergeTrees = require('../../../lib/broccoli/merge-trees');
const BroccoliMergeTrees = require('broccoli-merge-trees');

let EmberApp = require('../../../lib/broccoli/ember-app');
const Addon = require('../../../lib/models/addon');

function mockTemplateRegistry(app) {
  let oldLoad = app.registry.load;
  app.registry.load = function(type) {
    if (type === 'template') {
      return [
        {
          toTree: tree => tree,
        },
      ];
    }
    return oldLoad.apply(app.registry, arguments);
  };
}

describe('EmberApp', function() {
  let project, projectPath, app, addon;

  function setupProject(rootPath) {
    const packageContents = require(path.join(rootPath, 'package.json'));
    let cli = new MockCLI();

    project = new Project(rootPath, packageContents, cli.ui, cli);
    project.require = function() {
      return function() {};
    };
    project.initializeAddons = function() {
      this.addons = [];
    };

    return project;
  }

  beforeEach(function() {
    projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
    project = setupProject(projectPath);
  });

  if (isExperimentEnabled('PACKAGER')) {
    describe('packager hook', function() {
      let js, input, output;

      before(
        co.wrap(function*() {
          js = yield createTempDir();
          js.write({
            fake: {
              javascript: '// javascript.js',
            },
          });
        })
      );

      beforeEach(
        co.wrap(function*() {
          input = yield createTempDir();
        })
      );

      afterEach(
        co.wrap(function*() {
          yield input.dispose();
          if (output) {
            yield output.dispose();
          }
        })
      );

      after(
        co.wrap(function*() {
          yield js.dispose();
        })
      );

      it('sets `_isPackageHookSupplied` to `false` if `package` hook is not a function', function() {
        let app = new EmberApp({
          project,
          package: false,
        });

        expect(app._isPackageHookSupplied).to.equal(false);
      });

      it('sets `_isPackageHookSupplied` to `false` if `package` hook is not supplied', function() {
        let app = new EmberApp({
          project,
        });

        expect(app._isPackageHookSupplied).to.equal(false);
      });

      it('sets `_isPackageHookSupplied` to `true` if `package` hook is supplied', function() {
        let app = new EmberApp({
          project,
          package: () => input.path(),
        });

        expect(app._isPackageHookSupplied).to.equal(true);
      });

      it(
        'overrides the output of the build',
        co.wrap(function*() {
          input.write({
            fake: {
              dist: {
                'foo.js': '// foo.js',
              },
            },
          });

          let app = new EmberApp({
            project,
            package: () => input.path(),
          });
          mockTemplateRegistry(app);

          output = yield buildOutput(app.toTree());

          let outputFiles = output.read();

          expect(outputFiles).to.deep.equal({
            fake: {
              dist: {
                'foo.js': '// foo.js',
              },
            },
          });
        })
      );

      it(
        'receives a full tree as an argument',
        co.wrap(function*() {
          let appStyles = yield createTempDir();
          appStyles.write({
            'app.css': '// css styles',
          });
          input.write({
            fake: {
              dist: {
                'foo.js': '// foo.js',
              },
            },
          });

          let app = new EmberApp({
            project,
            package: tree => mergeTrees([tree, input.path()]),
            trees: {
              styles: appStyles.path(),
            },
          });
          mockTemplateRegistry(app);

          app.getAppJavascript = () => js.path();

          output = yield buildOutput(app.toTree());

          let outputFiles = output.read();

          expect(outputFiles).to.deep.equal({
            'addon-tree-output': {},
            fake: {
              dist: {
                'foo.js': '// foo.js',
              },
              javascript: '// javascript.js',
            },
            app: {
              styles: {
                'app.css': '// css styles',
              },
            },
            'test-project': {
              templates: {},
            },
            tests: {
              '.gitkeep': '',
              'addon-test-support': {},
              lint: {},
            },
            public: {},
            vendor: {
              '.gitkeep': '',
            },
          });
        })
      );

      it(
        'prints a warning if `package` is not a function and falls back to default packaging',
        co.wrap(function*() {
          let app = new EmberApp({
            project,
            package: {},
          });

          app.project.ui.writeWarnLine = td.function();

          app.getAppJavascript = td.function();
          app.getAddonTemplates = td.function();
          app.getStyles = td.function();
          app.getTests = td.function();
          app.getExternalTree = td.function();
          app.getSrc = td.function();
          app._legacyAddonCompile = td.function();
          app._defaultPackager = {
            packagePublic: td.function(),
            packageJavascript: td.function(),
            packageStyles: td.function(),
            processIndex: td.function(),
            importAdditionalAssets: td.function(),
            packageTests: td.function(),
          };

          output = yield buildOutput(app.toTree());

          td.verify(app.getAppJavascript(false));
          td.verify(app.getStyles());
          td.verify(app.getTests());
          td.verify(app.getExternalTree());
          td.verify(app.getSrc());
          td.verify(
            app.project.ui.writeWarnLine('`package` hook must be a function, falling back to default packaging.')
          );
        })
      );

      it(
        'receives transpiled ES current app tree',
        co.wrap(function*() {
          let app = new EmberApp({
            project,
            package: tree => tree,
          });
          mockTemplateRegistry(app);

          input.write({
            fake: {
              dist: {
                'foo.js': '// foo.js',
              },
            },
          });
          app.registry.add('js', {
            name: 'fake-js-preprocessor',
            ext: 'js',
            toTree() {
              return input.path();
            },
          });

          output = yield buildOutput(app.toTree());

          let outputFiles = output.read();

          expect(outputFiles.fake).to.deep.equal({
            dist: {
              'foo.js': '// foo.js',
            },
          });
        })
      );
    });
  }

  describe('getStyles()', function() {
    it(
      'can handle empty styles folders',
      co.wrap(function*() {
        let appStyles = yield createTempDir();
        appStyles.write({
          'app.css': '// css styles',
        });

        let app = new EmberApp({
          project,
          trees: {
            styles: appStyles.path(),
          },
        });

        app.addonTreesFor = () => [];

        let output = yield buildOutput(app.getStyles());
        let outputFiles = output.read();

        expect(outputFiles).to.deep.equal({
          app: {
            styles: {
              'app.css': '// css styles',
            },
          },
        });

        yield output.dispose();
      })
    );

    it(
      'can handle empty addon styles folders',
      co.wrap(function*() {
        let appOptions = { project };

        if (isExperimentEnabled('MODULE_UNIFICATION')) {
          appOptions.trees = { src: {} };
        }

        let app = new EmberApp(appOptions);

        let AddonFoo = Addon.extend({
          root: 'foo',
          name: 'foo',
        });
        let addonFoo = new AddonFoo(app, project);
        app.project.addons.push(addonFoo);

        let output = yield buildOutput(app.getStyles());
        let outputFiles = output.read();

        let expectedOutput;
        if (isExperimentEnabled('MODULE_UNIFICATION')) {
          expectedOutput = {
            src: {
              ui: {
                styles: {},
              },
            },
          };
        } else {
          expectedOutput = {};
        }
        expect(outputFiles).to.deep.equal(expectedOutput);

        yield output.dispose();
      })
    );

    it(
      'add `app/styles` folder from add-ons',
      co.wrap(function*() {
        let addonFooStyles = yield createTempDir();

        addonFooStyles.write({
          app: {
            styles: {
              'foo.css': 'foo',
            },
          },
        });

        let appOptions = { project };

        if (isExperimentEnabled('MODULE_UNIFICATION')) {
          appOptions.trees = { src: {} };
        }

        let app = new EmberApp(appOptions);

        let AddonFoo = Addon.extend({
          root: 'foo',
          name: 'foo',
          treeForStyles() {
            return addonFooStyles.path();
          },
        });
        let addonFoo = new AddonFoo(app, project);
        app.project.addons.push(addonFoo);

        let output = yield buildOutput(app.getStyles());
        let outputFiles = output.read();

        let expectedOutput;
        if (isExperimentEnabled('MODULE_UNIFICATION')) {
          expectedOutput = {
            src: {
              ui: {
                styles: {
                  'foo.css': 'foo',
                },
              },
            },
          };
        } else {
          expectedOutput = {
            app: {
              styles: {
                'foo.css': 'foo',
              },
            },
          };
        }
        expect(outputFiles).to.deep.equal(expectedOutput);

        yield addonFooStyles.dispose();
        yield output.dispose();
      })
    );

    it(
      'returns add-ons styles files',
      co.wrap(function*() {
        let addonFooStyles = yield createTempDir();
        let addonBarStyles = yield createTempDir();

        // `ember-basic-dropdown`
        addonFooStyles.write({
          app: {
            styles: {
              'foo.css': 'foo',
            },
          },
        });
        // `ember-bootstrap`
        addonBarStyles.write({
          baztrap: {
            'baztrap.css': '// baztrap.css',
          },
        });

        let app = new EmberApp({
          project,
        });
        app.addonTreesFor = function() {
          return [addonFooStyles.path(), addonBarStyles.path()];
        };

        let output = yield buildOutput(app.getStyles());
        let outputFiles = output.read();

        expect(outputFiles).to.deep.equal({
          app: {
            styles: {
              'foo.css': 'foo',
            },
          },
          baztrap: {
            'baztrap.css': '// baztrap.css',
          },
        });

        yield addonFooStyles.dispose();
        yield addonBarStyles.dispose();
        yield output.dispose();
      })
    );

    it(
      'does not fail if add-ons do not export styles',
      co.wrap(function*() {
        let app = new EmberApp({
          project,
        });
        app.addonTreesFor = () => [];

        let output = yield buildOutput(app.getStyles());
        let outputFiles = output.read();

        expect(outputFiles).to.deep.equal({});

        yield output.dispose();
      })
    );
  });

  describe('getPublic()', function() {
    it(
      'returns public files for app and add-ons',
      co.wrap(function*() {
        let input = yield createTempDir();
        let addonFooPublic = yield createTempDir();
        let addonBarPublic = yield createTempDir();

        input.write({
          'crossdomain.xml': '',
          'robots.txt': '',
        });
        addonFooPublic.write({
          foo: 'foo',
        });
        addonBarPublic.write({
          bar: 'bar',
        });

        app = new EmberApp({
          project,
        });

        app.trees.public = input.path();
        app.addonTreesFor = function() {
          return [addonFooPublic.path(), addonBarPublic.path()];
        };

        let output = yield buildOutput(app.getPublic());
        let outputFiles = output.read();

        expect(outputFiles).to.deep.equal({
          public: {
            'crossdomain.xml': '',
            'robots.txt': '',
            foo: 'foo',
            bar: 'bar',
          },
        });

        yield input.dispose();
        yield addonFooPublic.dispose();
        yield addonBarPublic.dispose();
        yield output.dispose();
      })
    );

    it(
      'does not fail if app or add-ons have the same `public` folder structure',
      co.wrap(function*() {
        let input = yield createTempDir();
        let addonFooPublic = yield createTempDir();
        let addonBarPublic = yield createTempDir();

        input.write({
          'crossdomain.xml': '',
          'robots.txt': '',
        });
        addonFooPublic.write({
          bar: 'bar',
          foo: 'foo',
        });
        addonBarPublic.write({
          bar: 'bar',
        });

        app = new EmberApp({
          project,
        });

        app.trees.public = input.path();
        app.addonTreesFor = function() {
          return [addonFooPublic.path(), addonBarPublic.path()];
        };

        let output = yield buildOutput(app.getPublic());
        let outputFiles = output.read();

        expect(outputFiles).to.deep.equal({
          public: {
            'crossdomain.xml': '',
            'robots.txt': '',
            foo: 'foo',
            bar: 'bar',
          },
        });

        yield input.dispose();
        yield addonFooPublic.dispose();
        yield addonBarPublic.dispose();
        yield output.dispose();
      })
    );
  });

  describe('getAddonTemplates()', function() {
    it(
      'returns add-ons template files',
      co.wrap(function*() {
        let input = yield createTempDir();
        let addonFooTemplates = yield createTempDir();
        let addonBarTemplates = yield createTempDir();

        addonFooTemplates.write({
          'foo.hbs': 'foo',
        });
        addonBarTemplates.write({
          'bar.hbs': 'bar',
        });

        let app = new EmberApp({
          project,
        });
        app.trees.templates = input.path();
        app.addonTreesFor = function() {
          return [addonFooTemplates.path(), addonBarTemplates.path()];
        };

        let output = yield buildOutput(app.getAddonTemplates());
        let outputFiles = output.read();

        expect(outputFiles['test-project'].templates).to.deep.equal({
          'foo.hbs': 'foo',
          'bar.hbs': 'bar',
        });

        yield input.dispose();
        yield addonFooTemplates.dispose();
        yield addonBarTemplates.dispose();
        yield output.dispose();
      })
    );
  });

  describe('getTests()', function() {
    it(
      'returns all test files `hinting` is enabled',
      co.wrap(function*() {
        let input = yield createTempDir();
        let addonLint = yield createTempDir();
        let addonFooTestSupport = yield createTempDir();
        let addonBarTestSupport = yield createTempDir();

        input.write({
          acceptance: {
            'login-test.js': '',
            'logout-test.js': '',
          },
        });
        addonFooTestSupport.write({
          'foo-helper.js': 'foo',
        });
        addonBarTestSupport.write({
          'bar-helper.js': 'bar',
        });
        addonLint.write({
          'login-test.lint.js': '',
          'logout-test.lint.js': '',
        });

        let app = new EmberApp({
          project,
        });
        app.trees.tests = input.path();
        app.addonLintTree = (type, tree) => {
          if (type === 'tests') {
            return addonLint.path();
          }

          return tree;
        };
        app.addonTreesFor = function(type) {
          if (type === 'test-support') {
            return [addonFooTestSupport.path(), addonBarTestSupport.path()];
          }

          return [];
        };

        let output = yield buildOutput(app.getTests());
        let outputFiles = output.read();

        expect(outputFiles.tests).to.deep.equal({
          'addon-test-support': {},
          lint: {
            'login-test.lint.js': '',
            'logout-test.lint.js': '',
          },
          acceptance: {
            'login-test.js': '',
            'logout-test.js': '',
          },
          'foo-helper.js': 'foo',
          'bar-helper.js': 'bar',
        });

        yield input.dispose();
        yield addonFooTestSupport.dispose();
        yield addonBarTestSupport.dispose();
        yield addonLint.dispose();
        yield output.dispose();
      })
    );

    it(
      'returns test files w/o lint tests if `hinting` is disabled',
      co.wrap(function*() {
        let input = yield createTempDir();
        let addonFooTestSupport = yield createTempDir();
        let addonBarTestSupport = yield createTempDir();

        input.write({
          acceptance: {
            'login-test.js': '',
            'logout-test.js': '',
          },
        });
        addonFooTestSupport.write({
          'foo-helper.js': 'foo',
        });
        addonBarTestSupport.write({
          'bar-helper.js': 'bar',
        });

        let app = new EmberApp({
          project,
          hinting: false,
        });
        app.trees.tests = input.path();
        app.addonTreesFor = function(type) {
          if (type === 'test-support') {
            return [addonFooTestSupport.path(), addonBarTestSupport.path()];
          }

          return [];
        };

        let output = yield buildOutput(app.getTests());
        let outputFiles = output.read();

        expect(outputFiles.tests).to.deep.equal({
          'addon-test-support': {},
          acceptance: {
            'login-test.js': '',
            'logout-test.js': '',
          },
          'foo-helper.js': 'foo',
          'bar-helper.js': 'bar',
        });

        yield input.dispose();
        yield addonFooTestSupport.dispose();
        yield addonBarTestSupport.dispose();
        yield output.dispose();
      })
    );
  });

  describe('constructor', function() {
    it('should override project.configPath if configPath option is specified', function() {
      project.configPath = function() {
        return 'original value';
      };

      let expected = 'custom config path';

      new EmberApp({
        project,
        configPath: expected,
      });

      expect(project.configPath().slice(-expected.length)).to.equal(expected);
    });

    it('should set bowerDirectory for app', function() {
      let app = new EmberApp({
        project,
      });

      expect(app.bowerDirectory).to.equal(project.bowerDirectory);
      expect(app.bowerDirectory).to.equal('bower_components');
    });

    it('should merge options with defaults to depth', function() {
      let app = new EmberApp(
        {
          project,
          foo: {
            bar: ['baz'],
          },
          fooz: {
            bam: {
              boo: ['default'],
            },
          },
        },
        {
          foo: {
            bar: ['bizz'],
          },
          fizz: 'fizz',
          fooz: {
            bam: {
              boo: ['custom'],
            },
          },
        }
      );

      expect(app.options.foo).to.deep.eql({
        bar: ['bizz'],
      });
      expect(app.options.fizz).to.eql('fizz');
      expect(app.options.fooz).to.eql({
        bam: {
          boo: ['custom'],
        },
      });
    });

    it('should do the right thing when merging default object options', function() {
      let app = new EmberApp(
        {
          project,
        },
        {
          minifyJS: {
            enabled: true,
            options: {
              exclusions: ['hey', 'you'],
            },
          },
        }
      );

      expect(app.options.minifyJS).to.deep.equal({
        enabled: true,
        options: {
          exclusions: ['hey', 'you'],
          compress: {
            // eslint-disable-next-line camelcase
            negate_iife: false,
            sequences: 30,
          },
          output: {
            semicolons: false,
          },
        },
      });
    });

    it('should watch vendor if it exists', function() {
      let app = new EmberApp({
        project,
      });

      expect(app.options.trees.vendor.__broccoliGetInfo__()).to.have.property('watched', true);
    });

    describe('Addons included hook', function() {
      let includedWasCalled;
      let setupPreprocessorRegistryWasCalled;
      let addonsAppIncluded, addonsApp;
      let addon = {
        name: 'custom-addon',
        included() {
          includedWasCalled++;
          expect(setupPreprocessorRegistryWasCalled).to.eql(1);
          addonsAppIncluded = this.app;
        },

        setupPreprocessorRegistry() {
          expect(includedWasCalled).to.eql(0);
          setupPreprocessorRegistryWasCalled++;
          addonsApp = this.app;
        },
      };

      beforeEach(function() {
        setupPreprocessorRegistryWasCalled = includedWasCalled = 0;
        addonsApp = null;
        addonsAppIncluded = null;
        project.initializeAddons = function() {};
        project.addons = [addon];
      });

      it('should set the app on the addons', function() {
        expect(includedWasCalled).to.eql(0);
        let app = new EmberApp({
          project,
        });
        expect(includedWasCalled).to.eql(1);
        expect(setupPreprocessorRegistryWasCalled).to.eql(1);
        expect(addonsAppIncluded).to.eql(app);
        expect(addonsApp).to.eql(app);

        let addon = project.addons[0];
        expect(addon.app).to.deep.equal(app);
      });
    });

    describe('loader.js missing', function() {
      it('does not error when loader.js is present in registry.availablePlugins', function() {
        expect(() => {
          new EmberApp({
            project,
          });
        }).to.not.throw(/loader.js addon is missing/);
      });

      it('throws an error when loader.js is not present in registry.availablePlugins', function() {
        expect(() => {
          new EmberApp({
            project,
            registry: {
              add() {},
              availablePlugins: {},
            },
          });
        }).to.throw(/loader.js addon is missing/);
      });

      it('does not throw an error if _ignoreMissingLoader is set', function() {
        expect(() => {
          new EmberApp({
            project,
            registry: {
              add() {},
              availablePlugins: {},
            },
            _ignoreMissingLoader: true,
          });
        }).to.not.throw(/loader.js addon is missing/);
      });
    });

    describe('ember-resolver npm vs Bower', function() {
      it('does not load ember-resolver.js as bower dep when ember-resolver is present in registry.availablePlugins', function() {
        let app = new EmberApp({ project });
        expect(app.vendorFiles['ember-resolver']).to.equal(undefined);
      });

      it('keeps ember-resolver.js in vendorFiles when npm ember-resolver is not installed, but is present in bower.json', function() {
        project.bowerDependencies = function() {
          return { ember: {}, 'ember-resolver': {} };
        };
        let app = new EmberApp({
          project,
          registry: {
            add() {},
            availablePlugins: { 'loader.js': {} },
          },
        });
        expect(app.vendorFiles['ember-resolver.js'][0]).to.equal(
          'bower_components/ember-resolver/dist/modules/ember-resolver.js'
        );
      });

      it('removes ember-resolver.js from vendorFiles when not in bower.json and npm ember-resolver not installed', function() {
        project.bowerDependencies = function() {
          return { ember: {} };
        };
        let app = new EmberApp({
          project,
          registry: {
            add() {},
            availablePlugins: { 'loader.js': {} },
          },
        });

        expect(app.vendorFiles['ember-resolver']).to.equal(undefined);
      });
    });

    describe('options.babel.sourceMaps', function() {
      it('disables babel sourcemaps by default', function() {
        let app = new EmberApp({
          project,
        });

        expect(app.options.babel.sourceMaps).to.be.false;
      });

      it('can enable babel sourcemaps with the option', function() {
        let app = new EmberApp({
          project,
          babel: {
            sourceMaps: 'inline',
          },
        });

        expect(app.options.babel.sourceMaps).to.equal('inline');
      });
    });

    describe('options.fingerprint.exclude', function() {
      it('excludeds testem in fingerprint exclude', function() {
        let app = new EmberApp({
          project,
          fingerprint: {
            exclude: [],
          },
        });

        expect(app.options.fingerprint.exclude).to.include('testem');
      });
    });
  });

  describe('addons', function() {
    describe('included hook', function() {
      it('included hook is called properly on instantiation', function() {
        let called = false;
        let passedApp;

        addon = {
          included(app) {
            called = true;
            passedApp = app;
          },
          treeFor() {},
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        let app = new EmberApp({
          project,
        });

        expect(called).to.be.true;
        expect(passedApp).to.equal(app);
      });

      it('does not throw an error if the addon does not implement `included`', function() {
        delete addon.included;

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        expect(() => {
          new EmberApp({
            project,
          });
        }).to.not.throw(/addon must implement the `included`/);
      });
    });

    describe('addonTreesFor', function() {
      beforeEach(function() {
        addon = {
          included() {},
          treeFor() {},
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project,
        });
      });

      it('addonTreesFor returns an empty array if no addons return a tree', function() {
        expect(app.addonTreesFor('blah')).to.deep.equal([]);
      });

      it('addonTreesFor calls treesFor on the addon', function() {
        let sampleAddon = project.addons[0];
        let actualTreeName;

        sampleAddon.treeFor = function(name) {
          actualTreeName = name;

          return 'blazorz';
        };

        expect(app.addonTreesFor('blah')).to.deep.equal(['blazorz']);
        expect(actualTreeName).to.equal('blah');
      });

      it('addonTreesFor does not throw an error if treeFor is not defined', function() {
        delete addon.treeFor;

        app = new EmberApp({
          project,
        });

        expect(() => {
          app.addonTreesFor('blah');
        }).not.to.throw(/addon must implement the `treeFor`/);
      });

      describe('addonTreesFor is called properly', function() {
        beforeEach(function() {
          app = new EmberApp({
            project,
          });

          app.addonTreesFor = td.function();
          td.when(app.addonTreesFor(), { ignoreExtraArgs: true }).thenReturn(['batman']);
        });

        it('getAppJavascript calls addonTreesFor', function() {
          app.getAppJavascript();

          let args = td.explain(app.addonTreesFor).calls.map(function(call) {
            return call.args[0];
          });

          expect(args).to.deep.equal(['app']);
        });
      });
    });

    describe('toArray', function() {
      it('excludes `tests` tree from resulting array if the tree is not present', function() {
        app = new EmberApp({
          project,
          trees: {
            tests: null,
          },
        });

        app._defaultPackager.packageJavascript = td.function();
        app._defaultPackager.packageStyles = td.function();
        app._legacyAddonCompile = td.function();

        td.when(app._legacyAddonCompile(), { ignoreExtraArgs: true }).thenReturn('batman');
        td.when(app._defaultPackager.packageJavascript(), { ignoreExtraArgs: true }).thenReturn('batman');
        td.when(app._defaultPackager.packageStyles(), { ignoreExtraArgs: true }).thenReturn('batman');

        app.toArray(); // doesn't throw an error
      });
    });

    describe('toTree', function() {
      beforeEach(function() {
        addon = {
          included() {},
          treeFor() {},
          postprocessTree: td.function(),
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project,
          tests: true,
          trees: { tests: {} },
        });
      });

      it('calls postProcessTree if defined', function() {
        app.toArray = td.function();
        app._legacyPackage = td.function();

        td.when(app.toArray(), { ignoreExtraArgs: true }).thenReturn([]);
        td.when(app._legacyPackage(), { ignoreExtraArgs: true }).thenReturn('bar');
        td.when(
          addon.postprocessTree(
            'all',
            td.matchers.argThat(
              t => t.constructor === BroccoliMergeTrees && t._inputNodes.length === 1 && t._inputNodes[0] === 'bar'
            )
          )
        ).thenReturn('derp');

        expect(app.toTree()).to.equal('derp');
      });

      it('calls addonPostprocessTree', function() {
        app.toArray = td.function();
        app.addonPostprocessTree = td.function();
        app._legacyPackage = td.function();

        td.when(app._legacyPackage(), { ignoreExtraArgs: true }).thenReturn('bar');
        td.when(app.toArray(), { ignoreExtraArgs: true }).thenReturn([]);
        td.when(
          app.addonPostprocessTree(
            'all',
            td.matchers.argThat(
              t => t.constructor === BroccoliMergeTrees && t._inputNodes.length === 1 && t._inputNodes[0] === 'bar'
            )
          )
        ).thenReturn('blap');

        expect(app.toTree()).to.equal('blap');
      });

      it('calls each addon postprocessTree hook', function() {
        mockTemplateRegistry(app);

        app.index = td.function();
        app.getTests = td.function();
        app._legacyAddonCompile = td.function();
        app._defaultPackager.processTemplates = td.function();

        td.when(app._defaultPackager.processTemplates(), { ignoreExtraArgs: true }).thenReturn('x');
        td.when(addon.postprocessTree(), { ignoreExtraArgs: true }).thenReturn('blap');
        td.when(app.index(), { ignoreExtraArgs: true }).thenReturn(null);
        td.when(app.getTests(), { ignoreExtraArgs: true }).thenReturn(null);
        td.when(app._legacyAddonCompile(), { ignoreExtraArgs: true }).thenReturn(null);

        expect(app.toTree()).to.equal('blap');

        let args = td.explain(addon.postprocessTree).calls.map(function(call) {
          return call.args[0];
        });

        expect(args).to.deep.equal(['js', 'css', 'test', 'all']);
      });
    });

    describe('addons can be disabled', function() {
      beforeEach(function() {
        projectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
        const packageContents = require(path.join(projectPath, 'package.json'));
        let cli = new MockCLI();
        project = new Project(projectPath, packageContents, cli.ui, cli);
      });

      afterEach(function() {
        process.env.EMBER_ENV = undefined;
      });

      describe('isEnabled is called properly', function() {
        describe('with environment', function() {
          let emberFooEnvAddonFixture;

          beforeEach(function() {
            emberFooEnvAddonFixture = require(path.resolve(projectPath, 'node_modules/ember-foo-env-addon/index.js'));
          });

          it('development', function() {
            process.env.EMBER_ENV = 'development';
            let app = new EmberApp({ project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.false;

            expect(app.project.addons.length).to.equal(8);
          });

          it('foo', function() {
            process.env.EMBER_ENV = 'foo';
            let app = new EmberApp({ project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.true;

            expect(app.project.addons.length).to.equal(9);
          });
        });
      });

      describe('blacklist', function() {
        it('prevents addons to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';

          let app = new EmberApp({
            project,
            addons: {
              blacklist: ['ember-foo-env-addon'],
            },
          });

          expect(app._addonDisabledByBlacklist({ name: 'ember-foo-env-addon' })).to.be.true;
          expect(app._addonDisabledByBlacklist({ name: 'Ember Random Addon' })).to.be.false;
          expect(app.project.addons.length).to.equal(8);
        });

        it('throws if unavailable addon is specified', function() {
          function load() {
            process.env.EMBER_ENV = 'foo';

            new EmberApp({
              project,
              addons: {
                blacklist: ['ember-cli-self-troll'],
              },
            });
          }

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in blacklist is not found');
        });
      });

      describe('whitelist', function() {
        it('prevents non-whitelisted addons to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';

          let app = new EmberApp({
            project,
            addons: {
              whitelist: ['ember-foo-env-addon'],
            },
          });

          expect(app._addonDisabledByWhitelist({ name: 'ember-foo-env-addon' })).to.be.false;
          expect(app._addonDisabledByWhitelist({ name: 'Ember Random Addon' })).to.be.true;
          expect(app.project.addons.length).to.equal(1);
        });

        it('throws if unavailable addon is specified', function() {
          function load() {
            process.env.EMBER_ENV = 'foo';
            app = new EmberApp({
              project,
              addons: {
                whitelist: ['ember-cli-self-troll'],
              },
            });
          }

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in whitelist is not found');
        });
      });

      describe('blacklist wins over whitelist', function() {
        it('prevents addon to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';
          app = new EmberApp({
            project,
            addons: {
              whitelist: ['ember-foo-env-addon'],
              blacklist: ['ember-foo-env-addon'],
            },
          });

          expect(app.project.addons.length).to.equal(0);
        });
      });
    });

    describe('addonLintTree', function() {
      beforeEach(function() {
        addon = {
          lintTree: td.function(),
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project,
        });
      });

      it('does not throw an error if lintTree is not defined', function() {
        app.addonLintTree();
      });

      it('calls lintTree on the addon', function() {
        app.addonLintTree('blah', 'blam');

        td.verify(addon.lintTree('blah', 'blam'));
      });
    });
  });

  describe('import', function() {
    beforeEach(function() {
      app = new EmberApp({
        project,
      });
    });

    afterEach(function() {
      process.env.EMBER_ENV = undefined;
    });

    it('appends dependencies to vendor by default', function() {
      app.import('vendor/moment.js');
      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });
    it('appends dependencies', function() {
      app.import('vendor/moment.js', { type: 'vendor' });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('prepends dependencies', function() {
      app.import('vendor/es5-shim.js', { type: 'vendor', prepend: true });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/es5-shim.js')).to.equal(0);
    });

    it('prepends dependencies to outputFile', function() {
      app.import('vendor/moment.js', { outputFile: 'moment.js', prepend: true });

      let outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(0);
    });

    it('appends dependencies to outputFile', function() {
      app.import('vendor/moment.js', { outputFile: 'moment.js' });

      let outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('defaults to development if production is not set', function() {
      process.env.EMBER_ENV = 'production';
      app.import({
        development: 'vendor/jquery.js',
      });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];
      expect(outputFile.indexOf('vendor/jquery.js')).to.equal(outputFile.length - 1);
    });

    it('honors explicitly set to null in environment', function() {
      process.env.EMBER_ENV = 'production';
      // set EMBER_ENV before creating the project

      app = new EmberApp({
        project,
      });

      app.import({
        development: 'vendor/jquery.js',
        production: null,
      });

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.not.contain('vendor/jquery.js');
    });

    it('normalizes asset path correctly', function() {
      app.import('vendor\\path\\to\\lib.js', { type: 'vendor' });
      app.import('vendor/path/to/lib2.js', { type: 'vendor' });

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib.js');
      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib2.js');
    });

    it('option.using throws exception given invalid inputs', function() {
      // `using` is looped over if given, we should ensure this throws an exception with proper error message
      expect(() => {
        app.import('vendor/path/to/lib1.js', { using: 1 });
      }).to.throw(/You must pass an array of transformations for `using` option/);

      expect(() => {
        app.import('vendor/path/to/lib2.js', { using: 'foop' });
      }).to.throw(/You must pass an array of transformations for `using` option/);

      expect(() => {
        app.import('vendor/path/to/lib3.js', { using: [1] });
      }).to.throw(/list must have a `transformation` name/);

      expect(() => {
        app.import('vendor/path/to/lib3.js', { using: [{ foo: 'bar' }] });
      }).to.throw(/list must have a `transformation` name/);
    });
  });

  describe('vendorFiles', function() {
    let defaultVendorFiles = ['jquery.js', 'ember.js', 'app-shims.js'];

    describe('handlebars.js', function() {
      it('does not app.import handlebars if not present in bower.json', function() {
        let app = new EmberApp({
          project,
        });

        expect(app.vendorFiles).not.to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in bower.json', function() {
        projectPath = path.resolve(__dirname, '../../fixtures/project-with-handlebars');
        project = setupProject(projectPath);

        let app = new EmberApp({
          project,
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in provided `vendorFiles`', function() {
        let app = new EmberApp({
          project,
          vendorFiles: {
            'handlebars.js': 'some/path/whatever.js',
          },
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });
    });

    it('defines vendorFiles by default', function() {
      app = new EmberApp({
        project,
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('redefines a location of a vendor asset', function() {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(app.vendorFiles['ember.js']).to.equal('vendor/ember.js');
    });

    it('defines vendorFiles in order even when option for it is passed', function() {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('does not include jquery if the app has `@ember/jquery` installed', function() {
      project.initializeAddons = function() {
        this.addons = [{ name: '@ember/jquery' }];
      };
      app = new EmberApp({ project });
      let filesWithoutJQuery = defaultVendorFiles.filter(e => e !== 'jquery.js');
      expect(Object.keys(app.vendorFiles)).to.deep.equal(filesWithoutJQuery);
    });

    it('does not include jquery if the app has `@ember/optional-features` with the `jquery-integration` FF turned off', function() {
      project.initializeAddons = function() {
        this.addons = [
          {
            name: 'ember-source',
            paths: { jquery: 'foo', testing: null },
          },
          {
            name: '@ember/optional-features',
            isFeatureEnabled() {
              return false;
            },
          },
        ];
      };
      app = new EmberApp({ project, vendorFiles: { 'ember-testing.js': null } });
      let filesWithoutJQuery = defaultVendorFiles.filter(e => e !== 'jquery.js');
      expect(Object.keys(app.vendorFiles)).to.deep.equal(filesWithoutJQuery);
    });

    it('removes dependency in vendorFiles', function() {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': null,
          'handlebars.js': null,
        },
      });
      let vendorFiles = Object.keys(app.vendorFiles);
      expect(vendorFiles).to.not.contain('ember.js');
      expect(vendorFiles).to.not.contain('handlebars.js');
    });

    it('defaults to ember.debug.js if exists in bower_components', function() {
      let root = path.resolve(__dirname, '../../fixtures/app/with-default-ember-debug');

      app = new EmberApp({
        project: setupProject(root),
      });

      let files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('bower_components/ember/ember.debug.js');
    });

    it('switches the default ember.debug.js to ember.js if it does not exist', function() {
      let root = path.resolve(__dirname, '../../fixtures/app/without-ember-debug');

      app = new EmberApp({
        project: setupProject(root),
      });

      let files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('bower_components/ember/ember.js');
    });

    it('does not clobber an explicitly configured ember development file', function() {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': {
            development: 'vendor/ember.debug.js',
          },
        },
      });
      let files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('vendor/ember.debug.js');
    });
  });

  it('fails with invalid type', function() {
    let app = new EmberApp({
      project,
    });

    expect(() => {
      app.import('vendor/b/c/foo.js', { type: 'javascript' });
    }).to.throw(
      /You must pass either `vendor` or `test` for options.type in your call to `app.import` for file: foo.js/
    );
  });

  describe('_initOptions', function() {
    it('sets the tests directory as watched when tests are enabled', function() {
      let app = new EmberApp({
        project,
      });

      app._initOptions({
        tests: true,
      });

      expect(app.options.trees.tests).to.be.an.instanceOf(WatchedDir);
    });
    it('sets the tests directory as unwatched when tests are disabled', function() {
      let app = new EmberApp({
        project,
      });

      app._initOptions({
        tests: false,
      });

      expect(app.options.trees.tests).to.be.an.instanceOf(UnwatchedDir);
    });
  });

  describe('_resolveLocal', function() {
    it('resolves a path relative to the project root', function() {
      let app = new EmberApp({
        project,
      });

      let result = app._resolveLocal('foo');
      expect(result).to.equal(path.join(project.root, 'foo'));
    });
  });

  describe('_concatFiles()', function() {
    beforeEach(function() {
      app = new EmberApp({ project });
    });

    describe('concat order', function() {
      beforeEach(function() {
        mockTemplateRegistry(app);
      });

      it('correctly orders concats from app.styles()', function() {
        app.import('files/b.css');
        app.import('files/c.css');
        app.import('files/a.css', { prepend: true });
        app.import('files/d.css');

        expect(app._styleOutputFiles['/assets/vendor.css']).to.deep.equal([
          'files/a.css',
          'files/b.css',
          'files/c.css',
          'files/d.css',
        ]);
      });

      it('correctly orders concats from app.testFiles()', function() {
        app.import('files/b.js', { type: 'test' });
        app.import('files/c.js', { type: 'test' });
        app.import('files/a.js', { type: 'test' });
        app.import('files/a.js', { type: 'test', prepend: true }); // Should end up second.
        app.import('files/d.js', { type: 'test' });
        app.import('files/d.js', { type: 'test', prepend: true }); // Should end up first.
        app.import('files/d.js', { type: 'test' });

        app.import('files/b.css', { type: 'test' });
        app.import('files/c.css', { type: 'test' });
        app.import('files/a.css', { type: 'test', prepend: true });
        app.import('files/d.css', { type: 'test' });
        app.import('files/d.css', { type: 'test' });

        expect(app.legacyTestFilesToAppend).to.deep.equal(['files/d.js', 'files/a.js', 'files/b.js', 'files/c.js']);

        expect(app.vendorTestStaticStyles).to.deep.equal(['files/a.css', 'files/b.css', 'files/c.css', 'files/d.css']);
      });
    });
  });

  describe('deprecations', function() {
    it('shows ember-cli-shims deprecation', function() {
      let root = path.resolve(__dirname, '../../fixtures/app/npm');
      let project = setupProject(root);
      project.require = function() {
        return {
          version: '5.0.0',
        };
      };
      project.initializeAddons = function() {
        this.addons = [
          {
            name: 'ember-cli-babel',
            pkg: { version: '5.0.0' },
          },
        ];
      };

      app = new EmberApp({
        project,
      });

      expect(project.ui.output).to.contain(
        "You have not included `ember-cli-shims` in your project's `bower.json` or `package.json`."
      );
    });

    describe('jQuery integration', function() {
      it('shows deprecation', function() {
        project.initializeAddons = function() {
          this.addons = [{ name: 'ember-source', paths: {} }];
        };
        app = new EmberApp({ project });

        expect(project.ui.output).to.contain(
          'The integration of jQuery into Ember has been deprecated and will be removed with Ember 4.0'
        );
      });

      it('does not show deprecation if the app has `@ember/jquery` installed', function() {
        project.initializeAddons = function() {
          this.addons = [{ name: 'ember-source', paths: {} }, { name: '@ember/jquery' }];
        };
        app = new EmberApp({ project });
        expect(project.ui.output).to.not.contain(
          'The integration of jQuery into Ember has been deprecated and will be removed with Ember 4.0'
        );
      });

      it('does not show deprecation if the app has `@ember/optional-features` with the `jquery-integration` FF turned off', function() {
        project.initializeAddons = function() {
          this.addons = [
            { name: 'ember-source', paths: {} },
            {
              name: '@ember/optional-features',
              isFeatureEnabled() {
                return false;
              },
            },
          ];
        };
        app = new EmberApp({ project, vendorFiles: { 'ember-testing.js': null } });
        expect(project.ui.output).to.not.contain(
          'The integration of jQuery into Ember has been deprecated and will be removed with Ember 4.0'
        );
      });
    });
  });
});
