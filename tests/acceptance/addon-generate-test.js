'use strict';

const co = require('co');
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

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate in-addon', function() {
  this.timeout(20000);

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(co.wrap(function *() {
    let tmpdir = yield mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  }));

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initAddon(name) {
    return ember([
      'addon',
      name,
      '--skip-npm',
      '--skip-bower',
    ]).then(addJSHint);
  }

  function addJSHint() {
    let pkg = fs.readJsonSync('package.json');
    pkg.devDependencies['ember-cli-jshint'] = '*';
    fs.writeJsonSync('package.json', pkg);
  }

  function generateInAddon(args) {
    let name = 'my-addon';
    let generateArgs = ['generate'].concat(args);

    if (arguments.length > 1) {
      name = arguments[1];
    }

    return initAddon(name).then(function() {
      return ember(generateArgs);
    });
  }

  it('in-addon addon-import cannot be called directly', co.wrap(function *() {
    try {
      yield generateInAddon(['addon-import', 'foo']);
    } catch (error) {
      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal('You cannot call the addon-import blueprint directly.');
    }
  }));

  it('in-addon addon-import component-addon works', co.wrap(function *() {
    yield generateInAddon(['component-addon', 'foo-bar', '--pod']);

    expect(file('app/components/foo-bar/component.js'))
      .to.contain("export { default } from 'my-addon/components/foo-bar/component';");
  }));

  it('in-addon component x-foo', co.wrap(function *() {
    yield generateInAddon(['component', 'x-foo']);

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
  }));

  it('in-addon blueprint foo', co.wrap(function *() {
    yield generateInAddon(['blueprint', 'foo']);

    expect(file('blueprints/foo/index.js'))
      .to.contain("module.exports = {\n" +
                  "  description: ''\n" +
                  "\n" +
                  "  // locals(options) {\n" +
                  "  //   // Return custom template variables here.\n" +
                  "  //   return {\n" +
                  "  //     foo: options.entity.options.foo\n" +
                  "  //   };\n" +
                  "  // }\n" +
                  "\n" +
                  "  // afterInstall(options) {\n" +
                  "  //   // Perform extra work here.\n" +
                  "  // }\n" +
                  "};");
  }));

  it('in-addon blueprint foo/bar', co.wrap(function *() {
    yield generateInAddon(['blueprint', 'foo/bar']);

    expect(file('blueprints/foo/bar/index.js'))
      .to.contain("module.exports = {\n" +
                  "  description: ''\n" +
                  "\n" +
                  "  // locals(options) {\n" +
                  "  //   // Return custom template variables here.\n" +
                  "  //   return {\n" +
                  "  //     foo: options.entity.options.foo\n" +
                  "  //   };\n" +
                  "  // }\n" +
                  "\n" +
                  "  // afterInstall(options) {\n" +
                  "  //   // Perform extra work here.\n" +
                  "  // }\n" +
                  "};");
  }));

  it('in-addon http-mock foo', co.wrap(function *() {
    yield generateInAddon(['http-mock', 'foo']);

    expect(file('server/index.js'))
      .to.contain("mocks.forEach(route => route(app));");

    expect(file('server/mocks/foo.js'))
      .to.contain("module.exports = function(app) {\n" +
                  "  const express = require('express');\n" +
                  "  let fooRouter = express.Router();\n" +
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
  }));

  it('in-addon http-mock foo-bar', co.wrap(function *() {
    yield generateInAddon(['http-mock', 'foo-bar']);

    expect(file('server/index.js'))
      .to.contain("mocks.forEach(route => route(app));");

    expect(file('server/mocks/foo-bar.js'))
      .to.contain("module.exports = function(app) {\n" +
                  "  const express = require('express');\n" +
                  "  let fooBarRouter = express.Router();\n" +
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
  }));

  it('in-addon http-proxy foo', co.wrap(function *() {
    yield generateInAddon(['http-proxy', 'foo', 'http://localhost:5000']);

    expect(file('server/index.js'))
      .to.contain("proxies.forEach(route => route(app));");

    expect(file('server/proxies/foo.js'))
      .to.contain("const proxyPath = '/foo';\n" +
                  "\n" +
                  "module.exports = function(app) {\n" +
                  "  // For options, see:\n" +
                  "  // https://github.com/nodejitsu/node-http-proxy\n" +
                  "  let proxy = require('http-proxy').createProxyServer({});\n" +
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
  }));

  it('in-addon server', co.wrap(function *() {
    yield generateInAddon(['server']);
    expect(file('server/index.js')).to.exist;
  }));

});
