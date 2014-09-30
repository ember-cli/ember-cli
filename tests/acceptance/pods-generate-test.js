/*jshint quotmark: false*/

'use strict';

var Promise          = require('../../lib/ext/promise');
var assertFile       = require('../helpers/assert-file');
var assertFileEquals = require('../helpers/assert-file-equals');
var conf             = require('../helpers/conf');
var ember            = require('../helpers/ember');
var replaceFile      = require('../helpers/file-utils').replaceFile;
var fs               = require('fs-extra');
var outputFile       = Promise.denodeify(fs.outputFile);
var path             = require('path');
var rimraf           = Promise.denodeify(require('rimraf'));
var root             = process.cwd();
var tmp              = require('tmp-sync');
var tmproot          = path.join(root, 'tmp');
var EOL              = require('os').EOL;

describe('Acceptance: ember generate pod', function() {
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
    this.timeout(10000);

    process.chdir(root);
    return rimraf(tmproot);
  });

  function initApp() {
    return ember(['init', 'my-app', '--skip-npm', '--skip-bower']);
  }

  function preGenerate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  function generate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  function generateWithPrefix(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      replaceFile('config/environment.js', "var ENV = {", "var ENV = {" + EOL + "podModulePrefix: 'app/pods', " + EOL);
      return ember(generateArgs);
    });
  }

  it('controller foo --pod', function() {
    return generate(['controller', 'foo', '--pod']).then(function() {
      assertFile('app/foo/controller.js', {
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

  it('controller foo --pod podModulePrefix', function() {
    return generateWithPrefix(['controller', 'foo', '--pod']).then(function() {
      assertFile('app/pods/foo/controller.js', {
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

  it('controller foo --type=object --pod', function() {
    return generate(['controller', 'foo', '--type=object', '--pod']).then(function() {
      assertFile('app/foo/controller.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.ObjectController.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('controller foo --type=object --pod podModulePrefix', function() {
    return generateWithPrefix(['controller', 'foo', '--type=object', '--pod']).then(function() {
      assertFile('app/pods/foo/controller.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.ObjectController.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('controller foo --type=array --pod', function() {
    return generate(['controller', 'foo', '--type=array', '--pod']).then(function() {
      assertFile('app/foo/controller.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.ArrayController.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('controller foo --type=array --pod podModulePrefix', function() {
    return generateWithPrefix(['controller', 'foo', '--type=array', '--pod']).then(function() {
      assertFile('app/pods/foo/controller.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.ArrayController.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('controller foo/bar --pod', function() {
    return generate(['controller', 'foo/bar', '--pod']).then(function() {
      assertFile('app/foo/bar/controller.js', {
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

  it('controller foo/bar --pod podModulePrefix', function() {
    return generateWithPrefix(['controller', 'foo/bar', '--pod']).then(function() {
      assertFile('app/pods/foo/bar/controller.js', {
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

  it('component x-foo --pod', function() {
    return generate(['component', 'x-foo', '--pod']).then(function() {
      assertFile('app/components/x-foo/component.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({" + EOL + "});"
        ]
      });
      assertFile('app/components/x-foo/template.hbs', {
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

  it('component x-foo --pod podModulePrefix', function() {
    return generateWithPrefix(['component', 'x-foo', '--pod']).then(function() {
      assertFile('app/pods/components/x-foo/component.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({" + EOL + "});"
        ]
      });
      assertFile('app/pods/components/x-foo/template.hbs', {
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

  it('helper foo-bar --pod', function() {
    return generate(['helper', 'foo-bar', '--pod']).then(function() {
      assertFile('app/helpers/foo-bar.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "function fooBar(value) {" + EOL +
                  "  return value;" + EOL +
                  "}" +  EOL + EOL +
                  "export {" + EOL +
                  "  fooBar" + EOL +
                  "};" + EOL + EOL +
                  "export default Ember.Handlebars.makeBoundHelper(fooBar);"
      });
      assertFile('tests/unit/helpers/foo-bar-test.js', {
        contains: "import {" + EOL +
          "  fooBar" + EOL +
          "} from 'my-app/helpers/foo-bar';"
      });
    });
  });

  it('helper foo-bar --pod podModulePrefix', function() {
    return generateWithPrefix(['helper', 'foo-bar', '--pod']).then(function() {
      assertFile('app/helpers/foo-bar.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "function fooBar(value) {" + EOL +
                  "  return value;" + EOL +
                  "}" +  EOL + EOL +
                  "export {" + EOL +
                  "  fooBar" + EOL +
                  "};" + EOL + EOL +
                  "export default Ember.Handlebars.makeBoundHelper(fooBar);"
      });
      assertFile('tests/unit/helpers/foo-bar-test.js', {
        contains: "import {" + EOL +
          "  fooBar" + EOL +
          "} from 'my-app/helpers/foo-bar';"
      });
    });
  });

  it('helper foo/bar-baz --pod', function() {
    return generate(['helper', 'foo/bar-baz', '--pod']).then(function() {
      assertFile('app/helpers/foo/bar-baz.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "function fooBarBaz(value) {" + EOL +
                  "  return value;" + EOL +
                  "}" + EOL + EOL +
                  "export {" + EOL +
                  "  fooBarBaz" + EOL +
                  "};" + EOL + EOL +
                  "export default Ember.Handlebars.makeBoundHelper(fooBarBaz);"
      });
      assertFile('tests/unit/helpers/foo/bar-baz-test.js', {
        contains: "import {" + EOL +
          "  fooBarBaz" + EOL +
          "} from 'my-app/helpers/foo/bar-baz';"
      });
    });
  });

  it('helper foo/bar-baz --pod podModulePrefix', function() {
    return generateWithPrefix(['helper', 'foo/bar-baz', '--pod']).then(function() {
      assertFile('app/helpers/foo/bar-baz.js', {
        contains: "import Ember from 'ember';" + EOL + EOL +
                  "function fooBarBaz(value) {" + EOL +
                  "  return value;" + EOL +
                  "}" + EOL + EOL +
                  "export {" + EOL +
                  "  fooBarBaz" + EOL +
                  "};" + EOL + EOL +
                  "export default Ember.Handlebars.makeBoundHelper(fooBarBaz);"
      });
      assertFile('tests/unit/helpers/foo/bar-baz-test.js', {
        contains: "import {" + EOL +
          "  fooBarBaz" + EOL +
          "} from 'my-app/helpers/foo/bar-baz';"
      });
    });
  });

  it('model foo --pod', function() {
    return generate(['model', 'foo', '--pod']).then(function() {
      assertFile('app/foo/model.js', {
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

  it('model foo --pod podModulePrefix', function() {
    return generateWithPrefix(['model', 'foo', '--pod']).then(function() {
      assertFile('app/pods/foo/model.js', {
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

  it('model foo --pod with attributes', function() {
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
      '--pod'
    ]).then(function() {
      assertFile('app/foo/model.js', {
        contains: [
          "noType: DS.attr()",
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

  it('model foo/bar --pod', function() {
    return generate(['model', 'foo/bar', '--pod']).then(function() {
      assertFile('app/foo/bar/model.js', {
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

  it('model foo/bar --pod podModulePrefix', function() {
    return generateWithPrefix(['model', 'foo/bar', '--pod']).then(function() {
      assertFile('app/pods/foo/bar/model.js', {
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

  it('route foo --pod', function() {
    return generate(['route', 'foo', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.route('foo')"
      });
      assertFile('app/foo/route.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({" + EOL + "});"
        ]
      });
      assertFile('app/foo/template.hbs', {
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

  it('route foo --pod podModulePrefix', function() {
    return generateWithPrefix(['route', 'foo', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.route('foo')"
      });
      assertFile('app/pods/foo/route.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Route.extend({" + EOL + "});"
        ]
      });
      assertFile('app/pods/foo/template.hbs', {
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

  it('route foo --type=resource --pod', function() {
    return generate(['route', 'foo', '--type=resource', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foo', { path: 'foos/:foo_id' }, function() { });"
      });
    });
  });

  it('route foos --type=resource --pod', function() {
    return generate(['route', 'foos', '--type=resource', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foos', function() { });"
      });
    });
  });

  it('route index --pod', function() {
    return generate(['route', 'index', '--pod']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "this.route('index');"
      });
    });
  });

  it('route application --pod', function() {
    // need to run `initApp` manually here instead of using `generate` helper
    // because we need to remove the templates/application.hbs file to prevent
    // a prompt (due to a conflict)
    return initApp().then(function() {
      rimraf(path.join('app', 'templates', 'application.hbs'));
    })
    .then(function(){
      return ember(['generate', 'route', 'application', '--pod']);
    })
    .then(function() {
      assertFile('app/router.js', {
        doesNotContain: "this.route('application');"
      });
    });
  });

  it('route basic --pod isn\'t added to router', function() {
    return generate(['route', 'basic', '--pod']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "this.route('basic');"
      });
      assertFile('app/basic/route.js');
    });
  });

  it('route bar --pod does not create duplicates in router.js', function() {
    function checkRoute(testString) {
      var routerDefinition = (
        "Router.map(function() {" + EOL +
        "  this.resource('foo', function() {" + EOL+
        "    " + testString + EOL +
        "  });" + EOL +
        "});" + EOL
      );
      return outputFile('app/router.js', routerDefinition)
      .then(function() {
        return ember(['generate', 'route', 'bar', '--pod']);
      })
      .then(function() {
        return assertFile('app/router.js', {
          contains: routerDefinition
        });
      });
    }

    return initApp()
    .then(function() {
      return checkRoute("this.route('bar');");
    })
    .then(function() {
      return checkRoute("this.route ('bar');");
    })
    .then(function() {
      return checkRoute("this.route ( 'bar' );");
    })
    .then(function() {
      return checkRoute('this.route("bar");');
    });
  });

  it('template foo --pod', function() {
    return generate(['template', 'foo', '--pod']).then(function() {
      assertFile('app/foo/template.hbs');
    });
  });

  it('template foo --pod podModulePrefix', function() {
    return generateWithPrefix(['template', 'foo', '--pod']).then(function() {
      assertFile('app/pods/foo/template.hbs');
    });
  });

  it('template foo/bar --pod', function() {
    return generate(['template', 'foo/bar', '--pod']).then(function() {
      assertFile('app/foo/bar/template.hbs');
    });
  });

  it('template foo/bar --pod podModulePrefix', function() {
    return generateWithPrefix(['template', 'foo/bar', '--pod']).then(function() {
      assertFile('app/pods/foo/bar/template.hbs');
    });
  });

  it('view foo --pod', function() {
    return generate(['view', 'foo', '--pod']).then(function() {
      assertFile('app/foo/view.js', {
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

  it('view foo --pod podModulePrefix', function() {
    return generateWithPrefix(['view', 'foo', '--pod']).then(function() {
      assertFile('app/pods/foo/view.js', {
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

  it('view foo/bar --pod', function() {
    return generate(['view', 'foo/bar', '--pod']).then(function() {
      assertFile('app/foo/bar/view.js', {
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

  it('view foo/bar --pod podModulePrefix', function() {
    return generateWithPrefix(['view', 'foo/bar', '--pod']).then(function() {
      assertFile('app/pods/foo/bar/view.js', {
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

  it('resource foo --pod', function() {
    return generate(['resource', 'foo', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foo', { path: 'foos/:foo_id' }, function() { });"
      });
      assertFile('app/foo/model.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/foo/route.js', {
        contains: "export default Ember.Route.extend({" + EOL + "});"
      });
      assertFile('app/foo/template.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/unit/models/foo-test.js', {
        contains: "moduleForModel('foo', 'Foo'"
      });
      assertFile('tests/unit/routes/foo-test.js', {
        contains: "moduleFor('route:foo', 'FooRoute'"
      });
    });
  });

  it('resource foo --pod podModulePrefix', function() {
    return generateWithPrefix(['resource', 'foo', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foo', { path: 'foos/:foo_id' }, function() { });"
      });
      assertFile('app/pods/foo/model.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/pods/foo/route.js', {
        contains: "export default Ember.Route.extend({" + EOL + "});"
      });
      assertFile('app/pods/foo/template.hbs', {
        contains: '{{outlet}}'
      });
      assertFile('tests/unit/models/foo-test.js', {
        contains: "moduleForModel('foo', 'Foo'"
      });
      assertFile('tests/unit/routes/foo-test.js', {
        contains: "moduleFor('route:foo', 'FooRoute'"
      });
    });
  });

  it('resource foos --pod', function() {
    return generate(['resource', 'foos', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foos', function() { });"
      });
      assertFile('app/foo/model.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/foos/route.js', {
        contains: 'export default Ember.Route.extend({' + EOL + '});'
      });
      assertFile('app/foos/template.hbs', {
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

  it('resource foos --pod podModulePrefix', function() {
    return generateWithPrefix(['resource', 'foos', '--pod']).then(function() {
      assertFile('app/router.js', {
        contains: "this.resource('foos', function() { });"
      });
      assertFile('app/pods/foo/model.js', {
        contains: 'export default DS.Model.extend'
      });
      assertFile('app/pods/foos/route.js', {
        contains: 'export default Ember.Route.extend({' + EOL + '});'
      });
      assertFile('app/pods/foos/template.hbs', {
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

  it('initializer foo --pod', function() {
    return generate(['initializer', 'foo', '--pod']).then(function() {
      assertFile('app/initializers/foo.js', {
        contains: "export var initialize = function(/* container, application */) {" + EOL +
                  "  // application.inject('route', 'foo', 'service:foo');" + EOL +
                  "};" + EOL +
                  "" + EOL+
                  "export default {" + EOL +
                  "  name: 'foo'," + EOL + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });
    });
  });

  it('initializer foo/bar --pod', function() {
    return generate(['initializer', 'foo/bar', '--pod']).then(function() {
      assertFile('app/initializers/foo/bar.js', {
        contains: "export var initialize = function(/* container, application */) {" + EOL +
                  "  // application.inject('route', 'foo', 'service:foo');" + EOL +
                  "};" + EOL +
                  "" + EOL+
                  "export default {" + EOL +
                  "  name: 'foo/bar'," + EOL + EOL +
                  "  initialize: initialize" + EOL +
                  "};"
      });
    });
  });

  it('mixin foo --pod', function() {
    return generate(['mixin', 'foo', '--pod']).then(function() {
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

  it('mixin foo/bar --pod', function() {
    return generate(['mixin', 'foo/bar', '--pod']).then(function() {
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

  it('mixin foo/bar/baz --pod', function() {
    return generate(['mixin', 'foo/bar/baz', '--pod']).then(function() {
      assertFile('tests/unit/mixins/foo/bar/baz-test.js', {
        contains: [
          "import FooBarBazMixin from 'my-app/mixins/foo/bar/baz';"
        ]
      });
    });
  });

  it('adapter foo --pod', function() {
    return generate(['adapter', 'foo', '--pod']).then(function() {
      assertFile('app/adapters/foo.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.RESTAdapter.extend({" + EOL + "});"
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

  it('adapter foo/bar --pod', function() {
    return generate(['adapter', 'foo/bar', '--pod']).then(function() {
      assertFile('app/adapters/foo/bar.js', {
        contains: [
          "import DS from 'ember-data';",
          "export default DS.RESTAdapter.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('adapter --pod extends from --base-class=bar', function() {
    return generate(['adapter', 'foo', '--base-class=bar', '--pod']).then(function() {
      assertFile('app/adapters/foo.js', {
        contains: [
          "import BarAdapter from './bar';",
          "export default BarAdapter.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('adapter --pod extends from --base-class=foo/bar', function() {
    return generate(['adapter', 'foo/baz', '--base-class=foo/bar', '--pod']).then(function() {
      assertFile('app/adapters/foo/baz.js', {
        contains: [
          "import FooBarAdapter from './foo/bar';",
          "export default FooBarAdapter.extend({" + EOL + "});"
        ]
      });
    });
  });

  it('adapter --pod extends from application adapter if present', function() {
    return preGenerate(['adapter', 'application']).then(function() {
      return generate(['adapter', 'foo', '--pod']).then(function() {
        assertFile('app/adapters/foo.js', {
          contains: [
            "import ApplicationAdapter from './application';",
            "export default ApplicationAdapter.extend({" + EOL + "});"
          ]
        });
      });
    });
  });

  it('adapter --pod favors  --base-class over  application', function() {
    return preGenerate(['adapter', 'application']).then(function() {
      return generate(['adapter', 'foo', '--base-class=bar', '--pod']).then(function() {
        assertFile('app/adapters/foo.js', {
          contains: [
            "import BarAdapter from './bar';",
            "export default BarAdapter.extend({" + EOL + "});"
          ]
        });
      });
    });
  });

  it('serializer foo --pod', function() {
    return generate(['serializer', 'foo', '--pod']).then(function() {
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

  it('serializer foo/bar --pod', function() {
    return generate(['serializer', 'foo/bar', '--pod']).then(function() {
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

  it('transform foo --pod', function() {
    return generate(['transform', 'foo', '--pod']).then(function() {
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

  it('transform foo/bar --pod', function() {
    return generate(['transform', 'foo/bar', '--pod']).then(function() {
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

  it('util foo-bar --pod', function() {
    return generate(['util', 'foo-bar', '--pod']).then(function() {
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

  it('util foo-bar/baz --pod', function() {
    return generate(['util', 'foo/bar-baz', '--pod']).then(function() {
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

  it('service foo --pod', function() {
    return generate(['service', 'foo', '--pod']).then(function() {
      assertFile('app/services/foo.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Object.extend({' + EOL + '});'
        ]
      });
      assertFile('app/initializers/foo-service.js', {
        contains: "export default {" + EOL +
                  "  name: 'foo-service'," + EOL +
                  "  initialize: function(container, app) {" + EOL +
                  "    app.inject('route', 'fooService', 'service:foo');" + EOL +
                  "  }" + EOL +
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

  it('service foo/bar --pod', function() {
    return generate(['service', 'foo/bar', '--pod']).then(function() {
      assertFile('app/services/foo/bar.js', {
        contains: [
          "import Ember from 'ember';",
          'export default Ember.Object.extend({' + EOL + '});'
        ]
      });
      assertFile('app/initializers/foo/bar-service.js', {
        contains: "export default {" + EOL +
                  "  name: 'foo/bar-service'," + EOL +
                  "  initialize: function(container, app) {" + EOL +
                  "    app.inject('route', 'fooBarService', 'service:foo/bar');" + EOL +
                  "  }" + EOL +
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

  it('blueprint foo --pod', function() {
    return generate(['blueprint', 'foo', '--pod']).then(function() {
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

  it('blueprint foo/bar --pod', function() {
    return generate(['blueprint', 'foo/bar', '--pod']).then(function() {
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

  it('http-mock foo --pod', function() {
    return generate(['http-mock', 'foo', '--pod']).then(function() {
      assertFile('server/index.js', {
        contains:"module.exports = function(app) {" + EOL +
                 "  var globSync   = require('glob').sync;" + EOL +
                 "  var bodyParser = require('body-parser');" + EOL +
                 "  var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname }).map(require);" + EOL +
                 "  var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);" + EOL +
                 EOL +
                  "  app.use(bodyParser.json());" + EOL +
                  "  app.use(bodyParser.urlencoded({" + EOL +
                  "    extended: true" + EOL +
                  "  }));" + EOL +
                  "" + EOL +
                  "  mocks.forEach(function(route) { route(app); });" + EOL +
                  "" + EOL +
                  "  // proxy expects a stream, but express will have turned" + EOL +
                  "  // the request stream into an object because bodyParser" + EOL +
                  "  // has run. We have to convert it back to stream:" + EOL +
                  "  // https://github.com/nodejitsu/node-http-proxy/issues/180" + EOL +
                  "  app.use(require('connect-restreamer')());" + EOL +
                  "  proxies.forEach(function(route) { route(app); });" + EOL +
                  "};"
      });
      assertFile('server/mocks/foo.js', {
        contains: "module.exports = function(app) {" + EOL +
                  "  var express = require('express');" + EOL +
                  "  var fooRouter = express.Router();" + EOL +
                  "  fooRouter.get('/', function(req, res) {" + EOL +
                  "    res.send({\"foo\":[]});" + EOL +
                  "  });" + EOL +
                  "  app.use('/api/foo', fooRouter);" + EOL +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{' + EOL + '  "node": true' + EOL + '}'
      });
    });
  });

  it('http-mock foo-bar --pod', function() {
    return generate(['http-mock', 'foo-bar', '--pod']).then(function() {
      assertFile('server/index.js', {
        contains: "module.exports = function(app) {" + EOL +
                  "  var globSync   = require('glob').sync;" + EOL +
                  "  var bodyParser = require('body-parser');" + EOL +
                  "  var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname }).map(require);" + EOL +
                  "  var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);" + EOL +
                  EOL +
                  "  app.use(bodyParser.json());" + EOL +
                  "  app.use(bodyParser.urlencoded({" + EOL +
                  "    extended: true" + EOL +
                  "  }));" + EOL +
                  "" + EOL +
                  "  mocks.forEach(function(route) { route(app); });" + EOL +
                  "" + EOL +
                  "  // proxy expects a stream, but express will have turned" + EOL +
                  "  // the request stream into an object because bodyParser" + EOL +
                  "  // has run. We have to convert it back to stream:" + EOL +
                  "  // https://github.com/nodejitsu/node-http-proxy/issues/180" + EOL +
                  "  app.use(require('connect-restreamer')());" + EOL +
                  "  proxies.forEach(function(route) { route(app); });" + EOL +
                  "};"
      });
      assertFile('server/mocks/foo-bar.js', {
        contains: "module.exports = function(app) {" + EOL +
                  "  var express = require('express');" + EOL +
                  "  var fooBarRouter = express.Router();" + EOL +
                  "  fooBarRouter.get('/', function(req, res) {" + EOL +
                  "    res.send({\"foo-bar\":[]});" + EOL +
                  "  });" + EOL +
                  "  app.use('/api/foo-bar', fooBarRouter);" + EOL +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{' + EOL + '  "node": true' + EOL + '}'
      });
    });
  });

  it('http-proxy foo --pod', function() {
    return generate(['http-proxy', 'foo', 'http://localhost:5000', '--pod']).then(function() {
      assertFile('server/index.js', {
        contains: "module.exports = function(app) {" + EOL +
                  "  var bodyParser = require('body-parser');" + EOL +
                  "  var globSync   = require('glob').sync;" + EOL +
                  "  var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname }).map(require);" + EOL +
                  "  var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);" + EOL +
                  EOL +
                  "  app.use(bodyParser.json());" + EOL +
                  "  app.use(bodyParser.urlencoded({" + EOL +
                  "    extended: true" + EOL +
                  "  }));" + EOL +
                  EOL +
                  "  mocks.forEach(function(route) { route(app); });" + EOL +
                  EOL +
                  "  // proxy expects a stream, but express will have turned" + EOL +
                  "  // the request stream into an object because bodyParser" + EOL +
                  "  // has run. We have to convert it back to stream:" + EOL +
                  "  // https://github.com/nodejitsu/node-http-proxy/issues/180" + EOL +
                  "  app.use(require('connect-restreamer')());" + EOL +
                  "  proxies.forEach(function(route) { route(app); });" + EOL +
                  "};"
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
        return ember(['generate', 'foo', 'bar', '--pod']);
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
          'blueprints/controller/files/app/__path__/__name__.js',
          "import Ember from 'ember';" + EOL + EOL +
          "export default Ember.Controller.extend({ custom: true });" + EOL
        );
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo', '--pod']);
      })
      .then(function() {
        assertFile('app/foo/controller.js', {
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
          "  fileMapTokens: function(options) {" + EOL +
          "    return {" + EOL +
          "      __name__: function(options) {" + EOL +
          "         return options.dasherizedModuleName;" + EOL +
          "      }" + EOL +
          "    };" + EOL +
          "  }," + EOL +
          "  locals: function(options) {" + EOL +
          "    var loc = {};" + EOL +
          "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';" + EOL +
          "    return loc;" + EOL +
          "  }," + EOL +
          "};" + EOL
        );
      })
      .then(function() {
        return ember(['generate', 'customblue', 'foo', '--custom-command', '--pod']);
      })
      .then(function() {
        assertFile('app/foo.js', {
          contains: 'A: Yes!'
        });
      });
  });

  it('acceptance-test foo', function() {
    return generate(['acceptance-test', 'foo', '--pod']).then(function() {
      var expected = path.join(__dirname, '../fixtures/generate/acceptance-test-expected.js');

      assertFileEquals('tests/acceptance/foo-test.js', expected);
    });
  });

  it('correctly identifies the root of the project', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/__path__/__name__.js',
          "import Ember from 'ember';" + EOL + EOL +
          "export default Ember.Controller.extend({ custom: true });" + EOL
        );
      })
      .then(function() {
        process.chdir(path.join(tmpdir, 'app'));
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo', '--pod']);
      })
      .then(function() {
        process.chdir(tmpdir);
      })
      .then(function() {
        assertFile('app/foo/controller.js', {
          contains: 'custom: true'
        });
      });
  });

  it('route foo --dry-run --pod does not change router.js', function() {
    return generate(['route', 'foo', '--dry-run', '--pod']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "route('foo')"
      });
    });
  });
});
