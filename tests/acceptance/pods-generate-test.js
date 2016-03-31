'use strict';

var Promise          = require('../../lib/ext/promise');
var conf             = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember            = require('../helpers/ember');
var replaceFile      = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
var fs               = require('fs-extra');
var outputFile       = Promise.denodeify(fs.outputFile);
var path             = require('path');
var remove           = Promise.denodeify(fs.remove);
var root             = process.cwd();
var tmproot          = path.join(root, 'tmp');
var mkTmpDirIn       = require('../../lib/utilities/mk-tmp-dir-in');

var Blueprint        = require('../../lib/models/blueprint');
var BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

describe('Acceptance: ember generate pod', function() {
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

  function preGenerate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  function generate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  function generateWithPrefix(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      replaceFile('config/environment.js', "var ENV = {", "var ENV = {\npodModulePrefix: 'app/pods', \n");
      return ember(generateArgs);
    });
  }

  function generateWithUsePods(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      replaceFile('.ember-cli', '"disableAnalytics": false', '"disableAnalytics": false,\n"usePods" : true\n');
      return ember(generateArgs);
    });
  }

  function generateWithUsePodsDeprecated(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      replaceFile('config/environment.js', "var ENV = {", "var ENV = {\nusePodsByDefault: true, \n");
      return ember(generateArgs);
    });
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

  it('.ember-cli usePods setting generates in pod structure without --pod flag', function() {
    return generateWithUsePods(['controller', 'foo']).then(function() {
      expect(file('app/foo/controller.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("export default Ember.Controller.extend({\n});");

      expect(file('tests/unit/foo/controller-test.js'))
        .to.contain("import { moduleFor, test } from 'ember-qunit';")
        .to.contain("moduleFor('controller:foo'");
    });
  });

  it('.ember-cli usePods setting generates in classic structure with --classic flag', function() {
    return generateWithUsePods(['controller', 'foo', '--classic']).then(function() {
      expect(file('app/controllers/foo.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("export default Ember.Controller.extend({\n});");

      expect(file('tests/unit/controllers/foo-test.js'))
        .to.contain("import { moduleFor, test } from 'ember-qunit';")
        .to.contain("moduleFor('controller:foo'");
    });
  });

  it('.ember-cli usePods setting generates correct component structure', function() {
    return generateWithUsePods(['component', 'x-foo']).then(function() {
      expect(file('app/components/x-foo/component.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("export default Ember.Component.extend({")
        .to.contain("});");

      expect(file('app/components/x-foo/template.hbs'))
        .to.contain("{{yield}}");

      expect(file('tests/integration/components/x-foo/component-test.js'))
        .to.contain("import { moduleForComponent, test } from 'ember-qunit';")
        .to.contain("import hbs from 'htmlbars-inline-precompile';")
        .to.contain("moduleForComponent('x-foo'")
        .to.contain("integration: true");
    });
  });

  it('blueprint foo --pod', function() {
    return generate(['blueprint', 'foo', '--pod']).then(function() {
      expect(file('blueprints/foo/index.js'))
        .to.contain("module.exports = {\n" +
                    "  description: ''\n" +
                    "\n" +
                    "  // locals: function(options) {\n" +
                    "  //   // Return custom template variables here.\n" +
                    "  //   return {\n" +
                    "  //     foo: options.entity.options.foo\n" +
                    "  //   };\n" +
                    "  // }\n" +
                    "\n" +
                    "  // afterInstall: function(options) {\n" +
                    "  //   // Perform extra work here.\n" +
                    "  // }\n" +
                    "};");
    });
  });

  it('blueprint foo/bar --pod', function() {
    return generate(['blueprint', 'foo/bar', '--pod']).then(function() {
      expect(file('blueprints/foo/bar/index.js'))
        .to.contain("module.exports = {\n" +
                    "  description: ''\n" +
                    "\n" +
                    "  // locals: function(options) {\n" +
                    "  //   // Return custom template variables here.\n" +
                    "  //   return {\n" +
                    "  //     foo: options.entity.options.foo\n" +
                    "  //   };\n" +
                    "  // }\n" +
                    "\n" +
                    "  // afterInstall: function(options) {\n" +
                    "  //   // Perform extra work here.\n" +
                    "  // }\n" +
                    "};");
    });
  });

  it('http-mock foo --pod', function() {
    return generate(['http-mock', 'foo', '--pod']).then(function() {
      expect(file('server/index.js'))
        .to.contain("mocks.forEach(function(route) { route(app); });");

      expect(file('server/mocks/foo.js'))
        .to.contain("module.exports = function(app) {\n" +
                    "  var express = require('express');\n" +
                    "  var fooRouter = express.Router();\n" +
                    "\n" +
                    "  fooRouter.get('/', function(req, res) {\n" +
                    "    res.send({\n" +
                    "      'foo': []\n" +
                    "    });\n" +
                    "  });\n" +
                    "\n" +
                    "  fooRouter.post('/', function(req, res) {\n" +
                    "    res.status(201).end();\n" +
                    "  });\n" +
                    "\n" +
                    "  fooRouter.get('/:id', function(req, res) {\n" +
                    "    res.send({\n" +
                    "      'foo': {\n" +
                    "        id: req.params.id\n" +
                    "      }\n" +
                    "    });\n" +
                    "  });\n" +
                    "\n" +
                    "  fooRouter.put('/:id', function(req, res) {\n" +
                    "    res.send({\n" +
                    "      'foo': {\n" +
                    "        id: req.params.id\n" +
                    "      }\n" +
                    "    });\n" +
                    "  });\n" +
                    "\n" +
                    "  fooRouter.delete('/:id', function(req, res) {\n" +
                    "    res.status(204).end();\n" +
                    "  });\n" +
                    "\n" +
                    "  // The POST and PUT call will not contain a request body\n" +
                    "  // because the body-parser is not included by default.\n" +
                    "  // To use req.body, run:\n" +
                    "\n" +
                    "  //    npm install --save-dev body-parser\n" +
                    "\n" +
                    "  // After installing, you need to `use` the body-parser for\n" +
                    "  // this mock uncommenting the following line:\n" +
                    "  //\n" +
                    "  //app.use('/api/foo', require('body-parser').json());\n" +
                    "  app.use('/api/foo', fooRouter);\n" +
                    "};");

      expect(file('server/.jshintrc'))
        .to.contain('{\n  "node": true\n}');
    });
  });

  it('http-mock foo-bar --pod', function() {
    return generate(['http-mock', 'foo-bar', '--pod']).then(function() {
      expect(file('server/index.js'))
        .to.contain("mocks.forEach(function(route) { route(app); });");

      expect(file('server/mocks/foo-bar.js'))
        .to.contain("module.exports = function(app) {\n" +
                    "  var express = require('express');\n" +
                    "  var fooBarRouter = express.Router();\n" +
                    "\n" +
                    "  fooBarRouter.get('/', function(req, res) {\n" +
                    "    res.send({\n" +
                    "      'foo-bar': []\n" +
                    "    });\n" +
                    "  });\n" +
                    "\n" +
                    "  fooBarRouter.post('/', function(req, res) {\n" +
                    "    res.status(201).end();\n" +
                    "  });\n" +
                    "\n" +
                    "  fooBarRouter.get('/:id', function(req, res) {\n" +
                    "    res.send({\n" +
                    "      'foo-bar': {\n" +
                    "        id: req.params.id\n" +
                    "      }\n" +
                    "    });\n" +
                    "  });\n" +
                    "\n" +
                    "  fooBarRouter.put('/:id', function(req, res) {\n" +
                    "    res.send({\n" +
                    "      'foo-bar': {\n" +
                    "        id: req.params.id\n" +
                    "      }\n" +
                    "    });\n" +
                    "  });\n" +
                    "\n" +
                    "  fooBarRouter.delete('/:id', function(req, res) {\n" +
                    "    res.status(204).end();\n" +
                    "  });\n" +
                    "\n" +
                    "  // The POST and PUT call will not contain a request body\n" +
                    "  // because the body-parser is not included by default.\n" +
                    "  // To use req.body, run:\n" +
                    "\n" +
                    "  //    npm install --save-dev body-parser\n" +
                    "\n" +
                    "  // After installing, you need to `use` the body-parser for\n" +
                    "  // this mock uncommenting the following line:\n" +
                    "  //\n" +
                    "  //app.use('/api/foo-bar', require('body-parser').json());\n" +
                    "  app.use('/api/foo-bar', fooBarRouter);\n" +
                    "};");

      expect(file('server/.jshintrc'))
        .to.contain('{\n  "node": true\n}');
    });
  });

  it('http-proxy foo --pod', function() {
    return generate(['http-proxy', 'foo', 'http://localhost:5000', '--pod']).then(function() {
      expect(file('server/index.js'))
        .to.contain("proxies.forEach(function(route) { route(app); });");

      expect(file('server/proxies/foo.js'))
        .to.contain("var proxyPath = '/foo';\n" +
                    "\n" +
                    "module.exports = function(app) {\n" +
                    "  // For options, see:\n" +
                    "  // https://github.com/nodejitsu/node-http-proxy\n" +
                    "  var proxy = require('http-proxy').createProxyServer({});\n" +
                    "\n" +
                    "  proxy.on('error', function(err, req) {\n" +
                    "    console.error(err, req.url);\n" +
                    "  });\n" +
                    "\n" +
                    "  app.use(proxyPath, function(req, res, next){\n" +
                    "    // include root path in proxied request\n" +
                    "    req.url = proxyPath + '/' + req.url;\n" +
                    "    proxy.web(req, res, { target: 'http://localhost:5000' });\n" +
                    "  });\n" +
                    "};");

      expect(file('server/.jshintrc'))
        .to.contain('{\n  "node": true\n}');
    });
  });

  it('uses blueprints from the project directory', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';\n" +
          'export default Ember.Object.extend({ foo: true });\n'
        );
      })
      .then(function() {
        return ember(['generate', 'foo', 'bar', '--pod']);
      })
      .then(function() {
        expect(file('app/foos/bar.js')).to.contain('foo: true');
      });
  });

  it('allows custom blueprints to override built-ins', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/__path__/__name__.js',
          "import Ember from 'ember';\n\n" +
          "export default Ember.Controller.extend({ custom: true });\n"
        );
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo', '--pod']);
      })
      .then(function() {
        expect(file('app/foo/controller.js')).to.contain('custom: true');
      });
  });

  it('passes custom cli arguments to blueprint options', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/customblue/files/app/__name__.js',
          "Q: Can I has custom command? A: <%= hasCustomCommand %>"
        );
      })
      .then(function() {
        return outputFile(
          'blueprints/customblue/index.js',
          "module.exports = {\n" +
          "  fileMapTokens: function(options) {\n" +
          "    return {\n" +
          "      __name__: function(options) {\n" +
          "         return options.dasherizedModuleName;\n" +
          "      }\n" +
          "    };\n" +
          "  },\n" +
          "  locals: function(options) {\n" +
          "    var loc = {};\n" +
          "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';\n" +
          "    return loc;\n" +
          "  },\n" +
          "};\n"
        );
      })
      .then(function() {
        return ember(['generate', 'customblue', 'foo', '--custom-command', '--pod']);
      })
      .then(function() {
        expect(file('app/foo.js')).to.contain('A: Yes!');
      });
  });

  it('correctly identifies the root of the project', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/__path__/__name__.js',
          "import Ember from 'ember';\n\n" +
          "export default Ember.Controller.extend({ custom: true });\n"
        );
      })
      .then(function() {
        process.chdir(path.join(tmpdir, 'app'));
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo', '--pod']);
      })
      .then(function() {
        process.chdir(tmpdir);
      })
      .then(function() {
        expect(file('app/foo/controller.js')).to.contain('custom: true');
      });
  });

  // Skip until podModulePrefix is deprecated
  it.skip('podModulePrefix deprecation warning', function() {
    return generateWithPrefix(['controller', 'foo', '--pod']).then(function(result) {
      expect(result.outputStream.join()).to.include("`podModulePrefix` is deprecated and will be" +
      " removed from future versions of ember-cli. Please move existing pods from" +
      " 'app/pods/' to 'app/'.");
    });
  });

  it('usePodsByDefault deprecation warning', function() {
    return generateWithUsePodsDeprecated(['controller', 'foo', '--pod']).then(function(result) {
      expect(result.outputStream.join()).to.include('`usePodsByDefault` is no longer supported in' +
        ' \'config/environment.js\', use `usePods` in \'.ember-cli\' instead.');
    });
  });

  it('route foo --dry-run --pod does not change router.js', function() {
    return generate(['route', 'foo', '--dry-run', '--pod']).then(function() {
      expect(file('app/router.js')).to.not.contain("route('foo')");
    });
  });

  it('availableOptions work with aliases.', function() {
    return generate(['route', 'foo', '-d', '-p']).then(function() {
      expect(file('app/router.js')).to.not.contain("route('foo')");
    });
  });
});
