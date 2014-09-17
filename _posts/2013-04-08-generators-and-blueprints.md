---
layout: post
title: "Generators & Blueprints"
permalink: generators-and-blueprints
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-08-generators-and-blueprints.md"
---

Ember CLI ships with blueprints for many of the entities you’ll
need in your app.

{% highlight bash %}
ember generate route foo

installing
  create app/routes/foo.js
  create app/templates/foo.hbs
  create tests/unit/routes/foo-test.js
{% endhighlight %}

To see a list of all available blueprints, use `ember help generate`:

{% highlight bash %}
ember help generate

Requested ember-cli commands:

ember generate <blueprint> <options...>
  Generates new code from blueprints
  aliases: g
  --dry-run (Default: false)
  --verbose (Default: false)

  Available blueprints:
    ember-cli:
      acceptance-test
      adapter
      addon
      app
      blueprint
      component
      controller
      helper
      http-mock
      http-proxy
      initializer
      mixin
      model
      resource
      route
      serializer
      service
      template
      transform
      util
      view
{% endhighlight %}

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

### Blueprint Structure

A blueprint is a bundle of template files with optional install logic.

Blueprints follow a simple structure. Let's take the built-in
`controller` blueprint as an example:

{% highlight bash %}
blueprints/controller
├── files
│   ├── app
│   │   └── controllers
│   │       └── __name__.js
│   └── tests
│       └── unit
│           └── controllers
│               └── __name__-test.js
└── index.js
{% endhighlight %}

### Files

`files` contains templates for the all the files to be
installed into the target directory.

The `__name__` placeholder is subtituted with the dasherized
entity name at install time. For example, when the user
invokes `ember generate controller foo` then `__name__` becomes
`foo`.

### Template Variables (AKA Locals)

Variables can be inserted into templates with
`<%= someVariableName %>`.

For example, the built-in `util` blueprint
`files/app/utils/__name__.js` looks like this:

{% highlight js %}
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

{% highlight js %}
module.exports = {
  locals: function(options) {
    // Return custom template variables here.
    return {};
  },

  normalizeEntityName: function(entityName) {
    // Normalize and validate entity name here.
    return entityName;
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
- `beforeInstall`
- `afterInstall`
- `beforeUninstall`
- `afterUninstall`

#### locals

Use `locals` to add custom tempate variables. The method
receives one argument: `options`. Options is an object
containing general and entity-specific options.

When the following is called on the command line:

{% highlight bash %}
ember generate controller foo --type=array --dry-run
{% endhighlight %}

The object passed to `locals` looks like this:

{% highlight js %}
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

#### normalizeEntityName

Use the `normalizeEntityName` hook to add custom normalization and
validation of the provided entity name. The default hook does not
make any changes to the entity name, but makes sure an entity name
is present and that it doesn't have a trailing slash.

This hook receives the entity name as its first argument. The string
returned by this hook will be used as the new entity name.

#### beforeInstall & beforeUninstall

Called before any of the template files are processed and receives
the same arguments as `locals`. Typically used for validating any
additional command line options. As an example, the `controller`
blueprint validates its `--type` option in this hook.

#### afterInstall & afterUninstall

The `afterInstall` and `afterUninstall` hooks receives the same
arguments as `locals`. Use it to perform any custom work after the
files are processed. For example, the built-in `route` blueprint
uses these hooks to add and remove relevant route declarations in
`app/router.js`.
