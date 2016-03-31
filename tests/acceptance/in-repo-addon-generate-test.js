'use strict';

var Promise              = require('../../lib/ext/promise');
var conf                 = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember                = require('../helpers/ember');
var fs                   = require('fs-extra');
var path                 = require('path');
var remove               = Promise.denodeify(fs.remove);
var root                 = process.cwd();
var tmproot              = path.join(root, 'tmp');
var Blueprint            = require('../../lib/models/blueprint');
var BlueprintNpmTask     = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
var mkTmpDirIn           = require('../../lib/utilities/mk-tmp-dir-in');

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

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
      expect(file('lib/my-addon/addon/components/x-foo.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("import layout from '../templates/components/x-foo';")
        .to.contain("export default Ember.Component.extend({")
        .to.contain("layout")
        .to.contain("});");

      expect(file('lib/my-addon/addon/templates/components/x-foo.hbs'))
        .to.contain("{{yield}}");

      expect(file('lib/my-addon/app/components/x-foo.js'))
        .to.contain("export { default } from 'my-addon/components/x-foo';");

      expect(file('tests/integration/components/x-foo-test.js'))
        .to.contain("import { moduleForComponent, test } from 'ember-qunit';")
        .to.contain("import hbs from 'htmlbars-inline-precompile';")
        .to.contain("moduleForComponent('x-foo'")
        .to.contain("integration: true")
        .to.contain("{{x-foo}}")
        .to.contain("{{#x-foo}}");
    });
  });

  it('in-repo-addon acceptance-test foo', function() {
    return generateInRepoAddon(['acceptance-test', 'foo', '--in-repo-addon=my-addon']).then(function() {
      var expected = path.join(__dirname, '../fixtures/generate/acceptance-test-expected.js');

      expect(file('tests/acceptance/foo-test.js')).to.equal(file(expected));
      expect(file('app/acceptance-tests/foo.js')).to.not.exist;
    });
  });

  it('in-repo-addon adds path to lib', function() {
    return initInRepoAddon().then(function() {
      expect(file('package.json')).to.contain('lib/my-addon');
    });
  });

});
