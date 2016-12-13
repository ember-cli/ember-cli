'use strict';

var Promise    = require('../../lib/ext/promise');
var ember      = require('../helpers/ember');
var path       = require('path');
var remove     = Promise.denodeify(require('fs-extra').remove);
var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;

describe('Acceptance: ember install', function() {
  this.timeout(60000);

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

  function installAddon(addon) {
    addon = path.resolve(path.join(__dirname, '..', 'fixtures', 'install', addon));

    var commandArgs = ['install'].concat(addon);

    return initApp().then(function() {
      return ember(commandArgs);
    });
  }

  it('installs addons via npm and runs generators', function() {
    return installAddon('ember-cli-photoswipe-1.2.0.tgz')
    .then(function(result) {
      expect(file('package.json'))
        .to.match(/"ember-cli-photoswipe": ".*"/);

      expect(result.outputStream.join()).to.include('WARNING: Could not figure out blueprint name from:');

      return ember(["generate", "photoswipe"]);
    })
    .then(function(result) {
      expect(file('bower.json'))
        .to.match(/"photoswipe": ".*"/);

      expect(result.outputStream.join()).not.to.include('The `ember generate` command ' +
                                              'requires an entity name to be specified. For more details, use `ember help`.');
    });
  });
});
