'use strict';

var Promise              = require('../../lib/ext/promise');
var ember                = require('../helpers/ember');
var fs                   = require('fs-extra');
var path                 = require('path');
var remove               = Promise.denodeify(fs.remove);
var root                 = process.cwd();
var tmproot              = path.join(root, 'tmp');
var Blueprint            = require('blprnt');
var BlueprintNpmTask     = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
var mkTmpDirIn           = require('../../lib/utilities/mk-tmp-dir-in');

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;

describe('Acceptance: ember generate in-addon', function() {
  this.timeout(20000);

  before(function() {
    // TODO: remove
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    // TODO: remove
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

  function initAddon(name) {
    return ember([
      'addon',
      name,
      '--skip-npm',
      '--skip-bower'
    ]).then(addJSHint);
  }

  function addJSHint() {
    var pkg = fs.readJsonSync('package.json');
    pkg.devDependencies['ember-cli-jshint'] = '*';
    fs.writeJsonSync('package.json', pkg);
  }

  function generateInAddon(args) {
    var name = 'my-addon';
    var generateArgs = ['generate'].concat(args);

    if (arguments.length > 1) {
      name = arguments[1];
    }

    return initAddon(name).then(function() {
      return ember(generateArgs);
    });
  }

  it('in-addon addon-import cannot be called directly', function() {
    return generateInAddon(['addon-import', 'foo']).catch(function(error) {
      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal('You cannot call the addon-import blueprint directly.');
    });
  });

  it('in-addon addon-import component-addon works', function() {
    return generateInAddon(['component-addon', 'foo-bar', '--pod']).then(function() {
      expect(file('app/components/foo-bar/component.js'))
        .to.contain("export { default } from 'my-addon/components/foo-bar/component';");
    });
  });

  it('in-addon component x-foo', function() {
    return generateInAddon(['component', 'x-foo']).then(function() {
      expect(file('addon/components/x-foo.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("import layout from '../templates/components/x-foo';")
        .to.contain("export default Ember.Component.extend({")
        .to.contain("layout")
        .to.contain("});");

      expect(file('addon/templates/components/x-foo.hbs'))
        .to.contain("{{yield}}");

      expect(file('app/components/x-foo.js'))
        .to.contain("export { default } from 'my-addon/components/x-foo';");

      expect(file('tests/integration/components/x-foo-test.js'))
        .to.contain("import { moduleForComponent, test } from 'ember-qunit';")
        .to.contain("import hbs from 'htmlbars-inline-precompile';")
        .to.contain("moduleForComponent('x-foo'")
        .to.contain("integration: true")
        .to.contain("{{x-foo}}")
        .to.contain("{{#x-foo}}");
    });
  });

  it('in-addon blueprint foo', function() {
    return generateInAddon(['blueprint', 'foo']).then(function() {
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

  it('in-addon blueprint foo/bar', function() {
    return generateInAddon(['blueprint', 'foo/bar']).then(function() {
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

  it('in-addon http-mock foo', function() {
    return generateInAddon(['http-mock', 'foo']).then(function() {
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

  it('in-addon http-mock foo-bar', function() {
    return generateInAddon(['http-mock', 'foo-bar']).then(function() {
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

  it('in-addon http-proxy foo', function() {
    return generateInAddon(['http-proxy', 'foo', 'http://localhost:5000']).then(function() {
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

  it('in-addon server', function() {
    return generateInAddon(['server']).then(function() {
      expect(file('server/index.js')).to.exist;
    });
  });

});
