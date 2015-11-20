---
layout: post
title: "Generators & Blueprints"
permalink: generators-and-blueprints
category: extending
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-08-generators-and-blueprints.md"
---


## Blueprints

Ember CLI ships with "Blueprints", snippet generators for many of the entities - models, controllers, components, and so on - that you'll need in your app. Blueprints allow us to share common Ember patterns in the community and you can even define your own.

To see a list of all available blueprints, with a short description of what they do, run `ember generate --help` or `ember g --help`, for short, at any time. For a longer, more detailed description of each blueprint, look in the appendix to this guide.

### Generating Blueprints

This in an example of how to generate a Route Blueprint.

{% highlight bash %}
ember generate route foo

installing
  create app/routes/foo.js
  create app/templates/foo.hbs
installing
  create tests/unit/routes/foo-test.js
{% endhighlight %}

For a list of all available blueprints, run:

{% highlight bash %}
ember help generate
{% endhighlight %}

### Defining a Custom Blueprint

You can define your own blueprints using `ember generate blueprint <name>`:

{% highlight bash %}
ember generate blueprint foo

installing
  create blueprints/.jshintrc
  create blueprints/foo/files/.gitkeep
  create blueprints/foo/index.js
{% endhighlight %}

Blueprints in your project’s directory take precedence over those packaged
with ember-cli. This makes it easy to override the built-in blueprints
just by generating one with the same name.

### Pods

You can generate certain built-in blueprints with a pods structure by passing the `--pod` option.

{% highlight bash %}
ember generate route foo --pod

installing
  create app/foo/route.js
  create app/foo/template.hbs
installing
  create tests/unit/foo/route-test.js

{% endhighlight %}

If you have `podModulePrefix` defined in your environment, your generated pod path will be automatically prefixed with it.

{% highlight bash %}
// podModulePrefix: app/pods
ember generate route foo --pod

installing
  create app/pods/foo/route.js
  create app/pods/foo/template.hbs
installing
  create tests/unit/pods/foo/route-test.js
{% endhighlight %}

The built-in blueprints that support pods structure are:

 - adapter
 - component
 - controller
 - model
 - route
 - resource
 - serializer
 - template
 - transform
 - view

Blueprints that don't support pods structure will simply ignore the `--pod` option and use the default structure.

If you would like to use the pods structure as the default for your project, you can set `usePods` in your `.ember-cli` config file
to `true` (setting was previously named `usePodsByDefault`). To generate or destroy a blueprint in the classic
type structure while `usePods` is `true`, use the `--classic` flag.

With the `usePods` set to `true`.
{% highlight javascript linenos %}
// .ember-cli
{
    "usePods": true
}
{% endhighlight %}

The following would occur when generating a route:

{% highlight bash %}
ember generate route taco

installing
  create app/taco/route.js
  create app/taco/template.hbs
installing
  create tests/unit/taco/route-test.js

ember generate route taco --classic

installing
  create app/routes/taco.js
  create app/templates/taco.hbs
installing
  create tests/unit/routes/taco-test.js

{% endhighlight %}

### Blueprint Structure

Blueprints follow a simple structure. Let's take the built-in
`helper` blueprint as an example:

{% highlight bash %}
  blueprints/helper
  ├── files
  │   ├── app
  │   │   └── helpers
  │   │       └── __name__.js
  └── index.js
{% endhighlight %}

The accompanying test is in another blueprint. Because it has the same name with a `-test` suffix,
it is generated automatically with the helper blueprint in this case.

{% highlight bash %}
  blueprints/helper-test
  ├── files
  │   └── tests
  │       └── unit
  │           └── helpers
  │               └── __name__-test.js
  └── index.js
{% endhighlight %}

Blueprints that support pods structure look a little different. Let's take the built-in
`controller` blueprint as an example:

{% highlight bash %}
  blueprints/controller
  ├── files
  │   ├── app
  │   │   └── __path__
  │   │       └── __name__.js
  └── index.js

  blueprints/controller-test
  ├── files
  │   └── tests
  │       └── unit
  │           └── __path__
  │               └── __test__.js
  └── index.js
{% endhighlight %}

### Files

`files` contains templates for the all the files to be
installed into the target directory.

The __`__name__`__ token is subtituted with the dasherized
entity name at install time. For example, when the user
invokes `ember generate controller foo` then `__name__` becomes
`foo`. When the `--pod` flag is used, for example `ember
generate controller foo --pod` then `__name__` becomes
`controller`.

The __`__path__`__ token is substituted with the blueprint
name at install time. For example, when the user invokes
`ember generate controller foo` then `__path__` becomes
`controller`. When the `--pod` flag is used, for example
`ember generate controller foo --pod` then `__path__`
becomes `foo` (or `<podModulePrefix>/foo` if the
podModulePrefix is defined). This token is primarily for
pod support, and is only necessary if the blueprint can be
used in pod structure. If the blueprint does not require pod
support, simply use the blueprint name instead of the
`__path__` token.

The __`__root__`__ token is substituted with either `app` or
`addon` depending upon where it is being generated. This token
is used to provide support for generating blueprints inside
addons, and is only necessary if the blueprint needs to be
generated into the `addon` directory of an addon. The
presence of this token will cause an additional addon-import
blueprint to be generated, which is simply a wrapper that
re-exports the module in the `addon` directory to allow consumers
to override addon modules easier.

The __`__test__`__ token is substituted with the dasherized
entity name and appended with `-test` at install time.
This token is primarily for pod support and only necessary
if the blueprint requires support for a pod structure. If
the blueprint does not require pod support, simply use the
`__name__` token instead.

### Template Variables (AKA Locals)

Variables can be inserted into templates with
`<%= someVariableName %>`.

For example, the built-in `util` blueprint
`files/app/utils/__name__.js` looks like this:

{% highlight javascript linenos %}
export default function <%= camelizedModuleName %>() {
  return true;
}
{% endhighlight %}

`<%= camelizedModuleName %>` is replaced with the real
value at install time.

The following template variables are provided by default:

 - `dasherizedPackageName`
 - `classifiedPackageName`
 - `dasherizedModuleName`
 - `classifiedModuleName`
 - `camelizedModuleName`

`packageName` is the project name as found in the project's
`package.json`.

`moduleName` is the name of the entity being generated.

The mechanism for providing custom template variables is
described below.

### Index.js

Custom installation and uninstallation behaviour can be added
by overriding the hooks documented below. `index.js` should
export a plain object, which will extend the prototype of the
`Blueprint` class. If needed, the original `Blueprint` prototype
can be accessed through the `_super` property.

{% highlight javascript linenos %}
module.exports = {
  locals: function(options) {
    // Return custom template variables here.
    return {};
  },

  normalizeEntityName: function(entityName) {
    // Normalize and validate entity name here.
    return entityName;
  },

  fileMapTokens: function(options) {
    // Return custom tokens to be replaced in your files
    return {
      __token__: function(options){
        // logic to determine value goes here
        return 'value';
      }
    }
  },

  beforeInstall: function(options) {},
  afterInstall: function(options) {},
  beforeUninstall: function(options) {},
  afterUninstall: function(options) {}

};
{% endhighlight %}

### Blueprint Hooks

As shown above, the following hooks are available to
blueprint authors:

- `locals`
- `normalizeEntityName`
- `fileMapTokens`
- `beforeInstall`
- `afterInstall`
- `beforeUninstall`
- `afterUninstall`

### locals

Use `locals` to add custom template variables. The method
receives one argument: `options`. Options is an object
containing general and entity-specific options.

When the following is called on the command line:

{% highlight bash %}
ember generate controller foo --type=array --dry-run
{% endhighlight %}

The object passed to `locals` looks like this:

{% highlight javascript linenos %}
{
  entity: {
    name: 'foo',
    options: {
      type: 'array'
    }
  },
  dryRun: true
}
{% endhighlight %}

This hook must return an object. It will be merged with the
aforementioned default locals.

### normalizeEntityName

Use the `normalizeEntityName` hook to add custom normalization and
validation of the provided entity name. The default hook does not
make any changes to the entity name, but makes sure an entity name
is present and that it doesn't have a trailing slash.

This hook receives the entity name as its first argument. The string
returned by this hook will be used as the new entity name.

### fileMapTokens

Use `fileMapTokens` to add custom fileMap tokens for use
in the `mapFile` method. The hook must return an object in the
following pattern:

{% highlight javascript linenos %}
{
  __token__: function(options){
    // logic to determine value goes here
    return 'value';
  }
}
{% endhighlight %}

It will be merged with the default `fileMapTokens`, and can be used
to override any of the default tokens.

Tokens are used in the files directory (see `files`), and get replaced with
values when the `mapFile` method is called.

### beforeInstall & beforeUninstall

Called before any of the template files are processed and receives
the same arguments as `locals`. Typically used for validating any
additional command line options.

### afterInstall & afterUninstall

The `afterInstall` and `afterUninstall` hooks receives the same
arguments as `locals`. Use it to perform any custom work after the
files are processed. For example, the built-in `route` blueprint
uses these hooks to add and remove relevant route declarations in
`app/router.js`.

### Overriding Install

If you don't want your blueprint to install the contents of
`files` you can override the `install` method. It receives the
same `options` object described above and must return a promise.
See the built-in `resource` blueprint for an example of this.

## Appendix

### Detailed List of Blueprints and Their Use

* **Acceptance Test**
  * Generates an acceptance test for a given feature
  * Acceptance Tests are used to test flows within your application i.e. a signup, login, editing your account, etc.
  * `ember generate acceptance-test signup`

* **Adapter**
  * This blueprint generates an Ember Data Adapter and its accompanying test
  * Options
    * Base Class
      * Application (default)
  * `ember generate adapter application` will generate an adapter called 'ApplicationAdapter' based off the DS.RESTAdapter by default.
  * `ember generate adapter user` will in turn call this adapter `UserAdapter` and inherit from the Application Adapter unless you specify a base class.

* **Adapter Test**
  * This blueprint generates a unit test for a given ember data adapter.
  * `ember generate adapter-test application`

* **Addon Import**
  * This blueprint generates an import wrapper in the `app` directory.
    * Import wrappers simply import a corresponding module from `addon` to allow easier overriding of
    a module in a project using the addon.
  * Used by ember-cli internally, it is only used when generating from inside addon projects.

* **Addon**
  * Generates an addon blueprint and its definition.
    * This is the base blueprint for ember-cli addons.
  * `ember addon awesome-addon`

* **App**
  * This is the default blueprint for ember-cli projects. It contains a conventional project structure and everything you will need to develop your ember apps.
  * This blueprint is most commonly encountered when starting a new application, as in `ember new`.

* **Blueprint**
  * Generates a Blueprint and its corresponding definition. You can use this to create your own custom Blueprints. A Blueprint is essentially a bundle of templates with optional install logic.
  * `ember generate blueprint example-blueprint`

* **Component**
  * Generates an Ember Component and its accompanying test.
  * A Component is your own app-specific tag with custom behaviour. They are basically views that are completely isolated. Usually used for building widgets.
  * Caveats
    * The component's name must contain a hyphen
    * Slashes are not allowed
  * `ember generate component nav-bar`

* **Component Test**
  * Generates a test for a given component
  * `ember generate component-test nav-bar`

* **Controller**
  * Generates a Controller of a given name, with accompanying test.
  * `ember generate controller users`

* **Controller Test**
  * Generates a unit test for a given Controller.
  * `ember generate controller-test index`

* **Helper**
  * Generates a Handlebars Helper and its test. Commonly used for html reuse.
  * `ember generate helper capitalize`

* **Helper Test**
  * Generates a test for a given helper
  * `ember generate helper-test capitalize`

* **HTTP Mock**
  * This blueprint generates a mock endpoint with an '/api' prefix that you can use to return canned data. This is commonly used as an API stub, which allows you to develop right away with the RESTAdapter instead of using fixtures.
  * `ember generate http-mock users`

* **HTTP Proxy**
  * Generates a relative proxy to another server. You can use this to forward requests to a local development server, for example.
  * Options
    * Local Path
    * Remote URL
  * `ember generate http-proxy`

* **In-Repo Addon**
  * Generates an addon within the same repository. Useful for project-specific addons.
  * The generator also creates a 'lib' directory, in which it stores the new addon.
  * `ember generate in-repo-addon calendar`

* **Initializer**
  * Generates an Ember Initializer and its accompanying tests.
  * Common uses are to setup injection rules, like a current user, services, etc. You shouldn't use them for fetching data via XHR, deferring readiness, or instantiating and using 'container.lookup'. For more about initializers, view the [API docs](http://emberjs.com/api/classes/Ember.Application.html#method_initializer)
  * `ember generate initializer current-user`

* **Initializer Test**
  * Generates a test for a given initializer.
  * `ember generate initializer-test current-user`

* **Mixin**
  * Generates a Mixin and its test. A mixin is an object whose properties can be added to other classes, like Controllers, Views, Routes, etc.
  * `ember generate mixin filterable`

* **Mixin Test**
  * Generates a test for a given mixin.
  * `ember generate mixin-test filterable`

* **Model**
  * Generates an Ember Data model and its test.
  * `ember generate model user`

* **Model Test**
  * Generates a test for a given model.
  * `ember generate model-test user`

* **Resource**
  * This blueprint generates a model, route, template, and their accompanying tests.
  * `ember generate resource user`

* **Route**
  * Generates a route, its test, and then registers it with the router.
  * Type
    * Route (default)
    * Resource
  * `ember generate route user`

* **Route Test**
  * Generates a test for a given route.

* **Serializer**
  * Generates an Ember Data serializer.
  * `ember generate serializer application`

* **Serializer Test**
  * Generates a test for a given ember data serializer
  * `ember generate serializer-test application`

* **Service**
  * Generates a service and initializer for injections. These are commonly used for cases like websocket initialization, geolocation, feature flags, etc.
  * `ember generate service geolocation`

* **Service Test**
  * Generates a unit test for a given service.
  * `ember generate service-test geolocation`

* **Template**
  * Generates a template.
  * `ember generate template user`

* **Transform**
  * Generates an Ember Data value transform, which are used to serialize and deserialize model attributes as they saved and loaded from the adapter. These can be useful for creating custom attributes.
  * `ember generate transform foo`

* **Transform Test**
  * Generates a transform unit test.
  * `ember generate transform-test foo`

* **Util**
  * Generates a utility module/function.
  *  `ember generate util foo`

* **Util Test**
  *  Generates a util unit test.
  *  `ember generate util-test foo`

* **View**
  * Generates a View.
  * `ember generate view user`

* **View Test**
  * Generates a view unit test.
  * `ember generate view-test user`
