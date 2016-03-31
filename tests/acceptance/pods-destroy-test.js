'use strict';

var Promise     = require('../../lib/ext/promise');
var conf        = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember       = require('../helpers/ember');
var existsSync  = require('exists-sync');
var fs          = require('fs-extra');
var replaceFile = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
var outputFile  = Promise.denodeify(fs.outputFile);
var path        = require('path');
var remove      = Promise.denodeify(fs.remove);
var root        = process.cwd();
var tmproot     = path.join(root, 'tmp');
var mkTmpDirIn  = require('../../lib/utilities/mk-tmp-dir-in');

var Blueprint        = require('../../lib/models/blueprint');
var BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

describe('Acceptance: ember destroy pod', function() {
  var tmpdir;

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
    return mkTmpDirIn(tmproot).then(function(dir) {
      tmpdir = dir;
      process.chdir(tmpdir);
    });
  });

  afterEach(function() {
    this.timeout(10000);

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
        replaceFile('config/environment.js', "var ENV = {", "var ENV = {\npodModulePrefix: 'app/pods', \n");
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

  function assertDestroyAfterGenerateWithUsePods(args, files) {
    return initApp()
      .then(function() {
        replaceFile('.ember-cli', '"disableAnalytics": false', '"disableAnalytics": false,\n"usePods" : true\n');
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

  function destroyAfterGenerateWithPodsByDefault(args) {
    return initApp()
      .then(function() {
        replaceFile('config/environment.js', "var ENV = {", "var ENV = {\nusePodsByDefault: true, \n");
        return generate(args);
      })
      .then(function() {
        return destroy(args);
      });
  }

  function destroyAfterGenerate(args) {
    return initApp()
      .then(function() {
        replaceFile('config/environment.js', "var ENV = {", "var ENV = {\npodModulePrefix: 'app/pods', \n");
        return generate(args);
      })
      .then(function() {
        return destroy(args);
      });
  }

  it('.ember-cli usePods setting destroys in pod structure without --pod flag', function() {
    var commandArgs = ['controller', 'foo'];
    var files       = [
      'app/foo/controller.js',
      'tests/unit/foo/controller-test.js'
    ];

    return assertDestroyAfterGenerateWithUsePods(commandArgs, files);
  });

  it('.ember-cli usePods setting destroys in classic structure with --classic flag', function() {
    var commandArgs = ['controller', 'foo', '--classic'];
    var files       = [
      'app/controllers/foo.js',
      'tests/unit/controllers/foo-test.js'
    ];

    return assertDestroyAfterGenerateWithUsePods(commandArgs, files);
  });

  it('.ember-cli usePods setting correctly destroys component', function() {
    var commandArgs = ['component', 'x-foo'];
    var files       = [
      'app/components/x-foo/component.js',
      'app/components/x-foo/template.hbs',
      'tests/integration/components/x-foo/component-test.js'
    ];

    return assertDestroyAfterGenerateWithUsePods(commandArgs, files);
  });

  it('blueprint foo --pod', function() {
    var commandArgs = ['blueprint', 'foo', '--pod'];
    var files       = ['blueprints/foo/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('blueprint foo/bar --pod', function() {
    var commandArgs = ['blueprint', 'foo/bar', '--pod'];
    var files       = ['blueprints/foo/bar/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-mock foo --pod', function() {
    var commandArgs = ['http-mock', 'foo', '--pod'];
    var files       = ['server/mocks/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-proxy foo --pod', function() {
    var commandArgs = ['http-proxy', 'foo', 'bar', '--pod'];
    var files       = ['server/proxies/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('deletes files generated using blueprints from the project directory', function() {
    var commandArgs = ['foo', 'bar', '--pod'];
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
    var commandArgs = ['controller', 'foo', '--pod'];
    var files       = ['app/foo/controller.js'];
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/__path__/__name__.js',
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

  // Skip until podModulePrefix is deprecated
  it.skip('podModulePrefix deprecation warning', function() {
    return destroyAfterGenerate(['controller', 'foo', '--pod']).then(function(result) {
      expect(result.outputStream.join()).to.include("`podModulePrefix` is deprecated and will be" +
      " removed from future versions of ember-cli. Please move existing pods from" +
      " 'app/pods/' to 'app/'.");
    });
  });

  it('usePodsByDefault deprecation warning', function() {
    return destroyAfterGenerateWithPodsByDefault(['controller', 'foo', '--pod']).then(function(result) {
      expect(result.outputStream.join()).to.include('`usePodsByDefault` is no longer supported in' +
        ' \'config/environment.js\', use `usePods` in \'.ember-cli\' instead.');
    });
  });

});
