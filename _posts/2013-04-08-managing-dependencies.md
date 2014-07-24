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

Ember CLI is configured to have git ignore your `bower_components` and `vendor`
directories by default.  Using the Bower configuration file allows collaborators
to fork your repo and get their dependencies installed locally by executing
`bower install` themselves.

Ember CLI watches `bower.json` for changes. Thus it reloads your app if you
install new dependencies via `bower install --save <dependencies>`.

Further documentation about Bower is available at their
[official documentation page](http://bower.io/).

### Compiling Assets

In your `Brocfile.js` specify a dependency before calling `app.toTree()`. You
can only import assets that are within the `bower_components` or `vendor`
directories. The following example scenarios illustrate how this works.

#### Javascript Assets

##### Standard Non-AMD Asset

Provide the asset path as the first and only argument:

{% highlight javascript linenos %}
app.import('bower_components/momentjs/moment.js');
{% endhighlight %}

##### Standard AMD Asset

Provide the asset path as the first argument, and the list of modules and exports as the second:

{% highlight javascript linenos %}
app.import('bower_components/ic-ajax/dist/named-amd/main.js', {
  exports: {
    'ic-ajax': [
      'default',
      'defineFixture',
      'lookupFixture',
      'raw',
      'request',
    ]
  }
});
{% endhighlight %}

To use this asset in your app, import it.
For example, with `ic-ajax`, when to use `ic.ajax.raw`:

{% highlight javascript linenos %}
import { raw as icAjaxRaw } from 'ic-ajax';
//...
icAjaxRaw( /* ... */ );
{% endhighlight %}

##### Environment Specific Assets

If you need to use different assets in different environments, specify an object as the first parameter. That objects keys should be the environment name, and the values should be the asset to use in that environment.

{% highlight javascript linenos %}
app.import({
  development: 'bower_components/ember/ember.js',
  production:  'bower_components/ember/ember.prod.js'
});
{% endhighlight %}

##### Customizing a built-in Asset

This is somewhat non-standard, but suppose that you have different versions of Ember specified (using the canary builds for example).  You would simply manipulate the vendor tree that is passed in to the `EmberApp` constructor:

{% highlight javascript linenos %}
var EmberApp  = require('ember-cli/lib/broccoli/ember-app');
var fileMover = require('broccoli-file-mover');

var vendorTree = fileMover('bower_components', {
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

var qunitBdd = pickFiles('bower_components/qunit-bdd/lib', {
    srcDir: '/',
    files: ['qunit-bdd.js'],
    destDir: '/assets'
});

module.exports = mergeTrees([app.toTree(), qunitBdd]);
{% endhighlight %}

**Notes:**
- Be sure to add the appropriate script tag for your test library.
- The first argument to `pickFiles` is a tree. This means that doing `pickFiles('bower_components', ...)` will cause **all files in `/bower_components`** to be watched. If you get a `Error: watch EMFILE` during build, this could be the culprit. Consider using a more specific path as tree or use `pickFiles(unwatchedTree('bower_components'),...)` from `broccoli-unwatched-tree`.

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
app.import('bower_components/foundation/css/foundation.css');
{% endhighlight %}

All style assets added this way will be concatenated and output as `/assets/vendor.css`.

##### Dynamic Styles (SCSS, LESS, etc)

The vendor trees that are provided upon instantiation are available to your dynamic style files.  Take the following example (in `app/styles/app.scss`):

{% highlight scss linenos %}
@import "bower_components/foundation/scss/normalize.scss";
{% endhighlight %}

#### Other Assets

##### Using app.import()

All other assets like images or fonts can also be added via `import()`. By default, they
will be copied to `dist/` as they are.

{% highlight javascript linenos %}
app.import('bower_components/font-awesome/fonts/fontawesome-webfont.ttf');
{% endhighlight %}

This example would create the font file in `dist/font-awesome/fonts/fontawesome-webfont.ttf`.

You can also optionally tell `import()` to place the file at a different path.
The following example will copy the file to `dist/assets/fontawesome-webfont.ttf`.

{% highlight javascript linenos %}
app.import('bower_components/font-awesome/fonts/fontawesome-webfont.ttf', {
  destDir: 'assets'
});
{% endhighlight %}

##### Using broccoli-static-compiler

With the [broccoli-static-compiler](https://github.com/joliss/broccoli-static-compiler) package, 
(parts of) a bower-installed package can be used as assets as-is. First ensure that the Broccoli 
packages needed to build are installed:

{% highlight bash %}
npm install --save-dev broccoli-static-compiler
npm install --save-dev broccoli-merge-trees
{% endhighlight %}

Add these imports to the top of `Brocfile.js`, just below the `EmberApp` require:

{% highlight javascript linenos %}
var mergeTrees = require('broccoli-merge-trees');
var pickFiles = require('broccoli-static-compiler');
{% endhighlight %}

At the bottom of `Brocfile.js` we merge assets from a bower dependency with the main app tree:

{% highlight javascript linenos %}
// Remove this line:
// module.exports = app.toTree()

// Copy only the relevant files. For example the WOFF-files and stylesheets for a webfont:
var extraAssets = pickFiles('bower_components/a-lovely-webfont', {
   srcDir: '/',
   files: ['**/*.woff', '**/stylesheet.css'],
   destDir: '/assets/fonts'
});

// Merge the app tree and our new font assets.
module.exports = mergeTrees([app.toTree(), extraAssets]);
{% endhighlight %}

In the above example the assets from the fictive bower dependency called `a-lovely-webfont` can now
be found under `/assets/fonts/`, and might be linked to from `index.html` like so:

{% highlight html %}
<link rel="stylesheet" href="assets/fonts/lovelyfont_bold/stylesheet.css">
{% endhighlight %}
