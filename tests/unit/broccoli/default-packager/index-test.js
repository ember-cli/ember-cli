'use strict';

const expect = require('chai').expect;
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');
const { isExperimentEnabled } = require('../../../../lib/experiments');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Index', function() {
  let input, output;

  let project = {
    configPath() {
      return `${input.path()}/the-best-app-ever/config/environment`;
    },

    config() {
      return {
        rootURL: 'best-url-ever',
        modulePrefix: 'the-best-app-ever',
      };
    },

    addons: [],
  };

  let META_TAG =
    '/best-url-ever/\n<meta name="the-best-app-ever/config/environment" content="{"rootURL":"/best-url-ever/","modulePrefix":"the-best-app-ever"}" />';

  before(async function() {
    input = await createTempDir();

    let indexContent = `
      {{rootURL}}{{content-for "head"}}
      {{content-for "head-footer"}}
      {{content-for "body"}}
      {{content-for "body-footer"}}
    `;
    input.write({
      'addon-tree-output': {},
      'the-best-app-ever': {
        'router.js': 'router.js',
        'app.js': 'app.js',
        'index.html': indexContent,
        config: {
          'environment.js': 'environment.js',
        },
        templates: {},
      },
    });
  });

  after(async function() {
    await input.dispose();
  });

  afterEach(async function() {
    await output.dispose();
  });

  it('caches processed index tree', async function() {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',
      env: 'development',

      autoRun: true,
      storeConfigInMeta: true,
      isModuleUnificationEnabled: false,
      areTestsEnabled: true,

      distPaths: {
        appHtmlFile: 'index.html',
      },

      project,
    });

    expect(defaultPackager._cachedProcessedIndex).to.equal(null);

    output = await buildOutput(defaultPackager.processIndex(input.path()));

    expect(defaultPackager._cachedProcessedIndex).to.not.equal(null);
  });

  it('works with a custom path', async function() {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',
      env: 'development',

      autoRun: true,
      storeConfigInMeta: true,
      isModuleUnificationEnabled: false,
      areTestsEnabled: true,

      distPaths: {
        appHtmlFile: 'custom/index.html',
      },

      project,
    });

    expect(defaultPackager._cachedProcessedIndex).to.equal(null);

    output = await buildOutput(defaultPackager.processIndex(input.path()));

    let outputFiles = output.read();
    let indexContent = decodeURIComponent(outputFiles.custom['index.html'].trim());

    expect(indexContent).to.equal(META_TAG);
  });

  it('populates `index.html` according to settings', async function() {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',
      env: 'development',

      autoRun: true,
      storeConfigInMeta: true,
      isModuleUnificationEnabled: false,
      areTestsEnabled: true,

      distPaths: {
        appHtmlFile: 'index.html',
      },

      project,
    });

    expect(defaultPackager._cachedProcessedIndex).to.equal(null);

    output = await buildOutput(defaultPackager.processIndex(input.path()));

    let outputFiles = output.read();
    let indexContent = decodeURIComponent(outputFiles['index.html'].trim());

    expect(indexContent).to.equal(META_TAG);
  });

  if (isExperimentEnabled('MODULE_UNIFICATION')) {
    describe('with module unification', function() {
      let input, output;

      before(async function() {
        input = await createTempDir();

        let indexContent = `
          {{rootURL}}{{content-for "head"}}
          {{content-for "head-footer"}}
          {{content-for "body"}}
          {{content-for "body-footer"}}
        `;
        input.write({
          'addon-tree-output': {},
          'the-best-app-ever': {
            'router.js': 'router.js',
            'app.js': 'app.js',
            'index.html': indexContent,
            config: {
              'environment.js': 'environment.js',
            },
            templates: {},
          },
          src: {
            ui: {
              'index.html': 'src',
            },
          },
        });
      });

      after(async function() {
        await input.dispose();
      });

      afterEach(async function() {
        await output.dispose();
      });

      it('prefers `src/ui/index.html` over `app/index.html`', async function() {
        let defaultPackager = new DefaultPackager({
          name: 'the-best-app-ever',
          env: 'development',

          autoRun: true,
          storeConfigInMeta: true,
          isModuleUnificationEnabled: true,
          areTestsEnabled: true,

          distPaths: {
            appHtmlFile: 'index.html',
          },

          project,
        });

        output = await buildOutput(defaultPackager.processIndex(input.path()));

        let outputFiles = output.read();
        let indexContent = decodeURIComponent(outputFiles['index.html'].trim());

        expect(indexContent).to.equal('src');
      });

      it('works if only `src/ui/index.html` exists', async function() {
        input.dispose();
        input.write({
          'addon-tree-output': {},
          src: {
            ui: {
              'index.html': 'src',
            },
          },
        });
        let defaultPackager = new DefaultPackager({
          name: 'the-best-app-ever',
          env: 'development',

          autoRun: true,
          storeConfigInMeta: true,
          isModuleUnificationEnabled: true,
          areTestsEnabled: true,

          distPaths: {
            appHtmlFile: 'index.html',
          },

          project,
        });

        output = await buildOutput(defaultPackager.processIndex(input.path()));

        let outputFiles = output.read();
        let indexContent = decodeURIComponent(outputFiles['index.html'].trim());

        expect(indexContent).to.equal('src');
      });
    });
  }
});
