'use strict';

var Promise              = require('../../lib/ext/promise');
var assertFile           = require('ember-cli-internal-test-helpers/lib/helpers/assert-file');
var assertFileEquals     = require('ember-cli-internal-test-helpers/lib/helpers/assert-file-equals');
var assertFileToNotExist = require('ember-cli-internal-test-helpers/lib/helpers/assert-file-to-not-exist');
var conf                 = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember                = require('../helpers/ember');
var fs                   = require('fs-extra');
var path                 = require('path');
var remove               = Promise.denodeify(fs.remove);
var root                 = process.cwd();
var tmproot              = path.join(root, 'tmp');
var Blueprint            = require('../../lib/models/blueprint');
var BlueprintNpmTask     = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
var expect               = require('chai').expect;
var mkTmpDirIn           = require('../../lib/utilities/mk-tmp-dir-in');

describe('Acceptance: ember generate in-repo-addon', function() {
  this.timeout(20000);

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
    conf.setup();
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
    conf.restore();
  });

  beforeEach(function() {
    return mkTmpDirIn(tmproot).then(function(tmpdir) {
      process.chdir(tmpdir);
    });
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower'
    ]);
  }

  function initInRepoAddon() {
    return initApp().then(function() {
      return ember([
        'generate',
        'in-repo-addon',
        'my-addon'
      ]);
    });
  }

  function generateInRepoAddon(args) {
    var generateArgs = ['generate'].concat(args);

    return initInRepoAddon().then(function() {
      return ember(generateArgs);
    });
  }

  it('in-repo-addon component x-foo', function() {
    return generateInRepoAddon(['component', 'x-foo', '--in-repo-addon=my-addon']).then(function() {
      assertFile('lib/my-addon/addon/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "import layout from '../templates/components/x-foo';",
          "export default Ember.Component.extend({",
          "layout",
          "});"
        ]
      });
      assertFile('lib/my-addon/addon/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('lib/my-addon/app/components/x-foo.js', {
        contains: [
          "export { default } from 'my-addon/components/x-foo';"
        ]
      });
      assertFile('tests/integration/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('x-foo'",
          "integration: true",
          "{{x-foo}}",
          "{{#x-foo}}"
        ]
      });
    });
  });

  it('in-repo-addon acceptance-test foo', function() {
    return generateInRepoAddon(['acceptance-test', 'foo', '--in-repo-addon=my-addon']).then(function() {
      var expected = path.join(__dirname, '../fixtures/generate/acceptance-test-expected.js');

      assertFileEquals('tests/acceptance/foo-test.js', expected);
      assertFileToNotExist('app/acceptance-tests/foo.js');
    });
  });

  it('in-repo-addon adds path to lib', function() {
    return initInRepoAddon().then(function() {
      assertFile('package.json', {
        contains: [
          'lib/my-addon'
        ]
      });
    });
  });

});
