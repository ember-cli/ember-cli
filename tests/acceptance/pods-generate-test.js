'use strict';

const ember = require('../helpers/ember');
const replaceFile = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
const fs = require('fs-extra');
const path = require('path');
let root = process.cwd();
const tmp = require('tmp-promise');

const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

const { expect } = require('chai');
const { file } = require('chai-files');
const { isExperimentEnabled } = require('@ember-tooling/blueprint-model/utilities/experiments');

describe('Acceptance: ember generate pod', function () {
  this.timeout(60000);

  let tmpdir;

  before(function () {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function () {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function () {
    const { path } = await tmp.dir();
    tmpdir = path;
    process.chdir(path);
  });

  afterEach(function () {
    process.chdir(root);
  });

  function initApp() {
    return ember(['init', '--name=my-app', '--skip-npm']);
  }

  function generate(args) {
    let generateArgs = ['generate'].concat(args);

    return initApp().then(function () {
      return ember(generateArgs);
    });
  }

  function generateWithPrefix(args) {
    let generateArgs = ['generate'].concat(args);

    return initApp().then(function () {
      replaceFile('config/environment.js', '(var|let|const) ENV = {', "$1 ENV = {\npodModulePrefix: 'app/pods', \n");
      return ember(generateArgs);
    });
  }

  it('blueprint foo --pod', async function () {
    await generate(['blueprint', 'foo', '--pod']);

    expect(file('blueprints/foo/index.js').content).to.matchSnapshot();
  });

  it('blueprint foo/bar --pod', async function () {
    await generate(['blueprint', 'foo/bar', '--pod']);

    expect(file('blueprints/foo/bar/index.js').content).to.matchSnapshot();
  });

  it('http-mock foo --pod', async function () {
    if (isExperimentEnabled('VITE')) {
      this.skip();
    }

    await generate(['http-mock', 'foo', '--pod']);

    expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

    expect(file('server/mocks/foo.js').content).to.matchSnapshot();
  });

  it('http-mock foo-bar --pod', async function () {
    if (isExperimentEnabled('VITE')) {
      this.skip();
    }

    await generate(['http-mock', 'foo-bar', '--pod']);

    expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

    expect(file('server/mocks/foo-bar.js').content).to.matchSnapshot();
  });

  it('http-proxy foo --pod', async function () {
    if (isExperimentEnabled('VITE')) {
      this.skip();
    }

    await generate(['http-proxy', 'foo', 'http://localhost:5000', '--pod']);

    expect(file('server/index.js')).to.contain('proxies.forEach(route => route(app));');

    expect(file('server/proxies/foo.js').content).to.matchSnapshot();
  });

  it('uses blueprints from the project directory', async function () {
    await initApp();
    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.js',
      "import Ember from 'ember';\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await ember(['generate', 'foo', 'bar', '--pod']);

    expect(file('app/foos/bar.js')).to.contain('foo: true');
  });

  it('allows custom blueprints to override built-ins', async function () {
    await initApp();
    await fs.outputFile(
      'blueprints/controller/files/app/__path__/__name__.js',
      "import Ember from 'ember';\n\n" + 'export default Ember.Controller.extend({ custom: true });\n'
    );

    await ember(['generate', 'controller', 'foo', '--pod']);

    expect(file('app/foo/controller.js')).to.contain('custom: true');
  });

  it('passes custom cli arguments to blueprint options', async function () {
    await initApp();
    await fs.outputFile(
      'blueprints/customblue/files/app/__name__.js',
      'Q: Can I has custom command? A: <%= hasCustomCommand %>'
    );

    await fs.outputFile(
      'blueprints/customblue/index.js',
      'module.exports = {\n' +
        '  fileMapTokens(options) {\n' +
        '    return {\n' +
        '      __name__(options) {\n' +
        '         return options.dasherizedModuleName;\n' +
        '      }\n' +
        '    };\n' +
        '  },\n' +
        '  locals(options) {\n' +
        '    var loc = {};\n' +
        "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';\n" +
        '    return loc;\n' +
        '  },\n' +
        '};\n'
    );

    await ember(['generate', 'customblue', 'foo', '--custom-command', '--pod']);

    expect(file('app/foo.js')).to.contain('A: Yes!');
  });

  it('correctly identifies the root of the project', async function () {
    await initApp();
    await fs.outputFile(
      'blueprints/controller/files/app/__path__/__name__.js',
      "import Ember from 'ember';\n\n" + 'export default Ember.Controller.extend({ custom: true });\n'
    );

    process.chdir(path.join(tmpdir, 'app'));
    await ember(['generate', 'controller', 'foo', '--pod']);

    process.chdir(tmpdir);
    expect(file('app/foo/controller.js')).to.contain('custom: true');
  });

  // Skip until podModulePrefix is deprecated
  it.skip('podModulePrefix deprecation warning', async function () {
    let result = await generateWithPrefix(['controller', 'foo', '--pod']);

    expect(result.outputStream.join()).to.include(
      '`podModulePrefix` is deprecated and will be' +
        ' removed from future versions of ember-cli. Please move existing pods from' +
        " 'app/pods/' to 'app/'."
    );
  });
});
