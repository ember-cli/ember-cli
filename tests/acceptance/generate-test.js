/*jshint quotmark: false*/

'use strict';

var Promise          = require('../../lib/ext/promise');
var assertFile       = require('../helpers/assert-file');
var assertFileEquals = require('../helpers/assert-file-equals');
var conf             = require('../helpers/conf');
var ember            = require('../helpers/ember');
var fs               = require('fs-extra');
var outputFile       = Promise.denodeify(fs.outputFile);
var path             = require('path');
var rimraf           = require('rimraf');
var root             = process.cwd();
var tmp              = require('tmp-sync');
var tmproot          = path.join(root, 'tmp');

describe('Acceptance: ember generate', function() {
  var tmpdir;

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
    process.chdir(root);
    rimraf.sync(tmproot);
  });

  function initApp() {
    return ember(['init', 'my-app', '--dry-run']);
  }

  function generate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  it('controller foo', function() {
    return generate(['controller', 'foo']).then(function() {
      assertFile('app/controllers/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({\n});"
        ]
      });
      assertFile('tests/unit/controllers/foo-test.js', {
        contains: [
          "import { test, moduleFor } from 'ember-qunit';",
          "moduleFor('controller:foo', 'FooController'"
        ]
      });
    });
  });

  it('controller foo type:object', function() {
    return generate(['controller', 'foo', 'type:object']).then(function() {
      assertFile('app/controllers/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.ObjectController.extend({\n});"
        ]
      });
    });
  });

  it('controller foo type:array', function() {
    return generate(['controller', 'foo', 'type:array']).then(function() {
      assertFile('app/controllers/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.ArrayController.extend({\n});"
        ]
      });
    });
  });

  it('component x-foo', function() {
    return generate(['component', 'x-foo']).then(function() {
      assertFile('app/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({\n});"
        ]
      });
      assertFile('app/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/unit/components/x-foo-test.js', {
        contains: [
          "import { test, moduleForComponent } from 'ember-qunit';",
          "moduleForComponent('x-foo', 'XFooComponent'"
        ]
      });
    });
  });

  it('helper foo-bar', function() {
    return generate(['helper', 'foo-bar']).then(function() {
      assertFile('app/helpers/foo-bar.js', {
        contains: "import Ember from 'ember';\n\n" +
                  "export default Ember.Handlebars.makeBoundHelper(function(value) {\n" +
                  "  return value;\n" +
                  "});"
      });
    });
  });

  it('model foo', function() {
    return generate(['model', 'foo']).then(function() {
      assertFile('app/models/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.Model.extend"
        ]
      });
      assertFile('tests/unit/models/foo-test.js', {
        contains: [
          "import { test, moduleForModel } from 'ember-qunit';",
          "moduleForModel('foo', 'Foo'"
        ]
      });
    });
  });

  it('model foo with attributes', function() {
    return generate([
      'model',
      'foo',
      'firstName:string',
      'created_at:date',
      'is-published:boolean',
      'rating:number',
      'bars:has-many',
      'baz:belongs-to',
      'echo:hasMany',
      'bravo:belongs_to'
    ]).then(function() {
      assertFile('app/models/foo.js', {
        contains: [
          "firstName: DS.attr('string')",
          "createdAt: DS.attr('date')",
          "isPublished: DS.attr('boolean')",
          "rating: DS.attr('number')",
          "bars: DS.hasMany('bar')",
          "baz: DS.belongsTo('baz')",
          "echos: DS.hasMany('echo')",
          "bravo: DS.belongsTo('bravo')"
        ]
      });
      assertFile('tests/unit/models/foo-test.js', {
        contains: "needs: ['model:bar', 'model:baz', 'model:echo', 'model:bravo']"
      });
    });
  });

  it('route foo', function() {
    return generate(['route', 'foo']).then(function() {
      assertFile('app/router.js', {
        contains: "this.route('foo')"
      });
      assertFile('app/routes/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({\n});"
        ]
      });
      assertFile('app/templates/foo.hbs');
      assertFile('tests/unit/routes/foo-test.js', {
        contains: [
          "import { test, moduleFor } from 'ember-qunit';",
          "moduleFor('route:foo', 'FooRoute'"
        ]
      });
    });
  });

  it('route foo type:resource', function() {
    return generate(['route', 'foo', 'type:resource']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foo', { path: 'foos/:foo_id' });"
      });
    });
  });

  it('route foos type:resource', function() {
    return generate(['route', 'foos', 'type:resource']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foos');"
      });
    });
  });

  it('route index', function() {
    return generate(['route', 'index']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "this.route('index');"
      });
    });
  });

  it('route bar does not create duplicates in router.js', function() {
    var routerDefinition = (
      "Router.map(function() {\n" +
      "  this.resource('foo', function() {\n" +
      "    this.route('bar');\n" +
      "  });\n" +
      "});\n"
    );

    return initApp()
      .then(function() {
        return outputFile('app/router.js', routerDefinition);
      })
      .then(function() {
        return ember(['generate', 'route', 'bar']);
      })
      .then(function() {
        assertFile('app/router.js', {
          contains: routerDefinition
        });
      });
  });

  it('template foo', function() {
    return generate(['template', 'foo']).then(function() {
      assertFile('app/templates/foo.hbs');
    });
  });

  it('template foo/bar', function() {
    return generate(['template', 'foo/bar']).then(function() {
      assertFile('app/templates/foo/bar.hbs');
    });
  });

  it('view foo', function() {
    return generate(['view', 'foo']).then(function() {
      assertFile('app/views/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.View.extend({\n})'
        ]
      });
      assertFile('tests/unit/views/foo-test.js', {
        contains: [
          "import { test, moduleFor } from 'ember-qunit';",
          "moduleFor('view:foo', 'FooView'"
        ]
      });
    });
  });

  it('resource foo', function() {
    return generate(['resource', 'foo']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foo', { path: 'foos/:foo_id' });"
      });
      assertFile('app/models/foo.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/routes/foo.js', {
        contains: 'export default Ember.Route.extend({\n});'
      });
      assertFile('app/templates/foo.hbs');
      assertFile('tests/unit/models/foo-test.js', {
        contains: "moduleForModel('foo', 'Foo'"
      });
      assertFile('tests/unit/routes/foo-test.js', {
        contains: "moduleFor('route:foo', 'FooRoute'"
      });
    });
  });

  it('resource foos', function() {
    return generate(['resource', 'foos']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foos');"
      });
      assertFile('app/models/foo.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/routes/foos.js', {
        contains: 'export default Ember.Route.extend({\n});'
      });
      assertFile('app/templates/foos.hbs');
      assertFile('tests/unit/models/foo-test.js', {
        contains: "moduleForModel('foo', 'Foo'"
      });
      assertFile('tests/unit/routes/foos-test.js', {
        contains: "moduleFor('route:foos', 'FoosRoute'"
      });
    });
  });

  it('initializer foo', function() {
    return generate(['initializer', 'foo']).then(function() {
      assertFile('app/initializers/foo.js', {
        contains: "export default {\n" +
                  "  name: 'foo',\n\n" +
                  "  initialize: function(/* container, app */) {\n" +
                  "    // app.register('route', 'foo', 'service:foo');\n" +
                  "  }\n" +
                  "};"
      });
    });
  });

  it('mixin foo', function() {
    return generate(['mixin', 'foo']).then(function() {
      assertFile('app/mixins/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({\n});'
        ]
      });
      assertFile('tests/unit/mixins/foo-test.js', {
        contains: [
          "import FooMixin from 'my-app/mixins/foo';"
        ]
      });
    });
  });

  it('adapter foo', function() {
    return generate(['adapter', 'foo']).then(function() {
      assertFile('app/adapters/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.RESTAdapter.extend({\n});"
        ]
      });
    });
  });

  it('serializer foo', function() {
    return generate(['serializer', 'foo']).then(function() {
      assertFile('app/serializers/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({\n});'
        ]
      });
      assertFile('tests/unit/serializers/foo-test.js', {
        contains: [
          "import { test, moduleFor } from 'ember-qunit';",
          "moduleFor('serializer:foo', 'FooSerializer'"
        ]
      });
    });
  });

  it('transform foo', function() {
    return generate(['transform', 'foo']).then(function() {
      assertFile('app/transforms/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.Transform.extend({\n' +
          '  deserialize: function(serialized) {\n' +
          '    return serialized;\n' +
          '  },\n' +
          '\n' +
          '  serialize: function(deserialized) {\n' +
          '    return deserialized;\n' +
          '  }\n' +
          '});'
        ]
      });
      assertFile('tests/unit/transforms/foo-test.js', {
        contains: [
          "import { test, moduleFor } from 'ember-qunit';",
          "moduleFor('transform:foo', 'FooTransform'"
        ]
      });
    });
  });

  it('util foo-bar', function() {
    return generate(['util', 'foo-bar']).then(function() {
      assertFile('app/utils/foo-bar.js', {
        contains: 'export default function fooBar() {\n' +
                  '  return true;\n' +
                  '}'
      });
      assertFile('tests/unit/utils/foo-bar-test.js', {
        contains: [
          "import fooBar from 'my-app/utils/foo-bar';"
        ]
      });
    });
  });

  it('service foo', function() {
    return generate(['service', 'foo']).then(function() {
      assertFile('app/services/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Object.extend({\n});'
        ]
      });
      assertFile('app/initializers/foo.js', {
        contains: "export default {\n" +
                  "  name: 'foo',\n" +
                  "  initialize: function(container, app) {\n" +
                  "    app.inject('route', 'foo', 'service:foo');\n" +
                  "  }\n" +
                  "};"
      });
      assertFile('tests/unit/services/foo-test.js', {
        contains: [
          "import { test, moduleFor } from 'ember-qunit';",
          "moduleFor('service:foo', 'FooService'"
        ]
      });
    });
  });

  it('blueprint foo', function() {
    return generate(['blueprint', 'foo']).then(function() {
      assertFile('blueprints/foo/index.js', {
        contains: "var Blueprint = require('ember-cli/lib/models/blueprint');\n\n" +
                  "module.exports = Blueprint.extend({\n" +
                  "});"
      });
      assertFile('blueprints/foo/files/.gitkeep');
    });
  });

  it('api-stub foo/bar', function() {
    return generate(['api-stub', '/foo/bar']).then(function() {
      assertFile('server/index.js', {
        contains: "var bodyParser = require('body-parser');\n" +
                  "var globSync   = require('glob').sync;\n" +
                  "var routes     = globSync('./routes/**/*.js', { cwd: __dirname }).map(require);\n" +
                  "\n" +
                  "module.exports = function(app) {\n" +
                  "  app.use(bodyParser());\n" +
                  "\n" +
                  "  routes.forEach(function(route) { route(app); });\n" +
                  "};"
      });
      assertFile('server/routes/foo/bar.js', {
        contains: "module.exports = function(app) {\n" +
                  "  app.get('/foo/bar', function(req, res) {\n" +
                  "    res.send('hello');\n" +
                  "  });\n" +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('uses blueprints from the project directory', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';\n\n" +
          'export default Ember.Object.extend({ foo: true });\n'
        );
      })
      .then(function() {
        return ember(['generate', 'foo', 'bar']);
      })
      .then(function() {
        assertFile('app/foos/bar.js', {
          contains: 'foo: true'
        });
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
        assertFile('app/controllers/foo.js', {
          contains: 'custom: true'
        });
      });
  });

  it('acceptance-test foo', function() {
    return generate(['acceptance-test', 'foo']).then(function() {
      var expected = path.join(__dirname, '../fixtures/generate/acceptance-test-expected.js');

      assertFileEquals('tests/acceptance/foo-test.js', expected);
    });
  });
});
