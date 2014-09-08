/*jshint quotmark: false*/

'use strict';

var Promise     = require('../../lib/ext/promise');
var assert      = require('../helpers/assert');
var assertFile  = require('../helpers/assert-file');
var conf        = require('../helpers/conf');
var ember       = require('../helpers/ember');
var fs          = require('fs-extra');
var replaceFile = require('../helpers/file-utils').replaceFile;
var outputFile  = Promise.denodeify(fs.outputFile);
var path        = require('path');
var rimraf      = require('rimraf');
var root        = process.cwd();
var tmp         = require('tmp-sync');
var tmproot     = path.join(root, 'tmp');
var EOL         = require('os').EOL;

describe('Acceptance: ember destroy pod', function() {
  var tmpdir;

  this.timeout(5000);


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
    return ember(generateArgs);
  }

  function destroy(args) {
    var destroyArgs = ['destroy'].concat(args);
    return ember(destroyArgs);
  }

  function assertFileNotExists(file) {
    var filePath = path.join(process.cwd(), file);
    assert(!fs.existsSync(filePath), 'expected ' + file + ' not to exist');
  }

  function assertFilesExist(files) {
    files.forEach(assertFile);
  }

  function assertFilesNotExist(files) {
    files.forEach(assertFileNotExists);
  }

  function assertDestroyAfterGenerate(args, files) {
    return initApp()
      .then(function() {
        replaceFile('app/app.js', "Resolver: Resolver", "podModulePrefix: 'app/pods', " + EOL + "Resolver: Resolver");
        return generate(args);
      })
      .then(function() {
        assertFilesExist(files);
      })
      .then(function() {
        return destroy(args);
      })
      .then(function() {
        assertFilesNotExist(files);
      });
  }

  it('controller foo', function() {
    var commandArgs = ['controller', 'foo', '--structure=pod'];
    var files       = [
      'app/pods/foo/controller.js',
      'tests/unit/controllers/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('controller foo/bar', function() {
    var commandArgs = ['controller', 'foo/bar', '--structure=pod'];
    var files       = [
      'app/pods/foo/bar/controller.js',
      'tests/unit/controllers/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('component x-foo', function() {
    var commandArgs = ['component', 'x-foo', '--structure=pod'];
    var files       = [
      'app/pods/x-foo/component.js',
      'app/pods/x-foo/template.hbs',
      'tests/unit/components/x-foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('helper foo-bar', function() {
    var commandArgs = ['helper', 'foo-bar', '--structure=pod'];
    var files       = [
      'app/helpers/foo-bar.js',
      'tests/unit/helpers/foo-bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('helper foo/bar-baz', function() {
    var commandArgs = ['helper', 'foo/bar-baz', '--structure=pod'];
    var files       = [
      'app/helpers/foo/bar-baz.js',
      'tests/unit/helpers/foo/bar-baz-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('model foo', function() {
    var commandArgs = ['model', 'foo', '--structure=pod'];
    var files       = [
      'app/pods/foo/model.js',
      'tests/unit/models/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('model foo/bar', function() {
    var commandArgs = ['model', 'foo/bar', '--structure=pod'];
    var files       = [
      'app/pods/foo/bar/model.js',
      'tests/unit/models/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('route foo', function() {
    var commandArgs = ['route', 'foo', '--structure=pod'];
    var files       = [
      'app/pods/foo/route.js',
      'app/pods/foo/template.hbs',
      'tests/unit/routes/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('route foo --type=resource', function() {
    var commandArgs = ['route', 'foo', '--type=resource', '--structure=pod'];
    var files       = [
      'app/pods/foo/route.js',
      'app/pods/foo/template.hbs',
      'tests/unit/routes/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files)
      .then(function() {
        assertFile('app/router.js', {
          doesNotContain: "this.resource('foo', { path: 'foos/:foo_id' });"
        });
      });
  });

  it('route foos --type=resource', function() {
    var commandArgs = ['route', 'foos', '--type=resource', '--structure=pod'];
    var files       = [
      'app/pods/foos/route.js',
      'app/pods/foos/template.hbs',
      'tests/unit/routes/foos-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files)
      .then(function() {
        assertFile('app/router.js', {
          doesNotContain: "this.resource('foos');"
        });
      });
  });

  it('route index', function() {
    var commandArgs = ['route', 'index', '--structure=pod'];
    var files       = [
      'app/pods/index/route.js',
      'app/pods/index/template.hbs',
      'tests/unit/routes/index-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('route basic', function() {
    var commandArgs = ['route', 'basic', '--structure=pod'];
    var files       = [
      'app/pods/basic/route.js',
      'app/pods/basic/template.hbs',
      'tests/unit/routes/basic-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('resource foo', function() {
    var commandArgs = ['resource', 'foo', '--structure=pod'];
    var files       = [
      'app/pods/foo/model.js',
      'tests/unit/models/foo-test.js',
      'app/pods/foo/route.js',
      'tests/unit/routes/foo-test.js',
      'app/pods/foo/template.hbs'
    ];

    return assertDestroyAfterGenerate(commandArgs, files)
      .then(function() {
        assertFile('app/router.js', {
          doesNotContain: "this.resource('foo', { path: 'foos/:foo_id' });"
        });
      });
  });

  it('resource foos', function() {
    var commandArgs = ['resource', 'foos', '--structure=pod'];
    var files       = [
      'app/pods/foo/model.js',
      'tests/unit/models/foo-test.js',
      'app/pods/foos/route.js',
      'tests/unit/routes/foos-test.js',
      'app/pods/foos/template.hbs'
    ];

    return assertDestroyAfterGenerate(commandArgs, files)
      .then(function() {
        assertFile('app/router.js', {
          doesNotContain: "this.resource('foos');"
        });
      });
  });

  it('template foo', function() {
    var commandArgs = ['template', 'foo', '--structure=pod'];
    var files       = ['app/pods/foo/template.hbs'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('template foo/bar', function() {
    var commandArgs = ['template', 'foo/bar', '--structure=pod'];
    var files       = ['app/pods/foo/bar/template.hbs'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('view foo', function() {
    var commandArgs = ['view', 'foo', '--structure=pod'];
    var files       = [
      'app/pods/foo/view.js',
      'tests/unit/views/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('view foo/bar', function() {
    var commandArgs = ['view', 'foo/bar', '--structure=pod'];
    var files       = [
      'app/pods/foo/bar/view.js',
      'tests/unit/views/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('initializer foo', function() {
    var commandArgs = ['initializer', 'foo', '--structure=pod'];
    var files       = ['app/initializers/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('initializer foo/bar', function() {
    var commandArgs = ['initializer', 'foo/bar', '--structure=pod'];
    var files       = ['app/initializers/foo/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('mixin foo', function() {
    var commandArgs = ['mixin', 'foo', '--structure=pod'];
    var files       = [
      'app/mixins/foo.js',
      'tests/unit/mixins/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('mixin foo/bar', function() {
    var commandArgs = ['mixin', 'foo/bar', '--structure=pod'];
    var files       = [
      'app/mixins/foo/bar.js',
      'tests/unit/mixins/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('adapter foo', function() {
    var commandArgs = ['adapter', 'foo', '--structure=pod'];
    var files       = ['app/adapters/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('adapter foo/bar', function() {
    var commandArgs = ['adapter', 'foo/bar', '--structure=pod'];
    var files       = ['app/adapters/foo/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('serializer foo', function() {
    var commandArgs = ['serializer', 'foo', '--structure=pod'];
    var files       = [
      'app/serializers/foo.js',
      'tests/unit/serializers/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('serializer foo/bar', function() {
    var commandArgs = ['serializer', 'foo/bar', '--structure=pod'];
    var files       = [
      'app/serializers/foo/bar.js',
      'tests/unit/serializers/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('transform foo', function() {
    var commandArgs = ['transform', 'foo', '--structure=pod'];
    var files       = [
      'app/transforms/foo.js',
      'tests/unit/transforms/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('transform foo/bar', function() {
    var commandArgs = ['transform', 'foo/bar', '--structure=pod'];
    var files       = [
      'app/transforms/foo/bar.js',
      'tests/unit/transforms/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('util foo-bar', function() {
    var commandArgs = ['util', 'foo-bar', '--structure=pod'];
    var files       = [
      'app/utils/foo-bar.js',
      'tests/unit/utils/foo-bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('util foo-bar/baz', function() {
    var commandArgs = ['util', 'foo/bar-baz', '--structure=pod'];
    var files       = [
      'app/utils/foo/bar-baz.js',
      'tests/unit/utils/foo/bar-baz-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('service foo', function() {
    var commandArgs = ['service', 'foo', '--structure=pod'];
    var files       = [
      'app/services/foo.js',
      'app/initializers/foo-service.js',
      'tests/unit/services/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('service foo/bar', function() {
    var commandArgs = ['service', 'foo/bar', '--structure=pod'];
    var files       = [
      'app/services/foo/bar.js',
      'app/initializers/foo/bar-service.js',
      'tests/unit/services/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('blueprint foo', function() {
    var commandArgs = ['blueprint', 'foo', '--structure=pod'];
    var files       = ['blueprints/foo/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('blueprint foo/bar', function() {
    var commandArgs = ['blueprint', 'foo/bar', '--structure=pod'];
    var files       = ['blueprints/foo/bar/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-mock foo', function() {
    var commandArgs = ['http-mock', 'foo', '--structure=pod'];
    var files       = [
      'server/index.js',
      'server/mocks/foo.js',
      'server/.jshintrc'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-proxy foo', function() {
    var commandArgs = ['http-proxy', 'foo', '--structure=pod'];
    var files       = [
      'server/index.js',
      'server/proxies/foo.js',
      'server/.jshintrc'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });


  it('acceptance-test foo', function() {
    var commandArgs = ['acceptance-test', 'foo', '--structure=pod'];
    var files       = ['tests/acceptance/foo-test.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('deletes files generated using blueprints from the project directory', function() {
    var commandArgs = ['foo', 'bar', '--structure=pod'];
    var files       = ['app/foos/bar.js'];
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';" + EOL + EOL +
          'export default Ember.Object.extend({ foo: true });' + EOL
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
    var commandArgs = ['controller', 'foo', '--structure=pod'];
    var files       = ['app/foo/controller.js'];
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/__path__/__name__.js',
          "import Ember from 'ember';" + EOL + EOL +
          "export default Ember.Controller.extend({ custom: true });" + EOL
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

});
