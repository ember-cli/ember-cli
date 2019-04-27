'use strict';

const RSVP = require('rsvp');
const ember = require('../helpers/ember');
const fs = require('fs-extra');
const path = require('path');
let remove = RSVP.denodeify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');
const initApp = require('../helpers/init-app');
const generateUtils = require('../helpers/generate-utils');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate with --in option', function() {
  this.timeout(20000);

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
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

  function removeAddonPath() {
    let packageJsonPath = path.join(process.cwd(), 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);

    delete packageJson['ember-addon'].paths;

    return fs.writeJsonSync(packageJsonPath, packageJson);
  }

  it('generate blueprint foo using lib', function() {
    // build an app with an in-repo addon in a non-standard path
    return (
      initApp()
        .then(() => generateUtils.inRepoAddon('lib/other-thing'))
        // generate in project blueprint to allow easier testing of in-repo generation
        .then(() => generateUtils.tempBlueprint())
        // confirm that we can generate into the non-lib path
        .then(() =>
          ember(['generate', 'foo', 'bar', '--in=lib/other-thing']).then(function() {
            expect(file('lib/other-thing/addon/foos/bar.js')).to.exist;
          })
        )
    );
  });

  it('generate blueprint foo using custom path using current directory', function() {
    // build an app with an in-repo addon in a non-standard path
    return (
      initApp()
        .then(() => generateUtils.inRepoAddon('./non-lib/other-thing'))
        // generate in project blueprint to allow easier testing of in-repo generation
        .then(() => generateUtils.tempBlueprint())
        // confirm that we can generate into the non-lib path
        .then(() =>
          ember(['generate', 'foo', 'bar', '--in=non-lib/other-thing']).then(function() {
            expect(file('non-lib/other-thing/addon/foos/bar.js')).to.exist;
          })
        )
    );
  });

  it('generate blueprint foo using custom path', function() {
    // build an app with an in-repo addon in a non-standard path
    return (
      initApp()
        .then(() => generateUtils.inRepoAddon('./non-lib/other-thing'))
        // generate in project blueprint to allow easier testing of in-repo generation
        .then(() => generateUtils.tempBlueprint())
        // confirm that we can generate into the non-lib path
        .then(() =>
          ember(['generate', 'foo', 'bar', '--in=./non-lib/other-thing']).then(function() {
            expect(file('non-lib/other-thing/addon/foos/bar.js')).to.exist;
          })
        )
    );
  });

  it('generate blueprint foo using custom nested path', function() {
    // build an app with an in-repo addon in a non-standard path
    return (
      initApp()
        .then(() => generateUtils.inRepoAddon('./non-lib/nested/other-thing'))
        // generate in project blueprint to allow easier testing of in-repo generation
        .then(() => generateUtils.tempBlueprint())
        // confirm that we can generate into the non-lib path
        .then(() =>
          ember(['generate', 'foo', 'bar', '--in=./non-lib/nested/other-thing']).then(function() {
            expect(file('non-lib/nested/other-thing/addon/foos/bar.js')).to.exist;
          })
        )
    );
  });

  it('generate blueprint foo using sibling path', function() {
    // build an app with an in-repo addon in a non-standard path
    return (
      initApp()
        .then(() => fs.mkdirp('../sibling'))
        .then(() => generateUtils.inRepoAddon('../sibling'))
        // we want to ensure the project has no awareness of the in-repo addon via `ember-addon.paths`, so we remove it
        .then(removeAddonPath)
        // generate in project blueprint to allow easier testing of in-repo generation
        .then(() => generateUtils.tempBlueprint())
        // confirm that we can generate into the non-lib path
        .then(() =>
          ember(['generate', 'foo', 'bar', '--in=../sibling']).then(function() {
            expect(file('../sibling/addon/foos/bar.js')).to.exist;
          })
        )
    );
  });
});
