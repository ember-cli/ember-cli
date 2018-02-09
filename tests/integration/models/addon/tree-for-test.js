'use strict';

const co = require('co');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');
const Addon = require('../../../../lib/models/addon');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Addon - treeFor', function() {
  let input, output, addon;

  beforeEach(co.wrap(function *() {
    input = yield createTempDir();
    let MockAddon = Addon.extend({
      name: 'my-addon',
      root: input.path(),
    });
    let cli = new MockCLI();
    let pkg = { name: 'my-app' };

    let project = new Project(input.path(), pkg, cli.ui, cli);
    project.addons = [
      {
        name: 'fake-addon',
      },
    ];

    addon = new MockAddon(project, project);
  }));

  afterEach(co.wrap(function *() {
    yield input.dispose();
    yield output.dispose();
  }));

  it('compiles es6 down to AMD', co.wrap(function *() {
    input.write({
      'addon': {
        'index.js': `export { es6 } from './es6';`,
      },
    });

    output = yield buildOutput(addon.treeFor('addon'));

    expect(output.read()).to.deep.equal({
      'my-addon': {
        'index.js': `define('my-addon/index', ['exports', 'my-addon/es6'], function (exports, _es) {
  'use strict';

  exports.__esModule = true;
  Object.defineProperty(exports, 'es6', {
    enumerable: true,
    get: function () {
      return _es.es6;
    }
  });
});`,
      },
    });
  }));
});
