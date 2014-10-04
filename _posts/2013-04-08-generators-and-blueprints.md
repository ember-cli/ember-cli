---
layout: post
title: "Generators & Blueprints"
permalink: generators-and-blueprints
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-08-generators-and-blueprints.md"
---


## Blueprints

Ember CLI ships with "Blueprints", snippet generators for many of the entities - models, controllers, components, and so on - that you'll need in your app. Blueprints allow us to share common Ember patterns in the community and you can even define your own.

To see a list of all available blueprints, with a short description of what they do, run `ember generate --help` or `ember g --help`, for short, at any time.

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
  create tests/unit/routes/foo-test.js

{% endhighlight %}

If you have `podModulePrefix` defined in your environment, your generated pod path will be automatically prefixed with it.

{% highlight bash %}
// podModulePrefix: app/pods
ember generate route foo --pod

installing
  create app/pods/foo/route.js
  create app/pods/foo/template.hbs
installing
  create tests/unit/routes/foo-test.js
{% endhighlight %}

The built-in blueprints that support pods structure are:

 - component
 - controller
 - model
 - route
 - resource
 - template
 - view

Blueprints that don't support pods structure will simply ignore the `--pod` option and use the default structure.

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
  │           └── controllers
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

  fileMapTokens: function(options) (
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

Use `locals` to add custom tempate variables. The method
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

Tokens are used in the files folder (see `files`), and get replaced with
values when the `mapFile` method is called.

### beforeInstall & beforeUninstall

Called before any of the template files are processed and receives
the same arguments as `locals`. Typically used for validating any
additional command line options. As an example, the `controller`
blueprint validates its `--type` option in this hook.

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

