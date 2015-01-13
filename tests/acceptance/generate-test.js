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
var rimraf           = Promise.denodeify(require('rimraf'));
var root             = process.cwd();
var tmp              = require('tmp-sync');
var tmproot          = path.join(root, 'tmp');
var EOL              = require('os').EOL;
var BlueprintNpmTask = require('../helpers/disable-npm-on-blueprint');
var expect           = require('chai').expect;

describe('Acceptance: ember generate', function() {
  var tmpdir;

  before(function() {
    BlueprintNpmTask.disableNPM();
    conf.setup();
  });

  after(function() {
    BlueprintNpmTask.restoreNPM();
    conf.restore();
  });

  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    this.timeout(10000);

    process.chdir(root);
    return rimraf(tmproot);
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

  it('controller foo', function() {
    return generate(['controller', 'foo']).then(function() {
      assertFile('app/controllers/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({" + EOL + "});"
        ]
      });
      assertFile('tests/unit/controllers/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('controller:foo', 'FooController'"
        ]
      });
    });
  });

  it('controller foo/bar', function() {
    return generate(['controller', 'foo/bar']).then(function() {
      assertFile('app/controllers/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({" + EOL + "});"
        ]
      });
      assertFile('tests/unit/controllers/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('controller:foo/bar', 'FooBarController'"
        ]
      });
    });
  });

  it('component x-foo', function() {
    return generate(['component', 'x-foo']).then(function() {
      assertFile('app/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({" + EOL + "});"
        ]
      });
      assertFile('app/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/unit/components/x-foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForComponent," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForComponent('x-foo', 'XFooComponent'"
        ]
      });
    });
  });

  it('helper foo-bar', function() {
    return generate(['helper', 'foo-bar']).then(function() {
      assertFile('app/helpers/foo-bar.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "export function fooBar(input) {" + EOL +
                  "  return input;" + EOL +
                  "}" +  EOL + EOL +
                  "export default Ember.Handlebars.makeBoundHelper(fooBar);"
      });
      assertFile('tests/unit/helpers/foo-bar-test.js', {
        contains: "import {" + EOL +
          "  fooBar" + EOL +
          "} from 'my-app/helpers/foo-bar';"
      });
    });
  });

  it('helper foo/bar-baz', function() {
    return generate(['helper', 'foo/bar-baz']).then(function() {
      assertFile('app/helpers/foo/bar-baz.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "export function fooBarBaz(input) {" + EOL +
                  "  return input;" + EOL +
                  "}" + EOL + EOL +
                  "export default Ember.Handlebars.makeBoundHelper(fooBarBaz);"
      });
      assertFile('tests/unit/helpers/foo/bar-baz-test.js', {
        contains: "import {" + EOL +
          "  fooBarBaz" + EOL +
          "} from 'my-app/helpers/foo/bar-baz';"
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
          "import {" + EOL +
          "  moduleForModel," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForModel('foo', 'Foo'"
        ]
      });
    });
  });

  it('model foo with attributes', function() {
    return generate([
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
      'bravoName:belongs_to'
    ]).then(function() {
      assertFile('app/models/foo.js', {
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
      assertFile('tests/unit/models/foo-test.js', {
        contains: [
          "needs: [",
          "'model:bar',",
          "'model:baz',",
          "'model:echo',",
          "'model:bravo',",
          "'model:foo-name',",
          "'model:bar-name',",
          "'model:baz-name',",
          "'model:echo-name',",
          "'model:test-name',",
          "'model:bravo-name'",
          "]"
        ]
      });
    });
  });

  it('model foo/bar', function() {
    return generate(['model', 'foo/bar']).then(function() {
      assertFile('app/models/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.Model.extend"
        ]
      });
      assertFile('tests/unit/models/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForModel," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForModel('foo/bar', 'FooBar'"
        ]
      });
    });
  });

  it('model-test foo', function() {
    return generate(['model-test', 'foo']).then(function() {
      assertFile('tests/unit/models/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForModel," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForModel('foo', 'Foo'"
        ],
        doesNotContain: 'needs'
      });
    });
  });

  it('route foo', function() {
    return generate(['route', 'foo']).then(function() {
      assertFile('app/router.js', {
        contains: "this.route(\"foo\")"
      });
      assertFile('app/routes/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({" + EOL + "});"
        ]
      });
      assertFile('app/templates/foo.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/unit/routes/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('route:foo', 'FooRoute'"
        ]
      });
    });
  });

  it('route foo with --path', function() {
    return generate(['route', 'foo', '--path=:foo_id/show']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.route("foo", {',
          'path: ":foo_id/show"',
          '});'
        ]
      });
    });
  });

  it('route foos --type=resource', function() {
    return generate(['route', 'foos', '--type=resource']).then(function() {
      assertFile('app/router.js', {
        contains: 'this.resource("foos", function() {});'
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

  it('route application', function() {
    // need to run `initApp` manually here instead of using `generate` helper
    // because we need to remove the templates/application.hbs file to prevent
    // a prompt (due to a conflict)
    return initApp().then(function() {
      return rimraf(path.join('app', 'templates', 'application.hbs'));
    })
    .then(function() {
      return ember(['generate', 'route', 'application']);
    })
    .then(function() {
      assertFile('app/router.js', {
        doesNotContain: "this.route('application');"
      });
    });
  });

  it('route basic isn\'t added to router', function() {
    return generate(['route', 'basic']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "this.route('basic');"
      });
      assertFile('app/routes/basic.js');
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
          "export default Ember.View.extend({" + EOL + "})"
        ]
      });
      assertFile('tests/unit/views/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('view:foo', 'FooView'"
        ]
      });
    });
  });

  it('view foo/bar', function() {
    return generate(['view', 'foo/bar']).then(function() {
      assertFile('app/views/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.View.extend({" + EOL + "})"
        ]
      });
      assertFile('tests/unit/views/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('view:foo/bar', 'FooBarView'"
        ]
      });
    });
  });

  it('resource foos', function() {
    return generate(['resource', 'foos']).then(function() {
      assertFile('app/router.js', {
        contains: 'this.resource("foos", function() {});'
      });
      assertFile('app/models/foo.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/routes/foos.js', {
        contains: 'export default Ember.Route.extend({' + EOL + '});'
      });
      assertFile('app/templates/foos.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/unit/models/foo-test.js', {
        contains: "moduleForModel('foo', 'Foo'"
      });
      assertFile('tests/unit/routes/foos-test.js', {
        contains: "moduleFor('route:foos', 'FoosRoute'"
      });
    });
  });

  it('resource foos with --path', function() {
    return generate(['resource', 'foos', '--path=app/foos']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.resource("foos", {',
          'path: "app/foos"',
          '}, function() {});'
        ]
      });
    });
  });

  it('initializer foo', function() {
    return generate(['initializer', 'foo']).then(function() {
      assertFile('app/initializers/foo.js', {
        contains: "export function initialize(/* container, application */) {" + EOL +
                  "  // application.inject('route', 'foo', 'service:foo');" + EOL +
                  "}" + EOL +
                  "" + EOL+
                  "export default {" + EOL +
                  "  name: 'foo'," + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });

      assertFile('tests/unit/initializers/foo-test.js');
    });
  });

  it('initializer foo/bar', function() {
    return generate(['initializer', 'foo/bar']).then(function() {
      assertFile('app/initializers/foo/bar.js', {
        contains: "export function initialize(/* container, application */) {" + EOL +
                  "  // application.inject('route', 'foo', 'service:foo');" + EOL +
                  "}" + EOL +
                  "" + EOL+
                  "export default {" + EOL +
                  "  name: 'foo/bar'," + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });

      assertFile('tests/unit/initializers/foo/bar-test.js');
    });
  });

  it('mixin foo', function() {
    return generate(['mixin', 'foo']).then(function() {
      assertFile('app/mixins/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({' + EOL + '});'
        ]
      });
      assertFile('tests/unit/mixins/foo-test.js', {
        contains: [
          "import FooMixin from 'my-app/mixins/foo';"
        ]
      });
    });
  });

  it('mixin foo/bar', function() {
    return generate(['mixin', 'foo/bar']).then(function() {
      assertFile('app/mixins/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({' + EOL + '});'
        ]
      });
      assertFile('tests/unit/mixins/foo/bar-test.js', {
        contains: [
          "import FooBarMixin from 'my-app/mixins/foo/bar';"
        ]
      });
    });
  });

  it('mixin foo/bar/baz', function() {
    return generate(['mixin', 'foo/bar/baz']).then(function() {
      assertFile('tests/unit/mixins/foo/bar/baz-test.js', {
        contains: [
          "import FooBarBazMixin from 'my-app/mixins/foo/bar/baz';"
        ]
      });
    });
  });

  it('adapter application', function() {
    return generate(['adapter', 'application']).then(function() {
      assertFile('app/adapters/application.js', {
        contains: [
          "import DS from \'ember-data\';",
          "export default DS.RESTAdapter.extend({" + EOL + "});"
        ]
      });
      assertFile('tests/unit/adapters/application-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('adapter:application', 'ApplicationAdapter'"
        ]
      });
    });
  });

  it('adapter foo', function() {
    return generate(['adapter', 'foo']).then(function() {
      assertFile('app/adapters/foo.js', {
        contains: [
          "import ApplicationAdapter from \'./application\';",
          "export default ApplicationAdapter.extend({" + EOL + "});"
        ]
      });
      assertFile('tests/unit/adapters/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('adapter:foo', 'FooAdapter'"
        ]
      });
    });
  });

  it('adapter foo/bar', function() {
    return generate(['adapter', 'foo/bar']).then(function() {
      assertFile('app/adapters/foo/bar.js', {
        contains: [
          "import ApplicationAdapter from \'./application\';",
          "export default ApplicationAdapter.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('adapter application cannot extend from --base-class=application', function() {
    return generate(['adapter', 'application', '--base-class=application']).then(function() {
      expect(false);
    }, function(err) {
      expect(err.message).to.match(/Adapters cannot extend from themself/);
    });
  });

  it('adapter foo cannot extend from --base-class=foo', function() {
    return generate(['adapter', 'foo', '--base-class=foo']).then(function() {
      expect(false);
    }, function(err) {
      expect(err.message).to.match(/Adapters cannot extend from themself/);
    });
  });

  it('adapter extends from --base-class=bar', function() {
    return generate(['adapter', 'foo', '--base-class=bar']).then(function() {
      assertFile('app/adapters/foo.js', {
        contains: [
          "import BarAdapter from './bar';",
          "export default BarAdapter.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('adapter extends from --base-class=foo/bar', function() {
    return generate(['adapter', 'foo/baz', '--base-class=foo/bar']).then(function() {
      assertFile('app/adapters/foo/baz.js', {
        contains: [
          "import FooBarAdapter from './foo/bar';",
          "export default FooBarAdapter.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('adapter extends from application adapter if present', function() {
    return generate(['adapter', 'application']).then(function() {
      return generate(['adapter', 'foo']).then(function() {
        assertFile('app/adapters/foo.js', {
          contains: [
            "import ApplicationAdapter from './application';",
            "export default ApplicationAdapter.extend({" + EOL + "});"
          ]
        });
      });
    });
  });

  it('adapter favors  --base-class over  application', function() {
    return generate(['adapter', 'application']).then(function() {
      return generate(['adapter', 'foo', '--base-class=bar']).then(function() {
        assertFile('app/adapters/foo.js', {
          contains: [
            "import BarAdapter from './bar';",
            "export default BarAdapter.extend({" + EOL + "});"
          ]
        });
      });
    });
  });

  it('serializer foo', function() {
    return generate(['serializer', 'foo']).then(function() {
      assertFile('app/serializers/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({' + EOL + '});'
        ]
      });
      assertFile('tests/unit/serializers/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
        ]
      });
    });
  });

  it('serializer foo/bar', function() {
    return generate(['serializer', 'foo/bar']).then(function() {
      assertFile('app/serializers/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({' + EOL + '});'
        ]
      });
      assertFile('tests/unit/serializers/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('serializer:foo/bar', 'FooBarSerializer'"
        ]
      });
    });
  });

  it('transform foo', function() {
    return generate(['transform', 'foo']).then(function() {
      assertFile('app/transforms/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.Transform.extend({' + EOL +
          '  deserialize: function(serialized) {' + EOL +
          '    return serialized;' + EOL +
          '  },' + EOL +
          EOL +
          '  serialize: function(deserialized) {' + EOL +
          '    return deserialized;' + EOL +
          '  }' + EOL +
          '});'
        ]
      });
      assertFile('tests/unit/transforms/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('transform:foo', 'FooTransform'"
        ]
      });
    });
  });

  it('transform foo/bar', function() {
    return generate(['transform', 'foo/bar']).then(function() {
      assertFile('app/transforms/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.Transform.extend({' + EOL +
          '  deserialize: function(serialized) {' + EOL +
          '    return serialized;' + EOL +
          '  },' + EOL +
          '' + EOL +
          '  serialize: function(deserialized) {' + EOL +
          '    return deserialized;' + EOL +
          '  }' + EOL +
          '});'
        ]
      });
      assertFile('tests/unit/transforms/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('transform:foo/bar', 'FooBarTransform'"
        ]
      });
    });
  });

  it('util foo-bar', function() {
    return generate(['util', 'foo-bar']).then(function() {
      assertFile('app/utils/foo-bar.js', {
        contains: 'export default function fooBar() {' + EOL +
                  '  return true;' + EOL +
                  '}'
      });
      assertFile('tests/unit/utils/foo-bar-test.js', {
        contains: [
          "import fooBar from 'my-app/utils/foo-bar';"
        ]
      });
    });
  });

  it('util foo-bar/baz', function() {
    return generate(['util', 'foo/bar-baz']).then(function() {
      assertFile('app/utils/foo/bar-baz.js', {
        contains: 'export default function fooBarBaz() {' + EOL +
                  '  return true;' + EOL +
                  '}'
      });
      assertFile('tests/unit/utils/foo/bar-baz-test.js', {
        contains: [
          "import fooBarBaz from 'my-app/utils/foo/bar-baz';"
        ]
      });
    });
  });

  it('service foo', function() {
    return generate(['service', 'foo']).then(function() {
      assertFile('app/services/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Object.extend({' + EOL + '});'
        ]
      });
      assertFile('app/initializers/foo-service.js', {
        contains: "export function initialize(container, application) {" + EOL +
                  "  application.inject('route', 'fooService', 'service:foo');" + EOL +
                  "}" + EOL + EOL +
                  "export default {" + EOL +
                  "  name: 'foo-service'," + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });
      assertFile('tests/unit/services/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('service:foo', 'FooService'"
        ]
      });
    });
  });

  it('service foo/bar', function() {
    return generate(['service', 'foo/bar']).then(function() {
      assertFile('app/services/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Object.extend({' + EOL + '});'
        ]
      });
      assertFile('app/initializers/foo/bar-service.js', {
        contains: "export function initialize(container, application) {" + EOL +
                  "  application.inject('route', 'fooBarService', 'service:foo/bar');" + EOL +
                  "}" + EOL + EOL +
                  "export default {" + EOL +
                  "  name: 'foo/bar-service'," + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });
      assertFile('tests/unit/services/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('service:foo/bar', 'FooBarService'"
        ]
      });
    });
  });

  it('blueprint foo', function() {
    return generate(['blueprint', 'foo']).then(function() {
      assertFile('blueprints/foo/index.js', {
        contains: "module.exports = {" + EOL +
                  "  description: ''"+ EOL +
                  EOL +
                  "  // locals: function(options) {" + EOL +
                  "  //   // Return custom template variables here." + EOL +
                  "  //   return {" + EOL +
                  "  //     foo: options.entity.options.foo" + EOL +
                  "  //   };" + EOL +
                  "  // }" + EOL +
                  EOL +
                  "  // afterInstall: function(options) {" + EOL +
                  "  //   // Perform extra work here." + EOL +
                  "  // }" + EOL +
                  "};"
      });
    });
  });

  it('blueprint foo/bar', function() {
    return generate(['blueprint', 'foo/bar']).then(function() {
      assertFile('blueprints/foo/bar/index.js', {
        contains: "module.exports = {" + EOL +
                  "  description: ''"+ EOL +
                  EOL +
                  "  // locals: function(options) {" + EOL +
                  "  //   // Return custom template variables here." + EOL +
                  "  //   return {" + EOL +
                  "  //     foo: options.entity.options.foo" + EOL +
                  "  //   };" + EOL +
                  "  // }" + EOL +
                  EOL +
                  "  // afterInstall: function(options) {" + EOL +
                  "  //   // Perform extra work here." + EOL +
                  "  // }" + EOL +
                  "};"
      });
    });
  });

  it('http-mock foo', function() {
    this.timeout(10000);
    return generate(['http-mock', 'foo']).then(function() {
      assertFile('server/index.js', {
        contains:"mocks.forEach(function(route) { route(app); });"
      });
      assertFile('server/mocks/foo.js', {
        contains: "module.exports = function(app) {" + EOL +
                  "  var express = require('express');" + EOL +
                  "  var fooRouter = express.Router();" + EOL +
                  EOL +
                  "  fooRouter.get('/', function(req, res) {" + EOL +
                  "    res.send({" + EOL +
                  "      'foo': []" + EOL +
                  "    });" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooRouter.post('/', function(req, res) {" + EOL +
                  "    res.status(201).end();" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooRouter.get('/:id', function(req, res) {" + EOL +
                  "    res.send({" + EOL +
                  "      'foo': {" + EOL +
                  "        id: req.params.id" + EOL +
                  "      }" + EOL +
                  "    });" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooRouter.put('/:id', function(req, res) {" + EOL +
                  "    res.send({" + EOL +
                  "      'foo': {" + EOL +
                  "        id: req.params.id" + EOL +
                  "      }" + EOL +
                  "    });" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooRouter.delete('/:id', function(req, res) {" + EOL +
                  "    res.status(204).end();" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  app.use('/api/foo', fooRouter);" + EOL +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{' + EOL + '  "node": true' + EOL + '}'
      });
    });
  });

  it('http-mock foo-bar', function() {
    return generate(['http-mock', 'foo-bar']).then(function() {
      assertFile('server/index.js', {
        contains: "mocks.forEach(function(route) { route(app); });"
      });
      assertFile('server/mocks/foo-bar.js', {
        contains: "module.exports = function(app) {" + EOL +
                  "  var express = require('express');" + EOL +
                  "  var fooBarRouter = express.Router();" + EOL +
                  EOL +
                  "  fooBarRouter.get('/', function(req, res) {" + EOL +
                  "    res.send({" + EOL +
                  "      'foo-bar': []" + EOL +
                  "    });" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooBarRouter.post('/', function(req, res) {" + EOL +
                  "    res.status(201).end();" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooBarRouter.get('/:id', function(req, res) {" + EOL +
                  "    res.send({" + EOL +
                  "      'foo-bar': {" + EOL +
                  "        id: req.params.id" + EOL +
                  "      }" + EOL +
                  "    });" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooBarRouter.put('/:id', function(req, res) {" + EOL +
                  "    res.send({" + EOL +
                  "      'foo-bar': {" + EOL +
                  "        id: req.params.id" + EOL +
                  "      }" + EOL +
                  "    });" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  fooBarRouter.delete('/:id', function(req, res) {" + EOL +
                  "    res.status(204).end();" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  app.use('/api/foo-bar', fooBarRouter);" + EOL +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{' + EOL + '  "node": true' + EOL + '}'
      });
    });
  });

  it('http-proxy foo', function() {
    return generate(['http-proxy', 'foo', 'http://localhost:5000']).then(function() {
      assertFile('server/index.js', {
        contains: "proxies.forEach(function(route) { route(app); });"
      });
      assertFile('server/proxies/foo.js', {
        contains: "var proxyPath = '/foo';" + EOL +
                  EOL +
                  "module.exports = function(app) {" + EOL +
                  "  // For options, see:" + EOL +
                  "  // https://github.com/nodejitsu/node-http-proxy" + EOL +
                  "  var proxy = require('http-proxy').createProxyServer({});" + EOL +
                  "  var path = require('path');" + EOL +
                  EOL +
                  "  proxy.on('error', function(err, req) {" + EOL +
                  "    console.error(err, req.url);" + EOL +
                  "  });" + EOL +
                  EOL +
                  "  app.use(proxyPath, function(req, res, next){" + EOL +
                  "    // include root path in proxied request" + EOL +
                  "    req.url = path.join(proxyPath, req.url);" + EOL +
                  "    proxy.web(req, res, { target: 'http://localhost:5000' });" + EOL +
                  "  });" + EOL +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{' + EOL + '  "node": true' + EOL + '}'
      });
    });
  });

  it('uses blueprints from the project directory', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';" + EOL +
          'export default Ember.Object.extend({ foo: true });' + EOL
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
          "import Ember from 'ember';" + EOL + EOL +
          "export default Ember.Controller.extend({ custom: true });" + EOL
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

  it('passes custom cli arguments to blueprint options', function() {
    return initApp()
      .then(function() {
        outputFile(
          'blueprints/customblue/files/app/__name__.js',
          "Q: Can I has custom command? A: <%= hasCustomCommand %>"
        );
        return outputFile(
          'blueprints/customblue/index.js',
          "module.exports = {" + EOL +
          "  locals: function(options) {" + EOL +
          "    var loc = {};" + EOL +
          "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';" + EOL +
          "    return loc;" + EOL +
          "  }," + EOL +
          "};" + EOL
        );
      })
      .then(function() {
        return ember(['generate', 'customblue', 'foo', '--custom-command']);
      })
      .then(function() {
        assertFile('app/foo.js', {
          contains: 'A: Yes!'
        });
      });
  });

  it('acceptance-test foo', function() {
    return generate(['acceptance-test', 'foo']).then(function() {
      var expected = path.join(__dirname, '../fixtures/generate/acceptance-test-expected.js');

      assertFileEquals('tests/acceptance/foo-test.js', expected);
    });
  });

  it('correctly identifies the root of the project', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/controllers/__name__.js',
          "import Ember from 'ember';" + EOL + EOL +
          "export default Ember.Controller.extend({ custom: true });" + EOL
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
        assertFile('app/controllers/foo.js', {
          contains: 'custom: true'
        });
      });
  });

  it('route foo --dry-run does not change router.js', function() {
    return generate(['route', 'foo', '--dry-run']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "route('foo')"
      });
    });
  });

  it('in-repo-addon foo-bar', function() {
    return generate(['in-repo-addon', 'foo-bar']).then(function() {
      assertFile('lib/foo-bar/index.js', {
        contains: [
          'module.exports = {',
          'name: \'foo-bar\'',
          '',
          'isDevelopingAddon: function() {',
          'return true;',
          '}',
          '}'
        ]
      });

      assertFile('lib/foo-bar/package.json', {
        contains: [
          '{',
          '  "name": "foo-bar"',
          '  "keywords": [',
          '    "ember-addon"',
          '  ]',
          '}'
        ]
      });

      assertFile('package.json', {
        contains: [
          '"' + path.normalize('lib/foo-bar').replace('\\', '\\\\') + '"'
        ]
      });

      assertFile('lib/.jshintrc');
    });
  });

  it('server', function() {
    return generate(['server']).then(function() {
      assertFile('server/index.js');
      assertFile('server/.jshintrc');
    });
  });

  it('availableOptions work with aliases.', function() {
    return generate(['route', 'foo', '-resource']).then(function() {
      assertFile('app/router.js', {
        contain: ["resource('foo')"]
      });
    });
  });

  it('lib', function() {
    return generate(['lib']).then(function() {
      assertFile('lib/.jshintrc');
    });
  });
});
