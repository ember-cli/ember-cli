/*jshint quotmark: false*/

'use strict';

var Promise          = require('../../lib/ext/promise');
var assertFile       = require('../helpers/assert-file');
var conf             = require('../helpers/conf');
var ember            = require('../helpers/ember');
var fs               = require('fs-extra');
var path             = require('path');
var remove           = Promise.denodeify(fs.remove);
var root             = process.cwd();
var tmp              = require('tmp-sync');
var tmproot          = path.join(root, 'tmp');
var EOL              = require('os').EOL;
var BlueprintNpmTask = require('../helpers/disable-npm-on-blueprint');
var expect           = require('chai').expect;

describe('Acceptance: ember generate in-addon', function() {
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
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
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

  it('in-addon controller foo', function() {
    return generateInAddon(['controller', 'foo']).then(function() {
      assertFile('addon/controllers/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({" + EOL + "});"
        ]
      });
      assertFile('app/controllers/foo.js', {
        contains: [
          "import foo from 'my-addon/controllers/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/controllers/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('controller:foo'"
        ]
      });
    });
  });

  it('in-addon controller foo/bar', function() {
    return generateInAddon(['controller', 'foo/bar']).then(function() {
      assertFile('addon/controllers/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Controller.extend({" + EOL + "});"
        ]
      });
      assertFile('app/controllers/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/controllers/foo/bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/controllers/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('controller:foo/bar'"
        ]
      });
    });
  });

  it('in-addon component x-foo', function() {
    return generateInAddon(['component', 'x-foo']).then(function() {
      assertFile('addon/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "import layout from '../templates/components/x-foo';",
          "export default Ember.Component.extend({",
          "layout: layout",
          "});"
        ]
      });
      assertFile('addon/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('app/components/x-foo.js', {
        contains: [
          "import xFoo from 'my-addon/components/x-foo';",
          "export default xFoo;"
        ]
      });
      assertFile('tests/unit/components/x-foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForComponent," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForComponent('x-foo'"
        ]
      });
    });
  });

  it('in-addon component nested/x-foo', function() {
    return generateInAddon(['component', 'nested/x-foo']).then(function() {
      assertFile('addon/components/nested/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "import layout from '../../templates/components/nested/x-foo';",
          "export default Ember.Component.extend({",
          "layout: layout",
          "});"
        ]
      });
      assertFile('addon/templates/components/nested/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('app/components/nested/x-foo.js', {
        contains: [
          "import nestedXFoo from 'my-addon/components/nested/x-foo';",
          "export default nestedXFoo;"
        ]
      });
      assertFile('tests/unit/components/nested/x-foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForComponent," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForComponent('nested/x-foo'"
        ]
      });
    });
  });

  it('in-addon helper foo-bar', function() {
    return generateInAddon(['helper', 'foo-bar']).then(function() {
      assertFile('addon/helpers/foo-bar.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "export function fooBar(params/*, hash*/) {" + EOL +
                  "  return params;" + EOL +
                  "}" +  EOL + EOL +
                  "export default Ember.HTMLBars.makeBoundHelper(fooBar);"
      });
      assertFile('app/helpers/foo-bar.js', {
        contains: [
          "import fooBar from 'my-addon/helpers/foo-bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/helpers/foo-bar-test.js', {
        contains: "import {" + EOL +
          "  fooBar" + EOL +
          "} from '../../../helpers/foo-bar';"
      });
    });
  });

  it('in-addon helper foo/bar-baz', function() {
    return generateInAddon(['helper', 'foo/bar-baz']).then(function() {
      assertFile('addon/helpers/foo/bar-baz.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "export function fooBarBaz(params/*, hash*/) {" + EOL +
                  "  return params;" + EOL +
                  "}" + EOL + EOL +
                  "export default Ember.HTMLBars.makeBoundHelper(fooBarBaz);"
      });
      assertFile('app/helpers/foo/bar-baz.js', {
        contains: [
          "import fooBarBaz from 'my-addon/helpers/foo/bar-baz';",
          "export default fooBarBaz;"
        ]
      });
      assertFile('tests/unit/helpers/foo/bar-baz-test.js', {
        contains: "import {" + EOL +
          "  fooBarBaz" + EOL +
          "} from '../../../helpers/foo/bar-baz';"
      });
    });
  });

  it('in-addon model foo', function() {
    return generateInAddon(['model', 'foo']).then(function() {
      assertFile('addon/models/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.Model.extend"
        ]
      });
      assertFile('app/models/foo.js', {
        contains: [
          "import foo from 'my-addon/models/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/models/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForModel," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForModel('foo'"
        ]
      });
    });
  });

  it('in-addon model foo with attributes', function() {
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
      'bravoName:belongs_to'
    ]).then(function() {
      assertFile('addon/models/foo.js', {
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
      assertFile('app/models/foo.js', {
        contains: [
          "import foo from 'my-addon/models/foo';",
          "export default foo;"
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

  it('in-addon model foo/bar', function() {
    return generateInAddon(['model', 'foo/bar']).then(function() {
      assertFile('addon/models/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.Model.extend"
        ]
      });
      assertFile('app/models/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/models/foo/bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/models/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForModel," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForModel('foo/bar'"
        ]
      });
    });
  });

  it('in-addon route foo', function() {
    return generateInAddon(['route', 'foo']).catch(function(error) {
      expect(error.message).to.include('blueprint does not support ' +
        'generating inside addons.');
    });
  });

  it('in-addon template foo', function() {
    return generateInAddon(['template', 'foo']).then(function() {
      assertFile('addon/templates/foo.hbs');
    });
  });

  it('in-addon template foo/bar', function() {
    return generateInAddon(['template', 'foo/bar']).then(function() {
      assertFile('addon/templates/foo/bar.hbs');
    });
  });

  it('in-addon view foo', function() {
    return generateInAddon(['view', 'foo']).then(function() {
      assertFile('addon/views/foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.View.extend({" + EOL + "})"
        ]
      });
      assertFile('app/views/foo.js', {
        contains: [
          "import foo from 'my-addon/views/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/views/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('view:foo'"
        ]
      });
    });
  });

  it('in-addon view foo/bar', function() {
    return generateInAddon(['view', 'foo/bar']).then(function() {
      assertFile('addon/views/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.View.extend({" + EOL + "})"
        ]
      });
      assertFile('app/views/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/views/foo/bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/views/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('view:foo/bar'"
        ]
      });
    });
  });

  it('in-addon resource foos', function() {
    return generateInAddon(['resource', 'foos']).catch(function(error) {
      expect(error.message).to.include('blueprint does not support ' +
        'generating inside addons.');
    });
  });

  it('in-addon initializer foo', function() {
    return generateInAddon(['initializer', 'foo']).then(function() {
      assertFile('addon/initializers/foo.js', {
        contains: "export function initialize(/* container, application */) {" + EOL +
                  "  // application.inject('route', 'foo', 'service:foo');" + EOL +
                  "}" + EOL +
                  "" + EOL+
                  "export default {" + EOL +
                  "  name: 'foo'," + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });
      assertFile('app/initializers/foo.js', {
        contains: [
          "import foo from 'my-addon/initializers/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/initializers/foo-test.js');
    });
  });

  it('in-addon initializer foo/bar', function() {
    return generateInAddon(['initializer', 'foo/bar']).then(function() {
      assertFile('addon/initializers/foo/bar.js', {
        contains: "export function initialize(/* container, application */) {" + EOL +
                  "  // application.inject('route', 'foo', 'service:foo');" + EOL +
                  "}" + EOL +
                  "" + EOL+
                  "export default {" + EOL +
                  "  name: 'foo/bar'," + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });
      assertFile('app/initializers/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/initializers/foo/bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/initializers/foo/bar-test.js');
    });
  });

  it('in-addon mixin foo', function() {
    return generateInAddon(['mixin', 'foo']).then(function() {
      assertFile('addon/mixins/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({' + EOL + '});'
        ]
      });
      assertFile('tests/unit/mixins/foo-test.js', {
        contains: [
          "import FooMixin from '../../../mixins/foo';"
        ]
      });
    });
  });

  it('in-addon mixin foo/bar', function() {
    return generateInAddon(['mixin', 'foo/bar']).then(function() {
      assertFile('addon/mixins/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Mixin.create({' + EOL + '});'
        ]
      });
      assertFile('tests/unit/mixins/foo/bar-test.js', {
        contains: [
          "import FooBarMixin from '../../../mixins/foo/bar';"
        ]
      });
    });
  });

  it('in-addon mixin foo/bar/baz', function() {
    return generateInAddon(['mixin', 'foo/bar/baz']).then(function() {
      assertFile('tests/unit/mixins/foo/bar/baz-test.js', {
        contains: [
          "import FooBarBazMixin from '../../../mixins/foo/bar/baz';"
        ]
      });
    });
  });

  it('in-addon adapter application', function() {
    return generateInAddon(['adapter', 'application']).then(function() {
      assertFile('addon/adapters/application.js', {
        contains: [
          "import DS from \'ember-data\';",
          "export default DS.RESTAdapter.extend({" + EOL + "});"
        ]
      });
      assertFile('app/adapters/application.js', {
        contains: [
          "import application from 'my-addon/adapters/application';",
          "export default application;"
        ]
      });
      assertFile('tests/unit/adapters/application-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('adapter:application'"
        ]
      });
    });
  });

  it('in-addon adapter foo', function() {
    return generateInAddon(['adapter', 'foo']).then(function() {
      assertFile('addon/adapters/foo.js', {
        contains: [
          "import ApplicationAdapter from \'./application\';",
          "export default ApplicationAdapter.extend({" + EOL + "});"
        ]
      });
      assertFile('app/adapters/foo.js', {
        contains: [
          "import foo from 'my-addon/adapters/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/adapters/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('adapter:foo'"
        ]
      });
    });
  });

  it('in-addon adapter foo/bar', function() {
    return generateInAddon(['adapter', 'foo/bar']).then(function() {
      assertFile('addon/adapters/foo/bar.js', {
        contains: [
          "import ApplicationAdapter from \'./application\';",
          "export default ApplicationAdapter.extend({" + EOL + "});"
        ]
      });
      assertFile('app/adapters/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/adapters/foo/bar';",
          "export default fooBar;"
        ]
      });
    });
  });


  it('in-addon serializer foo', function() {
    return generateInAddon(['serializer', 'foo']).then(function() {
      assertFile('addon/serializers/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({' + EOL + '});'
        ]
      });
      assertFile('app/serializers/foo.js', {
        contains: [
          "import foo from 'my-addon/serializers/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/serializers/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForModel," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
        ]
      });
    });
  });

  it('in-addon serializer foo/bar', function() {
    return generateInAddon(['serializer', 'foo/bar']).then(function() {
      assertFile('addon/serializers/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          'export default DS.RESTSerializer.extend({' + EOL + '});'
        ]
      });
      assertFile('app/serializers/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/serializers/foo/bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/serializers/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleForModel," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleForModel('foo/bar'"
        ]
      });
    });
  });

  it('in-addon transform foo', function() {
    return generateInAddon(['transform', 'foo']).then(function() {
      assertFile('addon/transforms/foo.js', {
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
      assertFile('app/transforms/foo.js', {
        contains: [
          "import foo from 'my-addon/transforms/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/transforms/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('transform:foo'"
        ]
      });
    });
  });

  it('in-addon transform foo/bar', function() {
    return generateInAddon(['transform', 'foo/bar']).then(function() {
      assertFile('addon/transforms/foo/bar.js', {
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
      assertFile('app/transforms/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/transforms/foo/bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/transforms/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('transform:foo/bar'"
        ]
      });
    });
  });

  it('in-addon util foo-bar', function() {
    return generateInAddon(['util', 'foo-bar']).then(function() {
      assertFile('addon/utils/foo-bar.js', {
        contains: 'export default function fooBar() {' + EOL +
                  '  return true;' + EOL +
                  '}'
      });
      assertFile('app/utils/foo-bar.js', {
        contains: [
          "import fooBar from 'my-addon/utils/foo-bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/utils/foo-bar-test.js', {
        contains: [
          "import fooBar from '../../../utils/foo-bar';"
        ]
      });
    });
  });

  it('in-addon util foo-bar/baz', function() {
    return generateInAddon(['util', 'foo/bar-baz']).then(function() {
      assertFile('addon/utils/foo/bar-baz.js', {
        contains: 'export default function fooBarBaz() {' + EOL +
                  '  return true;' + EOL +
                  '}'
      });
      assertFile('app/utils/foo/bar-baz.js', {
        contains: [
          "import fooBarBaz from 'my-addon/utils/foo/bar-baz';",
          "export default fooBarBaz;"
        ]
      });
      assertFile('tests/unit/utils/foo/bar-baz-test.js', {
        contains: [
          "import fooBarBaz from '../../../utils/foo/bar-baz';"
        ]
      });
    });
  });

  it('in-addon service foo', function() {
    return generateInAddon(['service', 'foo']).then(function() {
      assertFile('addon/services/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Service.extend({' + EOL + '});'
        ]
      });
      assertFile('app/services/foo.js', {
        contains: [
          "import foo from 'my-addon/services/foo';",
          "export default foo;"
        ]
      });
      assertFile('tests/unit/services/foo-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('service:foo'"
        ]
      });
    });
  });

  it('in-addon service foo/bar', function() {
    return generateInAddon(['service', 'foo/bar']).then(function() {
      assertFile('addon/services/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Service.extend({' + EOL + '});'
        ]
      });
      assertFile('app/services/foo/bar.js', {
        contains: [
          "import fooBar from 'my-addon/services/foo/bar';",
          "export default fooBar;"
        ]
      });
      assertFile('tests/unit/services/foo/bar-test.js', {
        contains: [
          "import {" + EOL +
          "  moduleFor," + EOL +
          "  test" + EOL +
          "} from 'ember-qunit';",
          "moduleFor('service:foo/bar'"
        ]
      });
    });
  });

});
