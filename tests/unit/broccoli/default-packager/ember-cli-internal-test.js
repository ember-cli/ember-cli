'use strict';

const { expect } = require('chai');
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');

const createBuilder = broccoliTestHelper.createBuilder;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Default Packager: Ember CLI Internal', function () {
  let input, output;

  let CONFIG = {
    config: {
      'environment.js': '',
    },
  };
  let project = {
    addons: [],

    configPath() {
      return `${input.path()}/config/environment`;
    },

    config() {
      return {
        modulePrefix: 'the-best-app-ever',
      };
    },
  };

  before(async function () {
    input = await createTempDir();

    input.write(CONFIG);
  });

  after(async function () {
    await input.dispose();
  });

  afterEach(async function () {
    await output.dispose();
  });

  it('caches packaged ember cli internal tree', async function () {
    let defaultPackager = new DefaultPackager({
      env: 'development',
      name: 'the-best-app-ever',
      project,
      autoRun: false,
      areTestsEnabled: true,
      storeConfigInMeta: false,
    });

    expect(defaultPackager._cachedEmberCliInternalTree).to.equal(null);

    output = createBuilder(defaultPackager.packageEmberCliInternalFiles());
    await output.build();

    expect(defaultPackager._cachedEmberCliInternalTree).to.not.equal(null);
    expect(defaultPackager._cachedEmberCliInternalTree._annotation).to.equal('Packaged Ember CLI Internal Files');
  });

  it('packages internal files properly', async function () {
    let defaultPackager = new DefaultPackager({
      env: 'development',
      name: 'the-best-app-ever',
      project,
      autoRun: false,
      areTestsEnabled: true,
      storeConfigInMeta: false,
    });

    expect(defaultPackager._cachedEmberCliInternalTree).to.equal(null);

    output = createBuilder(defaultPackager.packageEmberCliInternalFiles());
    await output.build();

    let outputFiles = output.read();

    let emberCliFiles = outputFiles.vendor['ember-cli'];

    expect(Object.keys(emberCliFiles)).to.deep.equal([
      'app-boot.js',
      'app-config.js',
      'app-prefix.js',
      'app-suffix.js',
      'test-support-prefix.js',
      'test-support-suffix.js',
      'tests-prefix.js',
      'tests-suffix.js',
      'vendor-prefix.js',
      'vendor-suffix.js',
    ]);
  });

  it('populates the contents of internal files correctly', async function () {
    let defaultPackager = new DefaultPackager({
      env: 'development',
      name: 'the-best-app-ever',
      project,
      autoRun: false,
      areTestsEnabled: false,
      storeConfigInMeta: false,
    });

    expect(defaultPackager._cachedEmberCliInternalTree).to.equal(null);

    output = createBuilder(defaultPackager.packageEmberCliInternalFiles());
    await output.build();

    let outputFiles = output.read();

    let emberCliFiles = outputFiles.vendor['ember-cli'];

    let appBootFileContent = emberCliFiles['app-boot.js'].trim();
    let appConfigFileContent = emberCliFiles['app-config.js'].trim();
    let appPrefixFileContent = emberCliFiles['app-prefix.js'].trim();
    let appSuffixFileContent = emberCliFiles['app-suffix.js'].trim();

    let testPrefixFileContent = emberCliFiles['tests-prefix.js'].trim();
    let testSuffixFileContent = emberCliFiles['tests-suffix.js'].trim();
    let testSupportPrefixFileContent = emberCliFiles['test-support-prefix.js'].trim();
    let testSupportSuffixFileContent = emberCliFiles['test-support-suffix.js'].trim();

    let vendorPrefixFileContent = emberCliFiles['vendor-prefix.js'].trim();
    let vendorSuffixFileContent = emberCliFiles['vendor-suffix.js'].trim();

    expect(appBootFileContent).to.equal('');
    expect(appConfigFileContent).to.contain(`'default': {"modulePrefix":"the-best-app-ever"}`);
    expect(appPrefixFileContent).to.contain(`'use strict';`);
    expect(appSuffixFileContent).to.equal('');

    expect(testPrefixFileContent).to.contain(`'use strict';`);
    expect(testSuffixFileContent).to.contain(
      `require('the-best-app-ever/tests/test-helper');\nEmberENV.TESTS_FILE_LOADED = true;`
    );
    expect(testSupportPrefixFileContent).to.equal('');
    expect(testSupportSuffixFileContent).to.contain(
      `runningTests = true;\n\nif (typeof Testem !== 'undefined' && (typeof QUnit !== 'undefined' || typeof Mocha !== 'undefined')) {\n  window.Testem.hookIntoTestFramework();\n}`
    );

    expect(vendorPrefixFileContent).to.contain(`window.EmberENV = (function(EmberENV, extra) {
  for (var key in extra) {
    EmberENV[key] = extra[key];
  }

  return EmberENV;
})(window.EmberENV || {}, {});

// used to determine if the application should be booted immediately when \`app-name.js\` is evaluated
// when \`runningTests\` the \`app-name.js\` file will **not** import the applications \`app/app.js\` and
// call \`Application.create(...)\` on it. Additionally, applications can opt-out of this behavior by
// setting \`autoRun\` to \`false\` in their \`ember-cli-build.js\`
//
// The default \`test-support.js\` file will set this to \`true\` when it runs (so that Application.create()
// is not ran when running tests).
var runningTests = false;`);

    expect(vendorSuffixFileContent).to.equal('');
  });

  it('populates the contents of internal files correctly when `storeConfigInMeta` is enabled', async function () {
    let defaultPackager = new DefaultPackager({
      env: 'development',
      name: 'the-best-app-ever',
      project,
      autoRun: false,
      areTestsEnabled: true,
      storeConfigInMeta: true,
    });

    expect(defaultPackager._cachedEmberCliInternalTree).to.equal(null);

    output = createBuilder(defaultPackager.packageEmberCliInternalFiles());
    await output.build();

    let outputFiles = output.read();

    let emberCliFiles = outputFiles.vendor['ember-cli'];
    let appConfigFileContent = emberCliFiles['app-config.js'].trim();

    expect(appConfigFileContent).to.contain(`var rawConfig = document.querySelector(`);
    expect(appConfigFileContent).to.contain(`var config = JSON.parse(decodeURIComponent(rawConfig));`);
  });

  it('populates the contents of internal files correctly, including content from add-ons', async function () {
    let defaultPackager = new DefaultPackager({
      env: 'development',
      name: 'the-best-app-ever',
      project: {
        addons: [
          {
            contentFor(type) {
              if (type === 'test-support-prefix') {
                return 'CUSTOM TEST SUPPORT PREFIX CODE';
              }
            },
          },
          {
            contentFor(type) {
              if (type === 'app-boot') {
                return 'CUSTOM APP BOOT CODE';
              }
            },
          },
        ],

        configPath() {
          return `${input.path()}/config/environment`;
        },

        config() {
          return {
            modulePrefix: 'the-best-app-ever',
          };
        },
      },
      autoRun: false,
      areTestsEnabled: true,
      storeConfigInMeta: false,
    });

    expect(defaultPackager._cachedEmberCliInternalTree).to.equal(null);

    output = createBuilder(defaultPackager.packageEmberCliInternalFiles());
    await output.build();

    let outputFiles = output.read();

    let emberCliFiles = outputFiles.vendor['ember-cli'];
    let appBootFileContent = emberCliFiles['app-boot.js'].trim();
    let testSupportPrefixFileContent = emberCliFiles['test-support-prefix.js'].trim();

    expect(appBootFileContent).to.equal('CUSTOM APP BOOT CODE');
    expect(testSupportPrefixFileContent).to.equal('CUSTOM TEST SUPPORT PREFIX CODE');
  });
});
