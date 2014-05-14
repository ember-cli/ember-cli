---
layout: post
title: "Managing Dependencies"
permalink: managing-dependencies
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-08-managing-dependencies.md"
---

Ember CLI uses [Bower](http://bower.io/) for dependency management.

### Bower Configuration

The Bower configuration file, `bower.json`, is located at the root of your Ember
CLI project, and lists the dependencies for your project. Changes to your
dependencies should be managed through this file, rather than manually
installing packages individually.

Executing `bower install` will install all of the dependencies listed in
`bower.json` in one step.

Ember CLI is configured to have git ignore your `vendor` directory by default.
Using the Bower configuration file allows collaborators to fork your repo and get
their dependencies installed locally by executing `bower install` themselves.

Ember CLI watches `bower.json` for changes. Thus it reloads your app if you
install new dependencies via `bower install --save <dependencies>`.

Further documentation about Bower is available at their
[official documentation page](http://bower.io/).

### Compiling Bower Assets

In your `Brocfile.js` specify a dependency before calling
`app.toTree()`. The following example scenarios should illustrate how
this works.

#### Javascript Assets

##### Standard Non-AMD Asset

Provide the asset path as the first and only argument:

{% highlight javascript linenos %}
app.import('vendor/momentjs/moment.js');
{% endhighlight %}

##### Standard AMD Asset

Provide the asset path as the first argument, and the list of modules and exports as the second:

{% highlight javascript linenos %}
app.import('vendor/ic-ajax/dist/named-amd/main.js', {
  'ic-ajax': [
    'default',
    'defineFixture',
    'lookupFixture',
    'raw',
    'request',
  ]
});
{% endhighlight %}

##### Environment Specific Assets

If you need to use different assets in different environments, specify an object as the first parameter. That objects keys should be the environment name, and the values should be the asset to use in that environment.

{% highlight javascript linenos %}
app.import({
  development: 'vendor/ember/ember.js',
  production:  'vendor/ember/ember.prod.js'
});
{% endhighlight %}

##### Customizing a built-in Asset

This is somewhat non-standard, but suppose that you have different versions of Ember specified (using the canary builds for example).  You would simply manipulate the vendor tree that is passed in to the `EmberApp` constructor:

{% highlight javascript linenos %}
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var fileMover   = require('broccoli-file-mover');

var vendorTree = fileMover('vendor', {
  files: {
    'ember-dev/ember.js': 'ember/ember.js',
    'ember-prod/ember.prod.js': 'ember/ember.prod.js'
  }
});

var app = new EmberApp({
  name: require('./package.json').name,
  trees: {
    vendor: vendorTree
  }

  getEnvJSON: require('./config/environment')
});
{% endhighlight %}

##### Test Assets

You may have additional libraries that should only be included when running tests (such as qunit-bdd or sinon). These can be merged into your assets in your Brocfile.js:

{% highlight javascript linenos %}
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var pickFiles = require('broccoli-static-compiler');
var mergeTrees = require('broccoli-merge-trees');

var app = new EmberApp({
// snip
});

var qunitBdd = pickFiles('vendor/qunit-bdd/lib', {
    srcDir: '/',
    files: ['qunit-bdd.js'],
    destDir: '/assets'
});

module.exports = mergeTrees([app.toTree(), qunitBdd]);
{% endhighlight %}

Be sure to add the appropriate script tag for your test library.

{% highlight html %}
...
<script src="assets/qunit.js"></script>
<script src="assets/qunit-bdd.js"></script>
...
{% endhighlight %}

#### Styles

##### Static CSS

Provide the asset path as the first argument:

{% highlight javascript linenos %}
app.import('vendor/foundation/css/foundation.css');
{% endhighlight %}

All style assets added this way will be concatenated and output as `/assets/vendor.css`.

##### Dynamic Styles (SCSS, LESS, etc)

The vendor trees that are provided upon instantiation are available to your dynamic style files.  Take the following example (in `app/styles/app.scss`):

{% highlight scss linenos %}
@import "vendor/foundation/scss/normalize.scss";
{% endhighlight %}

#### Other Assets

All other assets like images or fonts can also be added via `import()`. They
will be copied to `dist/` as they are.

{% highlight javascript linenos %}
app.import('vendor/font-awesome/fonts/fontawesome-webfont.ttf');
{% endhighlight %}

This example would create the font file in `dist/font-awesome/fonts/font-awesome-webfonts.ttf`.
