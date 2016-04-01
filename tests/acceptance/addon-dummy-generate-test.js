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

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

describe('Acceptance: ember generate in-addon-dummy', function() {
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

  function initAddon() {
    return ember([
      'addon',
      'my-addon',
      '--skip-npm',
      '--skip-bower'
    ]);
  }

  function generateInAddon(args) {
    var generateArgs = ['generate'].concat(args);

    return initAddon().then(function() {
      return ember(generateArgs);
    });
  }

  it('dummy component x-foo', function() {
    return generateInAddon(['component', 'x-foo', '--dummy']).then(function() {
      expect(file('tests/dummy/app/components/x-foo.js'))
        .to.contain("import Ember from 'ember';")
        .to.contain("export default Ember.Component.extend({")
        .to.contain("});");

      expect(file('tests/dummy/app/templates/components/x-foo.hbs'))
        .to.contain("{{yield}}");

      expect(file('app/components/x-foo.js')).to.not.exist;
      expect(file('tests/unit/components/x-foo-test.js')).to.not.exist;
    });
  });

  it('dummy blueprint foo', function() {
    return generateInAddon(['blueprint', 'foo', '--dummy']).then(function() {
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

  it('dummy blueprint foo/bar', function() {
    return generateInAddon(['blueprint', 'foo/bar', '--dummy']).then(function() {
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

  it('dummy http-mock foo', function() {
    return generateInAddon(['http-mock', 'foo', '--dummy']).then(function() {
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
                    "};\n");

      expect(file('server/.jshintrc'))
        .to.contain('{\n  "node": true\n}');
    });
  });

  it('dummy http-mock foo-bar', function() {
    return generateInAddon(['http-mock', 'foo-bar', '--dummy']).then(function() {
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
                    "};\n");

      expect(file('server/.jshintrc'))
        .to.contain('{\n  "node": true\n}');
    });
  });

  it('dummy http-proxy foo', function() {
    return generateInAddon(['http-proxy', 'foo', 'http://localhost:5000', '--dummy']).then(function() {
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

  it('dummy server', function() {
    return generateInAddon(['server', '--dummy']).then(function() {
      expect(file('server/index.js')).to.exist;
      expect(file('server/.jshintrc')).to.exist;
    });
  });

});
