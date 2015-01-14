/*jshint quotmark: false*/

'use strict';

var Promise    = require('../../lib/ext/promise');
var assertFile = require('../helpers/assert-file');
var conf       = require('../helpers/conf');
var ember      = require('../helpers/ember');
var path       = require('path');
var rimraf     = Promise.denodeify(require('rimraf'));
var root       = process.cwd();
var tmp        = require('tmp-sync');
var tmproot    = path.join(root, 'tmp');

describe('Acceptance: ember install:addon', function() {
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
    return rimraf(tmproot);
  });

  function initApp() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower'
    ]);
  }

  function installAddon(args) {
    var generateArgs = ['install:addon'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  it('installs via npm and runs generator', function() {
    this.timeout(5000);

    return installAddon(['ember-cli-fastclick']).then(function() {
      assertFile('package.json', {
        contains: [
          /"ember-cli-fastclick": ".*"/
        ]
      });

      assertFile('bower.json', {
        contains: [
          /"fastclick": ".*"/
        ]
      });
    });
  });
});
