'use strict';

var Promise          = require('../../lib/ext/promise');
var conf             = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember            = require('../helpers/ember');
var fs               = require('fs-extra');
var outputFile       = Promise.denodeify(fs.outputFile);
var path             = require('path');
var remove           = Promise.denodeify(fs.remove);
var replaceFile      = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
var root             = process.cwd();
var tmproot          = path.join(root, 'tmp');
var Blueprint        = require('../../lib/models/blueprint');
var BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
var mkTmpDirIn       = require('../../lib/utilities/mk-tmp-dir-in');

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

describe('Acceptance: ember generate', function() {
  this.timeout(20000);

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

  function generate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  it('component x-foo', function() {
    return generate(['component', 'x-foo']).then(function() {
      expect(file('app/components/x-foo.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("export default Ember.Component.extend({")
        .to.contain("});");

      expect(file('app/templates/components/x-foo.hbs'))
        .to.contain("{{yield}}");

      expect(file('tests/integration/components/x-foo-test.js'))
        .to.contain("import { moduleForComponent, test } from 'ember-qunit';")
        .to.contain("import hbs from 'htmlbars-inline-precompile';")
        .to.contain("moduleForComponent('x-foo'")
        .to.contain("integration: true")
        .to.contain("{{x-foo}}")
        .to.contain("{{#x-foo}}");
    });
  });

  it('component foo/x-foo', function() {
    return generate(['component', 'foo/x-foo']).then(function() {
      expect(file('app/components/foo/x-foo.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("export default Ember.Component.extend({")
        .to.contain("});");

      expect(file('app/templates/components/foo/x-foo.hbs'))
        .to.contain("{{yield}}");

      expect(file('tests/integration/components/foo/x-foo-test.js'))
        .to.contain("import { moduleForComponent, test } from 'ember-qunit';")
        .to.contain("import hbs from 'htmlbars-inline-precompile';")
        .to.contain("moduleForComponent('foo/x-foo'")
        .to.contain("integration: true")
        .to.contain("{{foo/x-foo}}")
        .to.contain("{{#foo/x-foo}}");
    });
  });

  it('component x-foo ignores --path option', function() {
    return generate(['component', 'x-foo', '--path', 'foo']).then(function() {
      expect(file('app/components/x-foo.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("export default Ember.Component.extend({")
        .to.contain("});");

      expect(file('app/templates/components/x-foo.hbs'))
        .to.contain("{{yield}}");

      expect(file('tests/integration/components/x-foo-test.js'))
        .to.contain("import { moduleForComponent, test } from 'ember-qunit';")
        .to.contain("import hbs from 'htmlbars-inline-precompile';")
        .to.contain("moduleForComponent('x-foo'")
        .to.contain("integration: true")
        .to.contain("{{x-foo}}")
        .to.contain("{{#x-foo}}");
    });
  });

  it('blueprint foo', function() {
    return generate(['blueprint', 'foo']).then(function() {
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

  it('blueprint foo/bar', function() {
    return generate(['blueprint', 'foo/bar']).then(function() {
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

  it('http-mock foo', function() {
    return generate(['http-mock', 'foo']).then(function() {
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

  it('http-mock foo-bar', function() {
    return generate(['http-mock', 'foo-bar']).then(function() {
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

  it('http-proxy foo', function() {
    return generate(['http-proxy', 'foo', 'http://localhost:5000']).then(function() {
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
        return ember(['generate', 'foo', 'bar']);
      })
      .then(function() {
        expect(file('app/foos/bar.js')).to.contain('foo: true');
      });
  });

  it('allows custom blueprints to override built-ins', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/controllers/__name__.js',
          "import Ember from 'ember';\n\n" +
          "export default Ember.Controller.extend({ custom: true });\n"
        );
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo']);
      })
      .then(function() {
        expect(file('app/controllers/foo.js')).to.contain('custom: true');
      });
  });

  it('passes custom cli arguments to blueprint options', function() {
    return initApp()
      .then(function() {
        outputFile(
          'blueprints/customblue/files/app/__name__.js',
          "Q: Can I has custom command? A: <%= hasCustomCommand %>"
        );
        return outputFile(
          'blueprints/customblue/index.js',
          "module.exports = {\n" +
          "  locals: function(options) {\n" +
          "    var loc = {};\n" +
          "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';\n" +
          "    return loc;\n" +
          "  },\n" +
          "};\n"
        );
      })
      .then(function() {
        return ember(['generate', 'customblue', 'foo', '--custom-command']);
      })
      .then(function() {
        expect(file('app/foo.js')).to.contain('A: Yes!');
      });
  });

  it('correctly identifies the root of the project', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/controllers/__name__.js',
          "import Ember from 'ember';\n\n" +
          "export default Ember.Controller.extend({ custom: true });\n"
        );
      })
      .then(function() {
        process.chdir(path.join(tmpdir, 'app'));
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo']);
      })
      .then(function() {
        process.chdir(tmpdir);
      })
      .then(function() {
        expect(file('app/controllers/foo.js')).to.contain('custom: true');
      });
  });

  it('route foo --dry-run does not change router.js', function() {
    return generate(['route', 'foo', '--dry-run']).then(function() {
      expect(file('app/router.js')).to.not.contain("route('foo')");
    });
  });

  it('server', function() {
    return generate(['server']).then(function() {
      expect(file('server/index.js')).to.exist;
      expect(file('server/.jshintrc')).to.exist;
    });
  });

  it('availableOptions work with aliases.', function() {
    return generate(['route', 'foo', '-d']).then(function() {
      expect(file('app/router.js')).to.not.contain("route('foo')");
    });
  });

  it('lib', function() {
    return generate(['lib']).then(function() {
      expect(file('lib/.jshintrc')).to.exist;
    });
  });

  it('custom blueprint availableOptions', function() {
    return initApp().then(function() {
      return ember(['generate', 'blueprint', 'foo']).then(function() {
        replaceFile('blueprints/foo/index.js', 'module.exports = {',
          'module.exports = {\navailableOptions: [ \n' +
          '{ name: \'foo\',\ntype: String, \n' +
          'values: [\'one\', \'two\'],\n' +
          'default: \'one\',\n' +
          'aliases: [ {\'one\': \'one\'}, {\'two\': \'two\'} ] } ],\n' +
          'locals: function(options) {\n' +
          'return { foo: options.foo };\n' +
          '},');

        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';\n" +
          'export default Ember.Object.extend({ foo: <%= foo %> });\n'
        ).then(function() {
          return ember(['generate','foo','bar','-two']);
        });
      });
    }).then(function() {
      expect(file('app/foos/bar.js')).to.contain('export default Ember.Object.extend({ foo: two });');
    });
  });
});
