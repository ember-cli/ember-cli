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

  it('controller foo --pod', function() {
    var commandArgs = ['controller', 'foo', '--pod'];
    var files       = [
      'app/pods/foo/controller.js',
      'tests/unit/controllers/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('controller foo/bar --pod', function() {
    var commandArgs = ['controller', 'foo/bar', '--pod'];
    var files       = [
      'app/pods/foo/bar/controller.js',
      'tests/unit/controllers/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('component x-foo --pod', function() {
    var commandArgs = ['component', 'x-foo', '--pod'];
    var files       = [
      'app/pods/x-foo/component.js',
      'app/pods/x-foo/template.hbs',
      'tests/unit/components/x-foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('helper foo-bar --pod', function() {
    var commandArgs = ['helper', 'foo-bar', '--pod'];
    var files       = [
      'app/helpers/foo-bar.js',
      'tests/unit/helpers/foo-bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('helper foo/bar-baz --pod', function() {
    var commandArgs = ['helper', 'foo/bar-baz', '--pod'];
    var files       = [
      'app/helpers/foo/bar-baz.js',
      'tests/unit/helpers/foo/bar-baz-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('model foo --pod', function() {
    var commandArgs = ['model', 'foo', '--pod'];
    var files       = [
      'app/pods/foo/model.js',
      'tests/unit/models/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('model foo/bar --pod', function() {
    var commandArgs = ['model', 'foo/bar', '--pod'];
    var files       = [
      'app/pods/foo/bar/model.js',
      'tests/unit/models/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('route foo --pod', function() {
    var commandArgs = ['route', 'foo', '--pod'];
    var files       = [
      'app/pods/foo/route.js',
      'app/pods/foo/template.hbs',
      'tests/unit/routes/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('route foo --type=resource --pod', function() {
    var commandArgs = ['route', 'foo', '--type=resource', '--pod'];
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

  it('route foos --type=resource --pod', function() {
    var commandArgs = ['route', 'foos', '--type=resource', '--pod'];
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

  it('route index --pod', function() {
    var commandArgs = ['route', 'index', '--pod'];
    var files       = [
      'app/pods/index/route.js',
      'app/pods/index/template.hbs',
      'tests/unit/routes/index-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('route basic --pod', function() {
    var commandArgs = ['route', 'basic', '--pod'];
    var files       = [
      'app/pods/basic/route.js',
      'app/pods/basic/template.hbs',
      'tests/unit/routes/basic-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('resource foo --pod', function() {
    var commandArgs = ['resource', 'foo', '--pod'];
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

  it('resource foos --pod', function() {
    var commandArgs = ['resource', 'foos', '--pod'];
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

  it('template foo --pod', function() {
    var commandArgs = ['template', 'foo', '--pod'];
    var files       = ['app/pods/foo/template.hbs'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('template foo/bar --pod', function() {
    var commandArgs = ['template', 'foo/bar', '--pod'];
    var files       = ['app/pods/foo/bar/template.hbs'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('view foo --pod', function() {
    var commandArgs = ['view', 'foo', '--pod'];
    var files       = [
      'app/pods/foo/view.js',
      'tests/unit/views/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('view foo/bar --pod', function() {
    var commandArgs = ['view', 'foo/bar', '--pod'];
    var files       = [
      'app/pods/foo/bar/view.js',
      'tests/unit/views/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('initializer foo --pod', function() {
    var commandArgs = ['initializer', 'foo', '--pod'];
    var files       = ['app/initializers/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('initializer foo/bar', function() {
    var commandArgs = ['initializer', 'foo/bar', '--pod'];
    var files       = ['app/initializers/foo/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('mixin foo --pod', function() {
    var commandArgs = ['mixin', 'foo', '--pod'];
    var files       = [
      'app/mixins/foo.js',
      'tests/unit/mixins/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('mixin foo/bar --pod', function() {
    var commandArgs = ['mixin', 'foo/bar', '--pod'];
    var files       = [
      'app/mixins/foo/bar.js',
      'tests/unit/mixins/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('adapter foo --pod', function() {
    var commandArgs = ['adapter', 'foo', '--pod'];
    var files       = ['app/adapters/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('adapter foo/bar --pod', function() {
    var commandArgs = ['adapter', 'foo/bar', '--pod'];
    var files       = ['app/adapters/foo/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('serializer foo --pod', function() {
    var commandArgs = ['serializer', 'foo', '--pod'];
    var files       = [
      'app/serializers/foo.js',
      'tests/unit/serializers/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('serializer foo/bar --pod', function() {
    var commandArgs = ['serializer', 'foo/bar', '--pod'];
    var files       = [
      'app/serializers/foo/bar.js',
      'tests/unit/serializers/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('transform foo --pod', function() {
    var commandArgs = ['transform', 'foo', '--pod'];
    var files       = [
      'app/transforms/foo.js',
      'tests/unit/transforms/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('transform foo/bar --pod', function() {
    var commandArgs = ['transform', 'foo/bar', '--pod'];
    var files       = [
      'app/transforms/foo/bar.js',
      'tests/unit/transforms/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('util foo-bar --pod', function() {
    var commandArgs = ['util', 'foo-bar', '--pod'];
    var files       = [
      'app/utils/foo-bar.js',
      'tests/unit/utils/foo-bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('util foo-bar/baz --pod', function() {
    var commandArgs = ['util', 'foo/bar-baz', '--pod'];
    var files       = [
      'app/utils/foo/bar-baz.js',
      'tests/unit/utils/foo/bar-baz-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('service foo --pod', function() {
    var commandArgs = ['service', 'foo', '--pod'];
    var files       = [
      'app/services/foo.js',
      'app/initializers/foo-service.js',
      'tests/unit/services/foo-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('service foo/bar --pod', function() {
    var commandArgs = ['service', 'foo/bar', '--pod'];
    var files       = [
      'app/services/foo/bar.js',
      'app/initializers/foo/bar-service.js',
      'tests/unit/services/foo/bar-test.js'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
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
    var files       = [
      'server/index.js',
      'server/mocks/foo.js',
      'server/.jshintrc'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-proxy foo --pod', function() {
    var commandArgs = ['http-proxy', 'foo', '--pod'];
    var files       = [
      'server/index.js',
      'server/proxies/foo.js',
      'server/.jshintrc'
    ];

    return assertDestroyAfterGenerate(commandArgs, files);
  });


  it('acceptance-test foo --pod', function() {
    var commandArgs = ['acceptance-test', 'foo', '--pod'];
    var files       = ['tests/acceptance/foo-test.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('deletes files generated using blueprints from the project directory', function() {
    var commandArgs = ['foo', 'bar', '--pod'];
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
    var commandArgs = ['controller', 'foo', '--pod'];
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
