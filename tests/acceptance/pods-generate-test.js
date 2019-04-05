'use strict';

const co = require('co');
const RSVP = require('rsvp');
const ember = require('../helpers/ember');
const replaceFile = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
const fs = require('fs-extra');
let outputFile = RSVP.denodeify(fs.outputFile);
const path = require('path');
let remove = RSVP.denodeify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate pod', function() {
  this.timeout(60000);

  let tmpdir;

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(
    co.wrap(function*() {
      tmpdir = yield mkTmpDirIn(tmproot);
      process.chdir(tmpdir);
    })
  );

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember(['init', '--name=my-app', '--skip-npm', '--skip-bower']).then(addJSHint);
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

  function generateWithPrefix(args) {
    let generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      replaceFile('config/environment.js', '(var|let|const) ENV = {', "$1 ENV = {\npodModulePrefix: 'app/pods', \n");
      return ember(generateArgs);
    });
  }

  it(
    'blueprint foo --pod',
    co.wrap(function*() {
      yield generate(['blueprint', 'foo', '--pod']);

      expect(file('blueprints/foo/index.js')).to.contain(
        'module.exports = {\n' +
          "  description: ''\n" +
          '\n' +
          '  // locals(options) {\n' +
          '  //   // Return custom template variables here.\n' +
          '  //   return {\n' +
          '  //     foo: options.entity.options.foo\n' +
          '  //   };\n' +
          '  // }\n' +
          '\n' +
          '  // afterInstall(options) {\n' +
          '  //   // Perform extra work here.\n' +
          '  // }\n' +
          '};'
      );
    })
  );

  it(
    'blueprint foo/bar --pod',
    co.wrap(function*() {
      yield generate(['blueprint', 'foo/bar', '--pod']);

      expect(file('blueprints/foo/bar/index.js')).to.contain(
        'module.exports = {\n' +
          "  description: ''\n" +
          '\n' +
          '  // locals(options) {\n' +
          '  //   // Return custom template variables here.\n' +
          '  //   return {\n' +
          '  //     foo: options.entity.options.foo\n' +
          '  //   };\n' +
          '  // }\n' +
          '\n' +
          '  // afterInstall(options) {\n' +
          '  //   // Perform extra work here.\n' +
          '  // }\n' +
          '};'
      );
    })
  );

  it(
    'http-mock foo --pod',
    co.wrap(function*() {
      yield generate(['http-mock', 'foo', '--pod']);

      expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

      expect(file('server/mocks/foo.js')).to.contain(
        'module.exports = function(app) {\n' +
          "  const express = require('express');\n" +
          '  let fooRouter = express.Router();\n' +
          '\n' +
          "  fooRouter.get('/', function(req, res) {\n" +
          '    res.send({\n' +
          "      'foo': []\n" +
          '    });\n' +
          '  });\n' +
          '\n' +
          "  fooRouter.post('/', function(req, res) {\n" +
          '    res.status(201).end();\n' +
          '  });\n' +
          '\n' +
          "  fooRouter.get('/:id', function(req, res) {\n" +
          '    res.send({\n' +
          "      'foo': {\n" +
          '        id: req.params.id\n' +
          '      }\n' +
          '    });\n' +
          '  });\n' +
          '\n' +
          "  fooRouter.put('/:id', function(req, res) {\n" +
          '    res.send({\n' +
          "      'foo': {\n" +
          '        id: req.params.id\n' +
          '      }\n' +
          '    });\n' +
          '  });\n' +
          '\n' +
          "  fooRouter.delete('/:id', function(req, res) {\n" +
          '    res.status(204).end();\n' +
          '  });\n' +
          '\n' +
          '  // The POST and PUT call will not contain a request body\n' +
          '  // because the body-parser is not included by default.\n' +
          '  // To use req.body, run:\n' +
          '\n' +
          '  //    npm install --save-dev body-parser\n' +
          '\n' +
          '  // After installing, you need to `use` the body-parser for\n' +
          '  // this mock uncommenting the following line:\n' +
          '  //\n' +
          "  //app.use('/api/foo', require('body-parser').json());\n" +
          "  app.use('/api/foo', fooRouter);\n" +
          '};'
      );

      expect(file('server/.jshintrc')).to.contain('{\n  "node": true\n}');
    })
  );

  it(
    'http-mock foo-bar --pod',
    co.wrap(function*() {
      yield generate(['http-mock', 'foo-bar', '--pod']);

      expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

      expect(file('server/mocks/foo-bar.js')).to.contain(
        'module.exports = function(app) {\n' +
          "  const express = require('express');\n" +
          '  let fooBarRouter = express.Router();\n' +
          '\n' +
          "  fooBarRouter.get('/', function(req, res) {\n" +
          '    res.send({\n' +
          "      'foo-bar': []\n" +
          '    });\n' +
          '  });\n' +
          '\n' +
          "  fooBarRouter.post('/', function(req, res) {\n" +
          '    res.status(201).end();\n' +
          '  });\n' +
          '\n' +
          "  fooBarRouter.get('/:id', function(req, res) {\n" +
          '    res.send({\n' +
          "      'foo-bar': {\n" +
          '        id: req.params.id\n' +
          '      }\n' +
          '    });\n' +
          '  });\n' +
          '\n' +
          "  fooBarRouter.put('/:id', function(req, res) {\n" +
          '    res.send({\n' +
          "      'foo-bar': {\n" +
          '        id: req.params.id\n' +
          '      }\n' +
          '    });\n' +
          '  });\n' +
          '\n' +
          "  fooBarRouter.delete('/:id', function(req, res) {\n" +
          '    res.status(204).end();\n' +
          '  });\n' +
          '\n' +
          '  // The POST and PUT call will not contain a request body\n' +
          '  // because the body-parser is not included by default.\n' +
          '  // To use req.body, run:\n' +
          '\n' +
          '  //    npm install --save-dev body-parser\n' +
          '\n' +
          '  // After installing, you need to `use` the body-parser for\n' +
          '  // this mock uncommenting the following line:\n' +
          '  //\n' +
          "  //app.use('/api/foo-bar', require('body-parser').json());\n" +
          "  app.use('/api/foo-bar', fooBarRouter);\n" +
          '};'
      );

      expect(file('server/.jshintrc')).to.contain('{\n  "node": true\n}');
    })
  );

  it(
    'http-proxy foo --pod',
    co.wrap(function*() {
      yield generate(['http-proxy', 'foo', 'http://localhost:5000', '--pod']);

      expect(file('server/index.js')).to.contain('proxies.forEach(route => route(app));');

      expect(file('server/proxies/foo.js')).to.contain(
        "const proxyPath = '/foo';\n" +
          '\n' +
          'module.exports = function(app) {\n' +
          '  // For options, see:\n' +
          '  // https://github.com/nodejitsu/node-http-proxy\n' +
          "  let proxy = require('http-proxy').createProxyServer({});\n" +
          '\n' +
          "  proxy.on('error', function(err, req) {\n" +
          '    console.error(err, req.url);\n' +
          '  });\n' +
          '\n' +
          '  app.use(proxyPath, function(req, res, next){\n' +
          '    // include root path in proxied request\n' +
          "    req.url = proxyPath + '/' + req.url;\n" +
          "    proxy.web(req, res, { target: 'http://localhost:5000' });\n" +
          '  });\n' +
          '};'
      );

      expect(file('server/.jshintrc')).to.contain('{\n  "node": true\n}');
    })
  );

  it(
    'uses blueprints from the project directory',
    co.wrap(function*() {
      yield initApp();
      yield outputFile(
        'blueprints/foo/files/app/foos/__name__.js',
        "import Ember from 'ember';\n" + 'export default Ember.Object.extend({ foo: true });\n'
      );

      yield ember(['generate', 'foo', 'bar', '--pod']);

      expect(file('app/foos/bar.js')).to.contain('foo: true');
    })
  );

  it(
    'allows custom blueprints to override built-ins',
    co.wrap(function*() {
      yield initApp();
      yield outputFile(
        'blueprints/controller/files/app/__path__/__name__.js',
        "import Ember from 'ember';\n\n" + 'export default Ember.Controller.extend({ custom: true });\n'
      );

      yield ember(['generate', 'controller', 'foo', '--pod']);

      expect(file('app/foo/controller.js')).to.contain('custom: true');
    })
  );

  it(
    'passes custom cli arguments to blueprint options',
    co.wrap(function*() {
      yield initApp();
      yield outputFile(
        'blueprints/customblue/files/app/__name__.js',
        'Q: Can I has custom command? A: <%= hasCustomCommand %>'
      );

      yield outputFile(
        'blueprints/customblue/index.js',
        'module.exports = {\n' +
          '  fileMapTokens(options) {\n' +
          '    return {\n' +
          '      __name__(options) {\n' +
          '         return options.dasherizedModuleName;\n' +
          '      }\n' +
          '    };\n' +
          '  },\n' +
          '  locals(options) {\n' +
          '    var loc = {};\n' +
          "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';\n" +
          '    return loc;\n' +
          '  },\n' +
          '};\n'
      );

      yield ember(['generate', 'customblue', 'foo', '--custom-command', '--pod']);

      expect(file('app/foo.js')).to.contain('A: Yes!');
    })
  );

  it(
    'correctly identifies the root of the project',
    co.wrap(function*() {
      yield initApp();
      yield outputFile(
        'blueprints/controller/files/app/__path__/__name__.js',
        "import Ember from 'ember';\n\n" + 'export default Ember.Controller.extend({ custom: true });\n'
      );

      process.chdir(path.join(tmpdir, 'app'));
      yield ember(['generate', 'controller', 'foo', '--pod']);

      process.chdir(tmpdir);
      expect(file('app/foo/controller.js')).to.contain('custom: true');
    })
  );

  // Skip until podModulePrefix is deprecated
  it.skip(
    'podModulePrefix deprecation warning',
    co.wrap(function*() {
      let result = yield generateWithPrefix(['controller', 'foo', '--pod']);

      expect(result.outputStream.join()).to.include(
        '`podModulePrefix` is deprecated and will be' +
          ' removed from future versions of ember-cli. Please move existing pods from' +
          " 'app/pods/' to 'app/'."
      );
    })
  );
});
