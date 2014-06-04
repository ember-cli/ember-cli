---
layout: post
title: "Managing Dependencies"
permalink: managing-dependencies
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-08-managing-dependencies.md"
---

Ember CLI uses [Bower](http://bower.io/) for dependency management. In this context, dependency management typically means downloading third-party javascript and/or CSS libraries like moment.js or Twitter Bootstrap for use in your application.

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

### Recommendations for Using Bower Assets in Your Ember App

Ideally, all dependencies downloaded via Bower would adhere to the ES6 module syntax, however this standard is still evolving.  In reality, dependencies will either be (listed in order of how we prefer to import them): 

1. Compatible with the ES6 module syntax, or
2. Compatible with the [Asynchronous Module Definition](http://requirejs.org/docs/whyamd.html) (AMD) format often used with [Require.js](http://requirejs.org/), or
3. Compatible with the [CommonJS Format](http://requirejs.org/docs/commonjs.html), or
4. Compatible with none of the above and therefore written to add variables to the global namespace, now considered a "legacy" approach to writing Javascript modules.

Learn more about [Handling Dependencies in Javascript](http://addyosmani.com/writing-modular-js/).

#### Begin Using ES6 Modules Soon
Where possible, you should use ES6-compatible libraries, and import them into your project using ES6 syntax.  

Officially, the ES6 module syntax is still [under development](http://wiki.ecmascript.org/doku.php?id=harmony:specification_drafts) by the Ecma TC39 committee.  However, it is unlikely that the `import` syntax used to import dependencies into a script will change.  Note that ES6 `import` functionality in ember-cli is still under development and not yet ready for use with importing dependencies.  

Nevertheless, we recommend you plan on using the ES6 `import` syntax when possible. Ember-cli leverages the [ES6 Module Transpiler](https://github.com/square/es6-module-transpiler) to allow ES6-style `import` statements to be used natively on modern browsers and be "transpiled" into older javascript supported by older browsers.  Use of the transpiler also enables the ES6 `import` syntax to be used with javascript modules that are compatible with ES6, AMD, or non-AMD (CommonJS or global legacy).

##### ES6 Module Example

At this time, ES6-style `import` is used for Ember libraries, but is not yet implemented for non-Ember libraries.

#### Importing AMD Modules

AMD modules are javascript libraries that are written to be used by any AMD-compliant script loader such as [Require.js](http://requirejs.org/).  Authors of AMD-compliant modules adhere to a [very simple standard](http://requirejs.org/docs/whyamd.html#amd) that AMD-compliant script loaders expect. Ember-cli includes its own script loader, so use of Require.js is not necessary. 

##### AMD Module Example #1: Official Method (Coming Soon)

*NOTE: This method will work soon, but support is still under development.*

To import an AMD module like [d3.js](http://d3js.org/) using ember-cli, first tell Bower to import this library and add an entry to your `bower.json` file:

```
bower install --save d3
```

Bower will download the necessary files to your `/vendor/d3` directory.  

Next, we tell Broccoli to add the relevant javascript files to the `/assets/your-app-name.js` file (PENDING: this will soon be `/assets/vendor.js`), which is explicitly referenced from your `index.html` page. Broccoli compiles 
this file every time you run either `ember serve` or `ember build`.  In your `Brocfile.js`, add this before calling `app.toTree()`:

{% highlight javascript linenos %}
app.import('vendor/d3/d3.js');
{% endhighlight %}

Note that you need not reference the `d3.min.js` file because Broccoli will minify this file for us when using `ember build --environment production` (assuming default settings in your `Brocfile.js`.

Any variables or functions defined in the `d3.js` library are now available for `import` in an Ember-managed javascript file.  Open the EmberJS file where you will be using the `d3.js` library (say `views/my-page.js`), and access the `d3.js` library directly.  

For example:

{% highlight javascript linenos %}
import d3 from 'd3';

var MyPageView = Ember.View.extend({
    didInsertElement: function() {
        console.log( d3.version );
    }
});
{% endhighlight %}

##### AMD Module Example #2: Temporary Method Using Shims

Once the method described in AMD Module Example #1 is released, this method will be deprecated.  In the meantime, use this for immediate compatibility with an easy option for upgrading to the official method when available.

Follow AMD Module Example #1 until the `import` step.  

Additional documentation to be added per [GitHub Pull Request #892](https://github.com/stefanpenner/ember-cli/issues/892)

For example:

{% highlight javascript linenos %}
import d3 from 'd3';

var MyPageView = Ember.View.extend({
    didInsertElement: function() {
        console.log( d3.version );
    }
});
{% endhighlight %}

##### AMD Module Example #3: Temporary Method Using Globals

The whole point of using AMD modules is to avoid defining variables in the global namespace.  Nevertheless, because AMD imports using ember-cli is still under development, you may use the method described under **Non-AMD Module Example** in the meantime.  This will support easy upgrading to proper use of AMD modules (using either one of the above examples, or a variation thereof) in the future.

#### Import CommonJS Libraries

CommonJS modules are javascript libraries that are generally intended for use with server-side javascript (e.g. using nodejs).  These libraries are frequently useful for client-side (i.e in the browser) javascript as well.

##### CommonJS Module Example

Additional documentation to be added per [GitHub Pull Request #892](https://github.com/stefanpenner/ember-cli/issues/892)

#### Import a Standard Non-AMD Library

Many javascript libraries will be written in a non-AMD or non-CommonJS manner.  Instead, they define variables or functions in the global namespace.  This is considered a deprecated practice, so you may wish to manually update the library to make it AMD-compliant, or more likely, to just include it in your global namespace.

##### Non-AMD Module Example

[Moment.js](http://momentjs.com/) is a javascript library which is not natively AMD-compliant (although [documentation](http://momentjs.com/docs/#/use-it/require-js/) is available on how to make it AMD-compliant with [RequireJS](http://requirejs.org/)). 

To import moment.js using ember-cli, first tell Bower to type:

```
bower install --save moment
```

Bower will download the necessary files to your `/vendor/moment` directory.  

Next, we tell Broccoli to add these javascript files to the `/assets/your-app-name.js` 
file which is explicitly referenced from your `index.html` page. Brocolli compiles 
this file as part of using `ember serve` or `ember build`.  In your `Brocfile.js`, 
add this before calling `app.toTree()`:

{% highlight javascript linenos %}
app.import('vendor/momentjs/moment.js');
{% endhighlight %}

Any variables or functions defined in the `moment.js` library are now in global 
scope and available on the `window` object in any javascript file (e.g. `window.moment`).  But to make these available as part of the Ember environment (and therefore without `window`), we will edit the `.jshintrc` file to add the following:

```json
{
  predef: {
    ...
    "moment": true
  }
}
```

Finally, open the EmberJS file where you will be using the `moment.js` 
library (say `views/my-page.js`), and access the `moment.js` library directly. For example:

{% highlight javascript linenos %}
var MyPageView = Ember.View.extend({
    didInsertElement: function() {
        console.log( moment().format() );
    }
});
{% endhighlight %}

##### Environment-Specific Assets

If you need to use different assets (i.e. javascript, css, etc.) in different environments, specify an object as the first parameter. That objects keys should be the environment name, and the values should be the asset to use in that environment.

{% highlight javascript linenos %}
app.import({
  development: 'vendor/ember/ember.js',
  production:  'vendor/ember/ember.prod.js'
});
{% endhighlight %}

##### Customizing a built-in Asset

This is somewhat non-standard, but suppose that you have different versions of Ember specified (using the canary builds for example).  You would simply manipulate the vendor tree that is passed in to the `EmberApp` constructor:

{% highlight javascript linenos %}
var EmberApp  = require('ember-cli/lib/broccoli/ember-app');
var fileMover = require('broccoli-file-mover');

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
