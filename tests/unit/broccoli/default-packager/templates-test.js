'use strict';

const co = require('co');
const expect = require('chai').expect;
const Funnel = require('broccoli-funnel');
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');
const defaultPackagerHelpers = require('../../../helpers/default-packager');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;
const setupRegistryFor = defaultPackagerHelpers.setupRegistryFor;

describe('Default Packager: Templates', function() {
  let input, output;

  let TEMPLATES = {
    'the-best-app-ever': {
      templates: {
        'application.hbs': '',
        'error.hbs': '',
        'index.hbs': '',
        'loading.hbs': '',
      },
    },
  };

  before(co.wrap(function *() {
    input = yield createTempDir();

    input.write(TEMPLATES);
  }));

  after(co.wrap(function *() {
    yield input.dispose();
  }));

  afterEach(co.wrap(function *() {
    yield output.dispose();
  }));

  it('caches processed templates tree', co.wrap(function *() {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',

      registry: setupRegistryFor('template', function(tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/hbs$/g, 'js');
          },
        });
      }),

      project: { addons: [] },
    });

    expect(defaultPackager._cachedProcessedTemplates).to.equal(null);

    output = yield buildOutput(defaultPackager.processTemplates(input.path()));

    expect(defaultPackager._cachedProcessedTemplates).to.not.equal(null);
  }));

  it('processes templates according to the registry', co.wrap(function *() {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',

      registry: setupRegistryFor('template', function(tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/hbs$/g, 'js');
          },
        });
      }),

      project: { addons: [] },
    });

    expect(defaultPackager._cachedProcessedTemplates).to.equal(null);

    output = yield buildOutput(defaultPackager.processTemplates(input.path()));

    let outputFiles = output.read();

    expect(Object.keys(outputFiles['the-best-app-ever'].templates)).to.deep.equal([
      'application.js',
      'error.js',
      'index.js',
      'loading.js',
    ]);
  }));

  it('runs pre/post-process add-on hooks', co.wrap(function *() {
    let addonPreprocessTreeHookCalled = false;
    let addonPostprocessTreeHookCalled = false;

    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',

      registry: setupRegistryFor('template', function(tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/hbs$/g, 'js');
          },
        });
      }),

      // avoid using `testdouble.js` here on purpose; it does not have a "proxy"
      // option, where a function call would be registered and the original
      // would be returned
      project: {
        addons: [{
          preprocessTree(type, tree) {
            addonPreprocessTreeHookCalled = true;

            return tree;
          },
          postprocessTree(type, tree) {
            addonPostprocessTreeHookCalled = true;

            return tree;
          },
        }],
      },
    });

    expect(defaultPackager._cachedProcessedTemplates).to.equal(null);

    output = yield buildOutput(defaultPackager.processTemplates(input.path()));

    expect(addonPreprocessTreeHookCalled).to.equal(true);
    expect(addonPostprocessTreeHookCalled).to.equal(true);
  }));
});
