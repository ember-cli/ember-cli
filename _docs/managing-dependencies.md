---
layout: docs
title: "Managing Dependencies"
permalink: /docs/managing-dependencies/
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

Ember CLI is configured to have git ignore your `bower_components` directory by
default. Using the Bower configuration file allows collaborators to fork your
repo and get their dependencies installed locally by executing `bower install`
themselves.

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
app.import('bower_components/moment/moment.js');
{% endhighlight %}

From here you would use the package as specified by it's documentation, usually a global variable.
In this case it would be:

{% highlight javascript linenos %}
import Ember from 'ember';
/* global moment */
// No import for moment, it's a global called `moment`

// ...
var day = moment('Dec 25, 1995');
{% endhighlight %}

_Note: Don't forget to make JSHint happy by adding a `/* global MY_GLOBAL */` to your module, or
by defining it within the `predefs` section of your `.jshintrc` file._

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

If you need to use different assets in different environments, specify an object as the first parameter. That object's key should be the environment name, and the value should be the asset to use in that environment.

{% highlight javascript linenos %}
app.import({
  development: 'bower_components/ember/ember.js',
  production:  'bower_components/ember/ember.prod.js'
});
{% endhighlight %}

If you need to import an asset in one environment but not import it or any alternatives in other environments then you can wrap `app.import` in an `if` statement.

{% highlight javascript linenos %}
if (app.env === 'development') {
  app.import('vendor/ember-renderspeed/ember-renderspeed.js');
}
{% endhighlight %}

##### Customizing a built-in Asset

This is somewhat non-standard and discouraged, but suppose that due to a requirement in your application that you need to use the full version of
Handlebars even in the production environment.  You would simply provide the path to the `EmberApp` constructor:

{% highlight javascript linenos %}
var app = new EmberApp({
  vendorFiles: {
    'handlebars.js': {
      production: 'bower_components/handlebars/handlebars.js'
    }
  }
});

{% endhighlight %}

##### Test Assets

You may have additional libraries that should only be included when running tests (such as qunit-bdd or sinon). These can be merged into your assets in your Brocfile.js:

{% highlight javascript linenos %}
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var pickFiles = require('broccoli-static-compiler');

var app = new EmberApp();

var qunitBdd = pickFiles('bower_components/qunit-bdd/lib', {
    srcDir: '/',
    files: ['qunit-bdd.js'],
    destDir: '/assets'
});

module.exports = app.toTree(qunitBdd);
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
package needed to build are installed:

{% highlight bash %}
npm install --save-dev broccoli-static-compiler
{% endhighlight %}

Add this import to the top of `Brocfile.js`, just below the `EmberApp` require:

{% highlight javascript linenos %}
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

// Providing additional trees to the `toTree` method will result in those
// trees being merged in the final output.
module.exports = app.toTree(extraAssets);
{% endhighlight %}

In the above example the assets from the fictive bower dependency called `a-lovely-webfont` can now
be found under `/assets/fonts/`, and might be linked to from `index.html` like so:

{% highlight html %}
<link rel="stylesheet" href="assets/fonts/lovelyfont_bold/stylesheet.css">
{% endhighlight %}
