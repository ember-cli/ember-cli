'use strict';

const co = require('co');
const RSVP = require('rsvp');
const ember = require('../helpers/ember');
const path = require('path');
let remove = RSVP.denodeify(require('fs-extra').remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

const { file, expect } = require('../chai');

describe('Acceptance: ember install', function() {
  this.timeout(120000);

  beforeEach(co.wrap(function *() {
    let tmpdir = yield mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  }));

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower',
    ]);
  }

  function installAddon(args) {
    let generateArgs = ['install'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  it('installs addons via npm and runs generators', co.wrap(function *() {
    let result = yield installAddon(['ember-cli-fastclick', 'ember-cli-photoswipe']);

    expect(file('package.json'))
      .to.match(/"ember-cli-fastclick": ".*"/)
      .to.match(/"ember-cli-photoswipe": ".*"/);

    expect(file('bower.json'))
      .to.match(/"photoswipe": ".*"/);

    expect(result.outputStream.join())
      .not.to.include('The `ember generate` command requires an entity name to be specified. For more details, use `ember help`.');
  }));
});
