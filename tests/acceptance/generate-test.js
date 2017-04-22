'use strict';

const co = require('co');
const RSVP = require('rsvp');
const ember = require('../helpers/ember');
const fs = require('fs-extra');
let outputFile = RSVP.denodeify(fs.outputFile);
const path = require('path');
let remove = RSVP.denodeify(fs.remove);
const replaceFile = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;

describe('Acceptance: ember generate', function() {
  this.timeout(20000);

  let tmpdir;

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(co.wrap(function *() {
    tmpdir = yield mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  }));

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower',
    ]).then(addJSHint);
  }

  function addJSHint() {
    let pkg = fs.readJsonSync('package.json');
    pkg.devDependencies['ember-cli-jshint'] = '*';
    fs.writeJsonSync('package.json', pkg);
  }

  function generate(args) {
    let generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  it('component x-foo', co.wrap(function *() {
    yield generate(['component', 'x-foo']);

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
  }));

  it('component foo/x-foo', co.wrap(function *() {
    yield generate(['component', 'foo/x-foo']);

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
  }));

  it('component x-foo ignores --path option', co.wrap(function *() {
    yield generate(['component', 'x-foo', '--path', 'foo']);

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
  }));

  it('blueprint foo', co.wrap(function *() {
    yield generate(['blueprint', 'foo']);

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

  it('blueprint foo/bar', co.wrap(function *() {
    yield generate(['blueprint', 'foo/bar']);

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

  it('http-mock foo', co.wrap(function *() {
    yield generate(['http-mock', 'foo']);

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

  it('http-mock foo-bar', co.wrap(function *() {
    yield generate(['http-mock', 'foo-bar']);

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

  it('http-proxy foo', co.wrap(function *() {
    yield generate(['http-proxy', 'foo', 'http://localhost:5000']);

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

  it('uses blueprints from the project directory', co.wrap(function *() {
    yield initApp();

    yield outputFile(
      'blueprints/foo/files/app/foos/__name__.js',
      "import Ember from 'ember';\n" +
      'export default Ember.Object.extend({ foo: true });\n'
    );

    yield ember(['generate', 'foo', 'bar']);

    expect(file('app/foos/bar.js')).to.contain('foo: true');
  }));

  it('allows custom blueprints to override built-ins', co.wrap(function *() {
    yield initApp();
    yield outputFile(
      'blueprints/controller/files/app/controllers/__name__.js',
      "import Ember from 'ember';\n\n" +
      "export default Ember.Controller.extend({ custom: true });\n"
    );

    yield ember(['generate', 'controller', 'foo']);

    expect(file('app/controllers/foo.js')).to.contain('custom: true');
  }));

  it('passes custom cli arguments to blueprint options', co.wrap(function *() {
    yield initApp();

    yield outputFile(
      'blueprints/customblue/files/app/__name__.js',
      "Q: Can I has custom command? A: <%= hasCustomCommand %>"
    );

    yield outputFile(
      'blueprints/customblue/index.js',
      "module.exports = {\n" +
      "  locals(options) {\n" +
      "    var loc = {};\n" +
      "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';\n" +
      "    return loc;\n" +
      "  },\n" +
      "};\n"
    );

    yield ember(['generate', 'customblue', 'foo', '--custom-command']);

    expect(file('app/foo.js')).to.contain('A: Yes!');
  }));

  it('correctly identifies the root of the project', co.wrap(function *() {
    yield initApp();

    yield outputFile(
      'blueprints/controller/files/app/controllers/__name__.js',
      "import Ember from 'ember';\n\n" +
      "export default Ember.Controller.extend({ custom: true });\n"
    );

    process.chdir(path.join(tmpdir, 'app'));
    yield ember(['generate', 'controller', 'foo']);

    process.chdir(tmpdir);
    expect(file('app/controllers/foo.js')).to.contain('custom: true');
  }));

  it('route foo --dry-run does not change router.js', co.wrap(function *() {
    yield generate(['route', 'foo', '--dry-run']);
    expect(file('app/router.js')).to.not.contain("route('foo')");
  }));

  it('server', co.wrap(function *() {
    yield generate(['server']);
    expect(file('server/index.js')).to.exist;
  }));

  it('availableOptions work with aliases.', co.wrap(function *() {
    yield generate(['route', 'foo', '-d']);
    expect(file('app/router.js')).to.not.contain("route('foo')");
  }));

  it('lib', co.wrap(function *() {
    yield generate(['lib']);
    expect(dir('lib')).to.exist;
  }));

  it('custom blueprint availableOptions', co.wrap(function *() {
    yield initApp();
    yield ember(['generate', 'blueprint', 'foo']);

    replaceFile('blueprints/foo/index.js', 'module.exports = {',
      'module.exports = {\navailableOptions: [ \n' +
      '{ name: \'foo\',\ntype: String, \n' +
      'values: [\'one\', \'two\'],\n' +
      'default: \'one\',\n' +
      'aliases: [ {\'one\': \'one\'}, {\'two\': \'two\'} ] } ],\n' +
      'locals(options) {\n' +
      'return { foo: options.foo };\n' +
      '},');

    yield outputFile(
      'blueprints/foo/files/app/foos/__name__.js',
      "import Ember from 'ember';\n" +
      'export default Ember.Object.extend({ foo: <%= foo %> });\n'
    );

    yield ember(['generate', 'foo', 'bar', '-two']);

    expect(file('app/foos/bar.js')).to.contain('export default Ember.Object.extend({ foo: two });');
  }));
});
