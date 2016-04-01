'use strict';

var Promise    = require('../../lib/ext/promise');
var conf       = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember      = require('../helpers/ember');
var existsSync = require('exists-sync');
var fs         = require('fs-extra');
var outputFile = Promise.denodeify(fs.outputFile);
var path       = require('path');
var remove     = Promise.denodeify(fs.remove);
var root       = process.cwd();
var tmproot    = path.join(root, 'tmp');
var mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

var Blueprint        = require('../../lib/models/blueprint');
var BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

describe('Acceptance: ember destroy', function() {
  this.timeout(60000);
  var tmpdir;

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
    conf.setup();
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
    conf.restore();
  });

  beforeEach(function() {
    return mkTmpDirIn(tmproot).then(function(dir) {
      tmpdir = dir;
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

  function initAddon() {
    return ember([
      'addon',
      'my-addon',
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

  function generate(args) {
    var generateArgs = ['generate'].concat(args);
    return ember(generateArgs);
  }

  function generateInAddon(args) {
    var generateArgs = ['generate'].concat(args);

    return initAddon().then(function() {
      return ember(generateArgs);
    });
  }

  function generateInRepoAddon(args) {
    var generateArgs = ['generate'].concat(args);

    return initInRepoAddon().then(function() {
      return ember(generateArgs);
    });
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

  function assertDestroyAfterGenerate(args, files) {
    return initApp()
      .then(function() {
        return generate(args);
      })
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        return destroy(args);
      })
      .then(function(result) {
        expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
        assertFilesNotExist(files);
      });
  }

  function assertDestroyAfterGenerateInAddon(args, files) {
    return generateInAddon(args)
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        return destroy(args);
      })
      .then(function(result) {
        expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
        assertFilesNotExist(files);
      });
  }

  function assertDestroyAfterGenerateInRepoAddon(args, files) {
    return generateInRepoAddon(args)
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        return destroy(args);
      })
      .then(function(result) {
        expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
        assertFilesNotExist(files);
      });
  }

  function assertDestroyAfterGenerateInAddonDummy(args, files) {
    args = args.concat('--dummy');

    return generateInAddon(args)
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        return destroy(args);
      })
      .then(function(result) {
        expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
        assertFilesNotExist(files);
      });
  }

  it('in-addon component x-foo', function() {
    var commandArgs = ['component', 'x-foo'];
    var files       = [
      'addon/components/x-foo.js',
      'addon/templates/components/x-foo.hbs',
      'app/components/x-foo.js',
      'tests/integration/components/x-foo-test.js'
    ];

    return assertDestroyAfterGenerateInAddon(commandArgs, files);
  });

  it('in-repo-addon component x-foo', function() {
    var commandArgs = ['component', 'x-foo', '--in-repo-addon=my-addon'];
    var files       = [
      'lib/my-addon/addon/components/x-foo.js',
      'lib/my-addon/addon/templates/components/x-foo.hbs',
      'lib/my-addon/app/components/x-foo.js',
      'tests/integration/components/x-foo-test.js'
    ];

    return assertDestroyAfterGenerateInRepoAddon(commandArgs, files);
  });

  it('in-repo-addon component nested/x-foo', function() {
    var commandArgs = ['component', 'nested/x-foo', '--in-repo-addon=my-addon'];
    var files       = [
      'lib/my-addon/addon/components/nested/x-foo.js',
      'lib/my-addon/addon/templates/components/nested/x-foo.hbs',
      'lib/my-addon/app/components/nested/x-foo.js',
      'tests/integration/components/nested/x-foo-test.js'
    ];

    return assertDestroyAfterGenerateInRepoAddon(commandArgs, files);
  });

  it('in-addon-dummy component x-foo', function() {
    var commandArgs = ['component', 'x-foo'];
    var files       = [
      'tests/dummy/app/templates/components/x-foo.hbs',
      'tests/dummy/app/components/x-foo.js'
    ];

    return assertDestroyAfterGenerateInAddonDummy(commandArgs, files);
  });

  it('blueprint foo', function() {
    var commandArgs = ['blueprint', 'foo'];
    var files       = ['blueprints/foo/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('blueprint foo/bar', function() {
    var commandArgs = ['blueprint', 'foo/bar'];
    var files       = ['blueprints/foo/bar/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-mock foo', function() {
    var commandArgs = ['http-mock', 'foo'];
    var files       = ['server/mocks/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-proxy foo', function() {
    var commandArgs = ['http-proxy', 'foo', 'bar'];
    var files       = ['server/proxies/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('deletes files generated using blueprints from the project directory', function() {
    var commandArgs = ['foo', 'bar'];
    var files       = ['app/foos/bar.js'];
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';\n\n" +
          'export default Ember.Object.extend({ foo: true });\n'
        );
      })
      .then(function() {
        return generate(commandArgs);
      })
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        return destroy(commandArgs);
      })
      .then(function() {
        assertFilesNotExist(files);
      });
  });

  it('correctly identifies the root of the project', function() {
    var commandArgs = ['controller', 'foo'];
    var files       = ['app/controllers/foo.js'];
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/controllers/__name__.js',
          "import Ember from 'ember';\n\n" +
          "export default Ember.Controller.extend({ custom: true });\n"
        );
      })
      .then(function() {
        return generate(commandArgs);
      })
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        process.chdir(path.join(tmpdir, 'app'));
      })
      .then(function() {
        return destroy(commandArgs);
      })
      .then(function() {
        process.chdir(tmpdir);
      })
      .then(function() {
        assertFilesNotExist(files);
      });
  });

  it('http-mock <name> does not remove server/', function() {
    return initApp()
      .then(function() { return generate(['http-mock', 'foo']); })
      .then(function() { return generate(['http-mock', 'bar']); })
      .then(function() { return destroy(['http-mock', 'foo']); })
      .then(function() {
        expect(file('server/index.js')).to.exist;
        expect(file('server/.jshintrc')).to.exist;
      });
  });

});
