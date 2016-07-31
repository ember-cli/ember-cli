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

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;
var dir = chai.dir;

describe('Acceptance: ember destroy in-repo-addon', function() {
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

  function initInRepoAddon(addonName) {
    return ember([
      'generate',
      'in-repo-addon',
      addonName
    ]);
  }

  function destroy(args) {
    var destroyArgs = ['destroy'].concat(args);
    return ember(destroyArgs);
  }

  function assertFilesExist(files) {
    files.forEach(function(f) {
      expect(file(f)).to.exist;
    });
  }

  function assertFilesNotExist(files) {
    files.forEach(function(f) {
      expect(file(f)).to.not.exist;
    });
  }

  function assertDirsExist(dirs) {
    dirs.forEach(function(d) {
      expect(dir(d)).to.exist;
    });
  }

  function assertDirsNotExist(dirs) {
    dirs.forEach(function(d) {
      expect(dir(d)).to.not.exist;
    });
  }

  it('removes in-repo-addon files', function() {
    var files = ['lib/my-addon/index.js', 'lib/my-addon/package.json'];
    var addonName = 'my-addon';
    return initApp().then(function() {
      return initInRepoAddon(addonName);
    })
    .then(function() {
      return assertFilesExist(files);
    })
    .then(function() {
      return destroy(['in-repo-addon', 'my-addon']);
    })
    .then(function() {
      return assertFilesNotExist(files);
    });
  });

  it('removes in-repo-addon dir and empty lib dir', function() {
    var dirs = ['lib/my-addon', 'lib'];
    var addonName = 'my-addon';
    return initApp().then(function() {
      return initInRepoAddon(addonName);
    })
    .then(function() {
      return assertDirsExist(dirs);
    })
    .then(function() {
      return destroy(['in-repo-addon', 'my-addon']);
    })
    .then(function() {
      return assertDirsNotExist(dirs);
    });
  });

  it('removes in-repo-addon dir and keeps non-empty lib dir', function() {
    var dirs = ['lib/my-addon', 'lib/my-other-addon', 'lib'];
    var addonName1 = 'my-addon';
    var addonName2 = 'my-other-addon';
    return initApp().then(function() {
      return initInRepoAddon(addonName1);
    })
    .then(function() {
      return initInRepoAddon(addonName2);
    })
    .then(function() {
      return assertDirsExist(dirs);
    })
    .then(function() {
      return destroy(['in-repo-addon', 'my-addon']);
    })
    .then(function() {
      return assertDirsExist(dirs.slice(1,3));
    })
    .then(function() {
      return assertDirsNotExist(dirs.slice(0, 1));
    });
  });

  it('removes in-repo-addon lib path from package.json', function() {
    var addonName = 'my-addon';
    return initApp().then(function() {
      return initInRepoAddon(addonName);
    })
    .then(function() {
      expect(file('package.json')).to.contain('lib/my-addon');
    })
    .then(function() {
      return destroy(['in-repo-addon', 'my-addon']);
    })
    .then(function() {
      expect(file('package.json')).to.not.contain('lib/my-addon');
    });
  });
});
