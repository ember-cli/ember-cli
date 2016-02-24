/*jshint quotmark: false*/

'use strict';

var Promise              = require('../../lib/ext/promise');
var assertFile           = require('ember-cli-internal-test-helpers/lib/helpers/assert-file');
var assertFileEquals     = require('ember-cli-internal-test-helpers/lib/helpers/assert-file-equals');
var assertFileToNotExist = require('ember-cli-internal-test-helpers/lib/helpers/assert-file-to-not-exist');
var conf                 = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember                = require('../helpers/ember');
var fs                   = require('fs-extra');
var path                 = require('path');
var remove               = Promise.denodeify(fs.remove);
var root                 = process.cwd();
var tmproot              = path.join(root, 'tmp');
var Blueprint            = require('../../lib/models/blueprint');
var BlueprintNpmTask     = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
var expect               = require('chai').expect;
var mkTmpDirIn           = require('../../lib/utilities/mk-tmp-dir-in');

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

  it('dummy controller foo', function() {
    return generateInAddon(['controller', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/controllers/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({\n});"
        ]
      });
      assertFileToNotExist('app/controllers/foo-test.js');
      assertFileToNotExist('tests/unit/controllers/foo-test.js');
    });
  });

  it('dummy controller foo/bar', function() {
    return generateInAddon(['controller', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/controllers/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({\n});"
        ]
      });
      assertFileToNotExist('app/controllers/foo/bar.js');
      assertFileToNotExist('tests/unit/controllers/foo/bar-test.js');
    });
  });

  it('dummy component x-foo', function() {
    return generateInAddon(['component', 'x-foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('tests/dummy/app/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFileToNotExist('app/components/x-foo.js');
      assertFileToNotExist('tests/unit/components/x-foo-test.js');
    });
  });

  it('dummy component-test x-foo', function() {
    return generateInAddon(['component-test', 'x-foo', '--dummy']).then(function() {
      assertFile('tests/integration/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('x-foo'"
        ]
      });
      assertFileToNotExist('app/component-test/x-foo.js');
    });
  });

  it('dummy component nested/x-foo', function() {
    return generateInAddon(['component', 'nested/x-foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/components/nested/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('tests/dummy/app/templates/components/nested/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFileToNotExist('app/components/nested/x-foo.js');
      assertFileToNotExist('tests/unit/components/nested/x-foo-test.js');
    });
  });

  it('dummy helper foo-bar', function() {
    return generateInAddon(['helper', 'foo-bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/helpers/foo-bar.js', {
        contains: "import Ember from 'ember';\n\n" +
                  "export function fooBar(params/*, hash*/) {\n" +
                  "  return params;\n" +
                  "}\n\n" +
                  "export default Ember.Helper.helper(fooBar);"
      });
      assertFileToNotExist('app/helpers/foo-bar.js');
      assertFileToNotExist('tests/unit/helpers/foo-bar-test.js');
    });
  });

  it('dummy helper foo/bar-baz', function() {
    return generateInAddon(['helper', 'foo/bar-baz', '--dummy']).then(function() {
      assertFile('tests/dummy/app/helpers/foo/bar-baz.js', {
        contains: "import Ember from 'ember';\n\n" +
                  "export function fooBarBaz(params/*, hash*/) {\n" +
                  "  return params;\n" +
                  "}\n\n" +
                  "export default Ember.Helper.helper(fooBarBaz);"
      });
      assertFileToNotExist('app/helpers/foo/bar-baz.js');
      assertFileToNotExist('tests/unit/helpers/foo/bar-baz-test.js');
    });
  });

  it('dummy model foo', function() {
    return generateInAddon(['model', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/models/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.Model.extend"
        ]
      });
      assertFileToNotExist('app/models/foo.js');
      assertFileToNotExist('tests/unit/models/foo-test.js');
    });
  });

  it('dummy model foo with attributes', function() {
    return generateInAddon([
      'model',
      'foo',
      'noType',
      'firstName:string',
      'created_at:date',
      'is-published:boolean',
      'rating:number',
      'bars:has-many',
      'baz:belongs-to',
      'echo:hasMany',
      'bravo:belongs_to',
      'foo-names:has-many',
      'barName:has-many',
      'bazName:belongs-to',
      'test-name:belongs-to',
      'echoName:hasMany',
      'bravoName:belongs_to',
      '--dummy'
    ]).then(function() {
      assertFile('tests/dummy/app/models/foo.js', {
        contains: [
          "noType: DS.attr()",
          "firstName: DS.attr('string')",
          "createdAt: DS.attr('date')",
          "isPublished: DS.attr('boolean')",
          "rating: DS.attr('number')",
          "bars: DS.hasMany('bar')",
          "baz: DS.belongsTo('baz')",
          "echos: DS.hasMany('echo')",
          "bravo: DS.belongsTo('bravo')",
          "fooNames: DS.hasMany('foo-name')",
          "barNames: DS.hasMany('bar-name')",
          "bazName: DS.belongsTo('baz-name')",
          "testName: DS.belongsTo('test-name')",
          "echoNames: DS.hasMany('echo-name')",
          "bravoName: DS.belongsTo('bravo-name')"
        ]
      });
      assertFileToNotExist('app/models/foo.js');
      assertFileToNotExist('tests/unit/models/foo-test.js');
    });
  });

  it('dummy model foo/bar', function() {
    return generateInAddon(['model', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/models/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.Model.extend"
        ]
      });
      assertFileToNotExist('app/models/foo/bar.js');
      assertFileToNotExist('tests/unit/models/foo/bar-test.js');
    });
  });

  it('dummy model-test foo', function() {
    return generateInAddon(['model-test', 'foo', '--dummy']).then(function() {
      assertFile('tests/unit/models/foo-test.js', {
        contains: [
          "import { moduleForModel, test } from 'ember-qunit';",
          "moduleForModel('foo'"
        ]
      });
      assertFileToNotExist('app/model-test/foo.js');
    });
  });

  it('dummy route foo', function() {
    return generateInAddon(['route', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/routes/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({\n});"
        ]
      });
      assertFileToNotExist('app/routes/foo.js');
      assertFile('tests/dummy/app/templates/foo.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/dummy/app/router.js', {
        contains: "this.route('foo');"
      });
      assertFileToNotExist('app/templates/foo.js');
      assertFileToNotExist('tests/unit/routes/foo-test.js');
    });
  });

  it('dummy route foo/bar', function() {
    return generateInAddon(['route', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/routes/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({\n});"
        ]
      });
      assertFileToNotExist('app/routes/foo/bar.js');
      assertFile('tests/dummy/app/templates/foo/bar.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/dummy/app/router.js', {
        contains: [
          "this.route('foo', function() {",
          "this.route('bar');",
        ]
      });
      assertFileToNotExist('tests/unit/routes/foo/bar-test.js');
    });
  });

  it('dummy route-test foo', function() {
    return generateInAddon(['route-test', 'foo']).then(function() {
      assertFile('tests/unit/routes/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('route:foo'"
        ]
      });
      assertFileToNotExist('app/route-test/foo.js');
    });
  });

  it('dummy template foo', function() {
    return generateInAddon(['template', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/templates/foo.hbs');
    });
  });

  it('dummy template foo/bar', function() {
    return generateInAddon(['template', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/templates/foo/bar.hbs');
    });
  });

  it('dummy view foo', function() {
    return generateInAddon(['view', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/views/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.View.extend({\n})"
        ]
      });
      assertFileToNotExist('app/views/foo.js');
      assertFileToNotExist('tests/unit/views/foo-test.js');
    });
  });

  it('dummy view foo/bar', function() {
    return generateInAddon(['view', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/views/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.View.extend({\n})"
        ]
      });
      assertFileToNotExist('app/views/foo/bar.js');
      assertFileToNotExist('tests/unit/views/foo/bar-test.js');
    });
  });

  it('dummy resource foos', function() {
    return generateInAddon(['resource', 'foos', '--dummy']).catch(function(error) {
      expect(error.message).to.include('blueprint does not support ' +
        'generating inside addons.');
    });
  });

  it('dummy initializer foo', function() {
    return generateInAddon(['initializer', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/initializers/foo.js', {
        contains: "export function initialize(/* application */) {\n" +
                  "  // application.inject('route', 'foo', 'service:foo');\n" +
                  "}\n" +
                  "\n"+
                  "export default {\n" +
                  "  name: 'foo',\n" +
                  "  initialize\n" +
                  "};"
      });
      assertFileToNotExist('app/initializers/foo.js');
      assertFileToNotExist('tests/unit/initializers/foo-test.js');
    });
  });

  it('dummy initializer foo/bar', function() {
    return generateInAddon(['initializer', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/initializers/foo/bar.js', {
        contains: "export function initialize(/* application */) {\n" +
                  "  // application.inject('route', 'foo', 'service:foo');\n" +
                  "}\n" +
                  "\n"+
                  "export default {\n" +
                  "  name: 'foo/bar',\n" +
                  "  initialize\n" +
                  "};"
      });
      assertFileToNotExist('app/initializers/foo/bar.js');
      assertFileToNotExist('tests/unit/initializers/foo/bar-test.js');
    });
  });

  it('dummy mixin foo', function() {
    return generateInAddon(['mixin', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/mixins/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({\n});'
        ]
      });
      assertFileToNotExist('tests/unit/mixins/foo-test.js');
      assertFileToNotExist('app/mixins/foo.js');
    });
  });

  it('dummy mixin foo/bar', function() {
    return generateInAddon(['mixin', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/mixins/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({\n});'
        ]
      });
      assertFileToNotExist('tests/unit/mixins/foo/bar-test.js');
      assertFileToNotExist('app/mixins/foo/bar.js');
    });
  });

  it('dummy mixin foo/bar/baz', function() {
    return generateInAddon(['mixin', 'foo/bar/baz', '--dummy']).then(function() {
      assertFile('tests/dummy/app/mixins/foo/bar/baz.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({\n});'
        ]
      });
      assertFileToNotExist('tests/unit/mixins/foo/bar/baz-test.js');
      assertFileToNotExist('app/mixins/foo/bar/baz.js');
    });
  });

  it('dummy adapter application', function() {
    return generateInAddon(['adapter', 'application', '--dummy']).then(function() {
      assertFile('tests/dummy/app/adapters/application.js', {
        contains: [
          "import DS from \'ember-data\';",
          "export default DS.RESTAdapter.extend({\n});"
        ]
      });
      assertFileToNotExist('app/adapters/application.js');
      assertFileToNotExist('tests/unit/adapters/application-test.js');
    });
  });

  it('dummy adapter foo', function() {
    return generateInAddon(['adapter', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/adapters/foo.js', {
        contains: [
          "import DS from \'ember-data\';",
          "export default DS.RESTAdapter.extend({\n});"
        ]
      });
      assertFileToNotExist('app/adapters/foo.js');
      assertFileToNotExist('tests/unit/adapters/foo-test.js');
    });
  });

  it('dummy adapter foo/bar (with base class foo)', function() {
    return generateInAddon(['adapter', 'foo/bar', '--base-class=foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/adapters/foo/bar.js', {
        contains: [
          "import FooAdapter from \'../foo\';",
          "export default FooAdapter.extend({\n});"
        ]
      });
      assertFileToNotExist('app/adapters/foo/bar.js');
      assertFileToNotExist('tests/unit/adapters/foo/bar-test.js');
    });
  });

  it('dummy adapter-test foo', function() {
    return generateInAddon(['adapter-test', 'foo', '--dummy']).then(function() {
      assertFile('tests/unit/adapters/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('adapter:foo'"
        ]
      });
      assertFileToNotExist('app/adapter-test/foo.js');
    });
  });

  it('dummy serializer foo', function() {
    return generateInAddon(['serializer', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/serializers/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({\n});'
        ]
      });
      assertFileToNotExist('app/serializers/foo.js');
      assertFileToNotExist('tests/unit/serializers/foo-test.js');
    });
  });

  it('dummy serializer foo/bar', function() {
    return generateInAddon(['serializer', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/serializers/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({\n});'
        ]
      });
      assertFileToNotExist('app/serializers/foo/bar.js');
      assertFileToNotExist('tests/unit/serializers/foo/bar-test.js');
    });
  });

  it('dummy serializer-test foo', function() {
    return generateInAddon(['serializer-test', 'foo', '--dummy']).then(function() {
      assertFile('tests/unit/serializers/foo-test.js', {
        contains: [
          "import { moduleForModel, test } from 'ember-qunit';",
          "moduleForModel('foo'"
        ]
      });
      assertFileToNotExist('app/serializer-test/foo.js');
    });
  });

  it('dummy transform foo', function() {
    return generateInAddon(['transform', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/transforms/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.Transform.extend({\n' +
          '  deserialize(serialized) {\n' +
          '    return serialized;\n' +
          '  },\n' +
          '\n' +
          '  serialize(deserialized) {\n' +
          '    return deserialized;\n' +
          '  }\n' +
          '});'
        ]
      });
      assertFileToNotExist('app/transforms/foo.js');
      assertFileToNotExist('tests/unit/transforms/foo-test.js');
    });
  });

  it('dummy transform foo/bar', function() {
    return generateInAddon(['transform', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/transforms/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.Transform.extend({\n' +
          '  deserialize(serialized) {\n' +
          '    return serialized;\n' +
          '  },\n' +
          '\n' +
          '  serialize(deserialized) {\n' +
          '    return deserialized;\n' +
          '  }\n' +
          '});'
        ]
      });
      assertFileToNotExist('app/transforms/foo/bar.js');
      assertFileToNotExist('tests/unit/transforms/foo/bar-test.js');
    });
  });

  it('dummy util foo-bar', function() {
    return generateInAddon(['util', 'foo-bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/utils/foo-bar.js', {
        contains: 'export default function fooBar() {\n' +
                  '  return true;\n' +
                  '}'
      });
      assertFileToNotExist('app/utils/foo-bar.js');
      assertFileToNotExist('tests/unit/utils/foo-bar-test.js');
    });
  });

  it('dummy util foo-bar/baz', function() {
    return generateInAddon(['util', 'foo/bar-baz', '--dummy']).then(function() {
      assertFile('tests/dummy/app/utils/foo/bar-baz.js', {
        contains: 'export default function fooBarBaz() {\n' +
                  '  return true;\n' +
                  '}'
      });
      assertFileToNotExist('app/utils/foo/bar-baz.js');
      assertFileToNotExist('tests/unit/utils/foo/bar-baz-test.js');
    });
  });

  it('dummy service foo', function() {
    return generateInAddon(['service', 'foo', '--dummy']).then(function() {
      assertFile('tests/dummy/app/services/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Service.extend({\n});'
        ]
      });
      assertFileToNotExist('app/services/foo.js');
      assertFileToNotExist('tests/unit/services/foo-test.js');
    });
  });

  it('dummy service foo/bar', function() {
    return generateInAddon(['service', 'foo/bar', '--dummy']).then(function() {
      assertFile('tests/dummy/app/services/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Service.extend({\n});'
        ]
      });
      assertFileToNotExist('app/services/foo/bar.js');
      assertFileToNotExist('tests/unit/services/foo/bar-test.js');
    });
  });


  it('dummy service-test foo', function() {
    return generateInAddon(['service-test', 'foo', '--dummy']).then(function() {
      assertFile('tests/unit/services/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('service:foo'"
        ]
      });
      assertFileToNotExist('app/service-test/foo.js');
    });
  });

  it('dummy blueprint foo', function() {
    return generateInAddon(['blueprint', 'foo', '--dummy']).then(function() {
      assertFile('blueprints/foo/index.js', {
        contains: "module.exports = {\n" +
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
                  "};"
      });
    });
  });

  it('dummy blueprint foo/bar', function() {
    return generateInAddon(['blueprint', 'foo/bar', '--dummy']).then(function() {
      assertFile('blueprints/foo/bar/index.js', {
        contains: "module.exports = {\n" +
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
                  "};"
      });
    });
  });

  it('dummy http-mock foo', function() {
    return generateInAddon(['http-mock', 'foo', '--dummy']).then(function() {
      assertFile('server/index.js', {
        contains:"mocks.forEach(function(route) { route(app); });"
      });
      assertFile('server/mocks/foo.js', {
        contains: "module.exports = function(app) {\n" +
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
                  "};\n"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('dummy http-mock foo-bar', function() {
    return generateInAddon(['http-mock', 'foo-bar', '--dummy']).then(function() {
      assertFile('server/index.js', {
        contains: "mocks.forEach(function(route) { route(app); });"
      });
      assertFile('server/mocks/foo-bar.js', {
        contains: "module.exports = function(app) {\n" +
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
                  "};\n"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('dummy http-proxy foo', function() {
    return generateInAddon(['http-proxy', 'foo', 'http://localhost:5000', '--dummy']).then(function() {
      assertFile('server/index.js', {
        contains: "proxies.forEach(function(route) { route(app); });"
      });
      assertFile('server/proxies/foo.js', {
        contains: "var proxyPath = '/foo';\n" +
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
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('dummy server', function() {
    return generateInAddon(['server', '--dummy']).then(function() {
      assertFile('server/index.js');
      assertFile('server/.jshintrc');
    });
  });

  it('dummy acceptance-test foo', function() {
    return generateInAddon(['acceptance-test', 'foo', '--dummy']).then(function() {
      var expected = path.join(__dirname, '../fixtures/generate/addon-acceptance-test-expected.js');

      assertFileEquals('tests/acceptance/foo-test.js', expected);
      assertFileToNotExist('app/acceptance-tests/foo.js');
    });
  });

  it('dummy acceptance-test foo/bar', function() {
    return generateInAddon(['acceptance-test', 'foo/bar', '--dummy']).then(function() {
      var expected = path.join(__dirname, '../fixtures/generate/addon-acceptance-test-nested-expected.js');

      assertFileEquals('tests/acceptance/foo/bar-test.js', expected);
      assertFileToNotExist('app/acceptance-tests/foo/bar.js');
    });
  });

});
