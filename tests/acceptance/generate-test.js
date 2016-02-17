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
var remove           = Promise.denodeify(fs.remove);
var replaceFile      = require('../helpers/file-utils').replaceFile;
var root             = process.cwd();
var tmproot          = path.join(root, 'tmp');
var BlueprintNpmTask = require('../helpers/disable-npm-on-blueprint');
var expect           = require('chai').expect;
var MockUI             = require('../helpers/mock-ui');
var mkTmpDirIn       = require('../../lib/utilities/mk-tmp-dir-in');

describe('Acceptance: ember generate', function() {
  this.timeout(20000);

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
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('controller:foo'"
        ]
      });
    });
  });

  it('controller foo/bar', function() {
    return generate(['controller', 'foo/bar']).then(function() {
      assertFile('app/controllers/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({\n});"
        ]
      });
      assertFile('tests/unit/controllers/foo/bar-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('controller:foo/bar'"
        ]
      });
    });
  });

  it('component x-foo', function() {
    return generate(['component', 'x-foo']).then(function() {
      assertFile('app/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('app/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/integration/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('x-foo'",
          "integration: true",
          "{{x-foo}}",
          "{{#x-foo}}"
        ]
      });
    });
  });

  it('component foo/x-foo', function() {
    return generate(['component', 'foo/x-foo']).then(function() {
      assertFile('app/components/foo/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('app/templates/components/foo/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/integration/components/foo/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('foo/x-foo'",
          "integration: true",
          "{{foo/x-foo}}",
          "{{#foo/x-foo}}"
        ]
      });
    });
  });

  it('component x-foo ignores --path option', function() {
    return generate(['component', 'x-foo', '--path', 'foo']).then(function() {
      assertFile('app/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('app/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/integration/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('x-foo'",
          "integration: true",
          "{{x-foo}}",
          "{{#x-foo}}"
        ]
      });
    });
  });

  it('component-test x-foo', function() {
    return generate(['component-test', 'x-foo']).then(function() {
      assertFile('tests/integration/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('x-foo'",
          "integration: true",
          "{{x-foo}}",
          "{{#x-foo}}"
        ]
      });
    });
  });

  it('component-test x-foo --unit', function() {
    return generate(['component-test', 'x-foo', '--unit']).then(function() {
      assertFile('tests/unit/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "moduleForComponent('x-foo'",
          "unit: true"
        ]
      });
    });
  });

  it('helper foo-bar', function() {
    return generate(['helper', 'foo-bar']).then(function() {
      assertFile('app/helpers/foo-bar.js', {
        contains: "import Ember from 'ember';\n\n" +
                  "export function fooBar(params/*, hash*/) {\n" +
                  "  return params;\n" +
                  "}\n\n" +
                  "export default Ember.Helper.helper(fooBar);"
      });
      assertFile('tests/unit/helpers/foo-bar-test.js', {
        contains: "import { fooBar } from 'my-app/helpers/foo-bar';"
      });
    });
  });

  it('helper foo/bar-baz', function() {
    return generate(['helper', 'foo/bar-baz']).then(function() {
      assertFile('app/helpers/foo/bar-baz.js', {
        contains: "import Ember from 'ember';\n\n" +
                  "export function fooBarBaz(params/*, hash*/) {\n" +
                  "  return params;\n" +
                  "}\n\n" +
                  "export default Ember.Helper.helper(fooBarBaz);"
      });
      assertFile('tests/unit/helpers/foo/bar-baz-test.js', {
        contains: "import { fooBarBaz } from 'my-app/helpers/foo/bar-baz';"
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
          "import { moduleForModel, test } from 'ember-qunit';",
          "moduleForModel('foo'",
          "needs: []"
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
      'metricData:custom-transform',
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
          "metricData: DS.attr('custom-transform')",
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
          "import { moduleForModel, test } from 'ember-qunit';",
          "moduleForModel('foo/bar'"
        ]
      });
    });
  });

  it('model-test foo', function() {
    return generate(['model-test', 'foo']).then(function() {
      assertFile('tests/unit/models/foo-test.js', {
        contains: [
          "import { moduleForModel, test } from 'ember-qunit';",
          "moduleForModel('foo'",
          "needs: []"
        ]
      });
    });
  });

  it('route foo', function() {
    return generate(['route', 'foo']).then(function() {
      assertFile('app/router.js', {
        contains: 'this.route(\'foo\')'
      });
      assertFile('app/routes/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({\n});"
        ]
      });
      assertFile('app/templates/foo.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/unit/routes/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('route:foo'"
        ]
      });
    });
  });

    it('route foo with --skip-router', function() {
    return generate(['route', 'foo', '--skip-router']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: 'this.route(\'foo\')'
      });
      assertFile('app/routes/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({\n});"
        ]
      });
      assertFile('app/templates/foo.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/unit/routes/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('route:foo'"
        ]
      });
    });
  });

  it('route foo with --path', function() {
    return generate(['route', 'foo', '--path=:foo_id/show']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.route(\'foo\', {',
          'path: \':foo_id/show\'',
          '});'
        ]
      });
    });
  });

  it('route foo with --reset-namespace', function() {
    return generate(['route', 'foo', '--reset-namespace']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.route(\'foo\', {',
          'resetNamespace: true',
          '});'
        ]
      });
    });
  });

  it('route foo with --reset-namespace=false', function() {
    return generate(['route', 'foo', '--reset-namespace=false']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.route(\'foo\', {',
          'resetNamespace: false',
          '});'
        ]
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
      return remove(path.join('app', 'templates', 'application.hbs'));
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
          "export default Ember.View.extend({\n})"
        ]
      });
      assertFile('tests/unit/views/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('view:foo'"
        ]
      });
    });
  });

  it('view foo/bar', function() {
    return generate(['view', 'foo/bar']).then(function() {
      assertFile('app/views/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.View.extend({\n})"
        ]
      });
      assertFile('tests/unit/views/foo/bar-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('view:foo/bar'"
        ]
      });
    });
  });

  it('resource foos', function() {
    return generate(['resource', 'foos']).then(function() {
      assertFile('app/router.js', {
        contains: 'this.route(\'foos\');'
      });
      assertFile('app/models/foo.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/routes/foos.js', {
        contains: 'export default Ember.Route.extend({\n});'
      });
      assertFile('app/templates/foos.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/unit/models/foo-test.js', {
        contains: "moduleForModel('foo'"
      });
      assertFile('tests/unit/routes/foos-test.js', {
        contains: "moduleFor('route:foos'"
      });
    });
  });

  it('resource without entity name does not throw exception', function() {

    var restoreWriteError = MockUI.prototype.writeError;
    MockUI.prototype.writeError = function(error) {
      expect(error.message).to.equal('The `ember generate <entity-name>` command requires an entity name to be specified. For more details, use `ember help`.');
    };

    return generate(['resource']).then(function() {
      MockUI.prototype.writeError = restoreWriteError;
    });

  });

  it('resource foos with --path', function() {
    return generate(['resource', 'foos', '--path=app/foos']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.route(\'foos\', {',
          'path: \'app/foos\'',
          '});'
        ]
      });
    });
  });

  it('resource foos with --reset-namespace', function() {
    return generate(['resource', 'foos', '--reset-namespace']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.route(\'foos\', {',
          'resetNamespace: true',
          '});'
        ]
      });
    });
  });

  it('resource foos with --reset-namespace=false', function() {
    return generate(['resource', 'foos', '--reset-namespace=false']).then(function() {
      assertFile('app/router.js', {
        contains: [
          'this.route(\'foos\', {',
          'resetNamespace: false',
          '});'
        ]
      });
    });
  });

  it('initializer foo', function() {
    return generate(['initializer', 'foo']).then(function() {
      assertFile('app/initializers/foo.js', {
        contains: "export function initialize(/* application */) {\n" +
                  "  // application.inject('route', 'foo', 'service:foo');\n" +
                  "}\n" +
                  "\n"+
                  "export default {\n" +
                  "  name: 'foo',\n" +
                  "  initialize\n" +
                  "};"
      });

      assertFile('tests/unit/initializers/foo-test.js', {
        contains: "import FooInitializer from 'my-app/initializers/foo';"
      });
    });
  });

  it('initializer-test foo', function() {
    return generate(['initializer-test', 'foo']).then(function() {
      assertFile('tests/unit/initializers/foo-test.js', {
        contains: [
          "import FooInitializer from 'my-app/initializers/foo';",
          "module('Unit | Initializer | foo'",
          "let application;",
          "FooInitializer.initialize(application);"
        ]
      });
    });
  });

  it('initializer foo/bar', function() {
    return generate(['initializer', 'foo/bar']).then(function() {
      assertFile('app/initializers/foo/bar.js', {
        contains: "export function initialize(/* application */) {\n" +
                  "  // application.inject('route', 'foo', 'service:foo');\n" +
                  "}\n" +
                  "\n"+
                  "export default {\n" +
                  "  name: 'foo/bar',\n" +
                  "  initialize\n" +
                  "};"
      });

      assertFile('tests/unit/initializers/foo/bar-test.js', {
        contains: "import FooBarInitializer from 'my-app/initializers/foo/bar';"
      });
    });
  });

  it('instance-initializer foo', function() {
    return generate(['instance-initializer', 'foo']).then(function() {
      assertFile('app/instance-initializers/foo.js', {
        contains: "export function initialize(/* appInstance */) {\n" +
                  "  // appInstance.inject('route', 'foo', 'service:foo');\n" +
                  "}\n" +
                  "\n"+
                  "export default {\n" +
                  "  name: 'foo',\n" +
                  "  initialize: initialize\n" +
                  "};"
      });

      assertFile('tests/unit/instance-initializers/foo-test.js', {
        contains: "import { initialize } from 'my-app/instance-initializers/foo';"
      });
    });
  });

  it('instance-initializer foo/bar', function() {
    return generate(['instance-initializer', 'foo/bar']).then(function() {
      assertFile('app/instance-initializers/foo/bar.js', {
        contains: "export function initialize(/* appInstance */) {\n" +
                  "  // appInstance.inject('route', 'foo', 'service:foo');\n" +
                  "}\n" +
                  "\n"+
                  "export default {\n" +
                  "  name: 'foo/bar',\n" +
                  "  initialize: initialize\n" +
                  "};"
      });

      assertFile('tests/unit/instance-initializers/foo/bar-test.js', {
        contains: "import { initialize } from 'my-app/instance-initializers/foo/bar';"
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

  it('mixin foo/bar', function() {
    return generate(['mixin', 'foo/bar']).then(function() {
      assertFile('app/mixins/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({\n});'
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
          "export default DS.RESTAdapter.extend({\n});"
        ]
      });
      assertFile('tests/unit/adapters/application-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('adapter:application'"
        ]
      });
    });
  });

  it('adapter foo', function() {
    return generate(['adapter', 'foo']).then(function() {
      assertFile('app/adapters/foo.js', {
        contains: [
          "import ApplicationAdapter from \'./application\';",
          "export default ApplicationAdapter.extend({\n});"
        ]
      });
      assertFile('tests/unit/adapters/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('adapter:foo'"
        ]
      });
    });
  });

  it('adapter foo/bar', function() {
    return generate(['adapter', 'foo/bar']).then(function() {
      assertFile('app/adapters/foo/bar.js', {
        contains: [
          "import ApplicationAdapter from \'../application\';",
          "export default ApplicationAdapter.extend({\n});"
        ]
      });
    });
  });

  it('adapter foo/bar/baz', function() {
    return generate(['adapter', 'foo/bar/baz']).then(function() {
      assertFile('app/adapters/foo/bar/baz.js', {
        contains: [
          "import ApplicationAdapter from \'../../application\';",
          "export default ApplicationAdapter.extend({\n});"
        ]
      });
    });
  });

  it('adapter application cannot extend from --base-class=application', function() {
    return generate(['adapter', 'application', '--base-class=application']).then(function() {
      expect(false).to.be.ok;
    }, function(err) {
      expect(err.message).to.match(/Adapters cannot extend from themself/);
    });
  });

  it('adapter foo cannot extend from --base-class=foo', function() {
    return generate(['adapter', 'foo', '--base-class=foo']).then(function() {
      expect(false).to.be.ok;
    }, function(err) {
      expect(err.message).to.match(/Adapters cannot extend from themself/);
    });
  });

  it('adapter extends from --base-class=bar', function() {
    return generate(['adapter', 'foo', '--base-class=bar']).then(function() {
      assertFile('app/adapters/foo.js', {
        contains: [
          "import BarAdapter from './bar';",
          "export default BarAdapter.extend({\n});"
        ]
      });
    });
  });

  it('adapter extends from --base-class=foo/bar', function() {
    return generate(['adapter', 'foo/baz', '--base-class=foo/bar']).then(function() {
      assertFile('app/adapters/foo/baz.js', {
        contains: [
          "import FooBarAdapter from '../foo/bar';",
          "export default FooBarAdapter.extend({\n});"
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
            "export default ApplicationAdapter.extend({\n});"
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
            "export default BarAdapter.extend({\n});"
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
          'export default DS.RESTSerializer.extend({\n});'
        ]
      });
      assertFile('tests/unit/serializers/foo-test.js', {
        contains: [
          "import { moduleForModel, test } from 'ember-qunit';",
        ]
      });
    });
  });

  it('serializer foo/bar', function() {
    return generate(['serializer', 'foo/bar']).then(function() {
      assertFile('app/serializers/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({\n});'
        ]
      });
      assertFile('tests/unit/serializers/foo/bar-test.js', {
        contains: [
          "import { moduleForModel, test } from 'ember-qunit';",
          "moduleForModel('foo/bar'"
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
      assertFile('tests/unit/transforms/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('transform:foo'"
        ]
      });
    });
  });

  it('transform foo/bar', function() {
    return generate(['transform', 'foo/bar']).then(function() {
      assertFile('app/transforms/foo/bar.js', {
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
      assertFile('tests/unit/transforms/foo/bar-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('transform:foo/bar'"
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

  it('util foo-bar/baz', function() {
    return generate(['util', 'foo/bar-baz']).then(function() {
      assertFile('app/utils/foo/bar-baz.js', {
        contains: 'export default function fooBarBaz() {\n' +
                  '  return true;\n' +
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
          'export default Ember.Service.extend({\n});'
        ]
      });
      assertFile('tests/unit/services/foo-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('service:foo'"
        ]
      });
    });
  });

  it('service foo/bar', function() {
    return generate(['service', 'foo/bar']).then(function() {
      assertFile('app/services/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Service.extend({\n});'
        ]
      });
      assertFile('tests/unit/services/foo/bar-test.js', {
        contains: [
          "import { moduleFor, test } from 'ember-qunit';",
          "moduleFor('service:foo/bar'"
        ]
      });
    });
  });

  it('blueprint foo', function() {
    return generate(['blueprint', 'foo']).then(function() {
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

  it('blueprint foo/bar', function() {
    return generate(['blueprint', 'foo/bar']).then(function() {
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

  it('http-mock foo', function() {
    return generate(['http-mock', 'foo']).then(function() {
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
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('http-mock foo-bar', function() {
    return generate(['http-mock', 'foo-bar']).then(function() {
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
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('http-proxy foo', function() {
    return generate(['http-proxy', 'foo', 'http://localhost:5000']).then(function() {
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

  it('uses custom model-test blueprint when generating resources', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/model-test/files/tests/unit/models/__test__.js',
          "// custom model-test\n"
        );
      })
      .then(function() {
        return ember(['generate', 'resource', 'foo']);
      })
      .then(function() {
        assertFile('tests/unit/models/foo-test.js', {
          contains: '// custom model-test'
        });
      });
  });

  it('uses custom route-test blueprint when generating resources', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/route-test/files/tests/unit/routes/__test__.js',
          "// custom route-test\n"
        );
      })
      .then(function() {
        return ember(['generate', 'resource', 'foo']);
      })
      .then(function() {
        assertFile('tests/unit/routes/foo-test.js', {
          contains: '// custom route-test'
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

  it('test-helper foo', function() {
    return generate(['test-helper', 'foo']).then(function() {
      assertFile('tests/helpers/foo.js', {
        contains: "import Ember from 'ember';\n" +
                  "\n" +
                  "export default Ember.Test.registerAsyncHelper('foo', function(app) {\n" +
                  "\n" +
                  "});"
      });
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

  it('server', function() {
    return generate(['server']).then(function() {
      assertFile('server/index.js');
      assertFile('server/.jshintrc');
    });
  });

  it('availableOptions work with aliases.', function() {
    return generate(['route', 'foo', '-d']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "route('foo')"
      });
    });
  });

  it('lib', function() {
    return generate(['lib']).then(function() {
      assertFile('lib/.jshintrc');
    });
  });

  it('custom blueprint availableOptions', function() {
    return initApp()
      .then(function() {
        return ember(['generate', 'blueprint', 'foo'])
          .then(function() {
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
            )
              .then(function() {
                return ember(['generate','foo','bar','-two']);
              });
      });
    })
      .then(function() {
        assertFile('app/foos/bar.js', {
          contain: ['export default Ember.Object.extend({ foo: two });']
        });
      });
  });
});
