/*jshint quotmark: false*/

'use strict';

var Promise          = require('../../lib/ext/promise');
var assertFile       = require('../helpers/assert-file');
var assertFileEquals = require('../helpers/assert-file-equals');
var conf             = require('../helpers/conf');
var ember            = require('../helpers/ember');
var fileUtils        = require('../helpers/file-utils');
var fs               = require('fs-extra');
var outputFile       = Promise.denodeify(fs.outputFile);
var path             = require('path');
var rimraf           = require('rimraf');
var root             = process.cwd();
var tmp              = require('tmp-sync');
var tmproot          = path.join(root, 'tmp');
var EOL              = require('os').EOL;

describe('Acceptance: ember generate pod', function() {
  var tmpdir;

  before(function() {
    conf.setup();
  });

  after(function() {
    conf.restore();
  });

  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    this.timeout(10000);

    process.chdir(root);
    rimraf.sync(tmproot);
  });

  function initApp() {
    return ember(['init', 'my-app', '--skip-npm', '--skip-bower']);
  }

  function generate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      fileUtils.touch('app/app.js', "{podModulePrefix: 'app/pods'}");
      return ember(generateArgs);
    });
  }

  it('controller foo', function() {
    return generate(['controller', 'foo', '--structure=pod']).then(function() {
      assertFile('app/foo/controller.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({" + EOL + "});"
        ]
      });
      assertFile('tests/unit/controllers/foo-test.js', {
        contains: [
          "import { test, moduleFor } from 'ember-qunit';",
          "moduleFor('controller:foo', 'FooController'"
        ]
      });
    });
  });
});
