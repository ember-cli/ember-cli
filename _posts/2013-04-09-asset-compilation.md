---
layout: post
title: "Asset Compilation"
permalink: asset-compilation
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-09-asset-compilation.md"
---

### Raw Assets

* `public/assets` vs `app/styles`

For adding images, fonts, or other assets use the `public/assets` folder. For
example you can do `public/assets/images`, and in your templates using
`/assets/images/logo.png` or from stylesheets using
`url('/assets/images/background.jpg')`.

### Stylesheets

Ember CLI supports plain CSS out of the box. You can add your css styles to
`app/styles/app.css` and it will be served at `assets/application-name.css`.

For example, to add bootstrap in your project you need to do the following: {% highlight bash %} bower install --save-dev bootstrap {% endhighlight %}

In {% highlight bash %} Brocfile.js {% endhighlight %} add the following: {% highlight bash %} app.import('vendor/bootstrap/dist/css/bootstrap.css');
{% endhighlight %} it's going to tell {% highlight bash %} Broccoli {% endhighlight %} that we want this file to be concatenated with our {% highlight bash %} vendor.css {% endhighlight %} file.

In {% highlight bash %} app/index.html {% endhighlight %} add the following:{% highlight bash %} <link rel="stylesheet" href="assets/vendor.css"> {% endhighlight %}


To use a CSS preprocessor, you'll need to install the appropriate
[Broccoli](https://github.com/joliss/broccoli) plugin. When using a
preprocessor, Broccoli is configured to look for an `app.less`, `app.scss`,
or `app.styl` manifest file in `app/styles`. This manifest should import any
additional stylesheets.

The compiled css-files are minified by `broccoli-clean-css` or `broccoli-csso`,
if it is installed locally. You can pass minifer-specific options to them using
the `minifyCSS:options` object in your brocfile. Minification is enabled by
default in the production-env and can be disabled using the `minifyCSS:enabled`
switch.

All your preprocessed stylesheets will be compiled into one file and served at
`assets/app.css`.

#### CSS

* Relative pathing gets changed (how to customize?)
* `@import` statements -> concat

#### LESS

To enable [LESS](http://lesscss.org/), you'll need to add
[broccoli-less-single](https://github.com/gabrielgrant/broccoli-less-single) to
your NPM modules.

{% highlight bash %}
npm install --save-dev broccoli-less-single
{% endhighlight %}

#### Sass

To enable [Sass](http://sass-lang.com/) *(SCSS without Sass)*, you'll need to
add [broccoli-sass](https://github.com/joliss/broccoli-sass) to your NPM
modules.

{% highlight bash %}
npm install --save-dev broccoli-sass
{% endhighlight %}

#### Stylus

To enable [Stylus](http://learnboost.github.io/stylus/), you must first add
[broccoli-stylus-single](https://github.com/gabrielgrant/broccoli-stylus-single) to your NPM
modules:

{% highlight bash %}
npm install --save-dev broccoli-stylus-single
{% endhighlight %}

### CoffeeScript

To enable [CoffeeScript](http://coffeescript.org/), you must
first add [broccoli-coffee](https://github.com/joliss/broccoli-coffee) to your
NPM modules:

{% highlight bash %}
npm install --save-dev broccoli-coffee
{% endhighlight %}

The modified `package.json` should be checked into source control. CoffeeScript
can be used in your app's source and in tests, just use the `.coffee` extension
on any file.

The ES6 module transpiler does not directly support CoffeeScript, but using them
together is simple. Use the `` ` `` character to escape out to JavaScript from
your `.coffee` files, and use the ES6 syntax there:

{% highlight coffeescript linenos %}
# app/models/post.coffee
`import User from 'appkit/models/user'`

Post = Em.Object.extend
  init: (userId) ->
    @set 'user', User.findById(userId)

`export default Post`
{% endhighlight %}

Note that earlier versions of the transpiler had explicit support for
CoffeeScript, but that support has been removed.

### EmberScript

To enable [EmberScript](http://emberscript.com), you must
first add [broccoli-ember-script](https://github.com/aradabaugh/broccoli-ember-script) to your
NPM modules:

{% highlight bash %}
npm install --save-dev broccoli-ember-script
{% endhighlight %}

Note that the ES6 module transpiler is not directly supported with Emberscript, to allow use of ES6 modules use the `` ` `` character to escape raw Javascript similar to the CoffeeScript example above.

### Emblem

For Emblem, run the following commands:

{% highlight bash %}
npm install --save-dev broccoli-emblem-compiler
{% endhighlight %}

### Fingerprinting and CDN URLs

When environment is production (e.g. `ember build --environment=production`), 
ember-cli will automatically fingerprint your js, css, png, jpg, and gif assets 
by appending an md5 checksum to the end of their filename 
(e.g. `assets/yourapp-9c2cbd818d09a4a742406c6cb8219b3b.js`). In addition, your 
html, js, and css files will be re-written to include the new name. There are 
a few options you can pass in to `EmberApp` in your `Brocfile.js` to customize 
this behavior.

* `enabled` - Default: `false` - Boolean. Enables fingerprinting if true,
otherwise, fingerprinting is disabled.
* `exclude` - Default: `[]` - An array of strings. If a filename contains any 
item in the exclude array, it will not be fingerprinted.
* `extensions` - Default: `['js', 'css', 'png', 'jpg', 'gif']` - The file types 
to add md5 checksums.
* `prepend` - Default: `''` - A string to prepend to all of the assets. Useful 
for CDN urls like `https://subdomain.cloudfront.net/`
* `replaceExtensions` - Default: `['html', 'css', 'js']` - The file types to 
replace source code with new checksum file names.

As an example, this `Brocfile` will exclude any file in the fonts/169929 
directory as well as add a cloudfront domain to each fingerprinted asset.

{% highlight javascript linenos %}
var app = new EmberApp({
  name: require('./package.json').name,

  minifyCSS: {
    enabled: true,
    options: {}
  },

  fingerprint: {
    enabled: true,
    exclude: ['fonts/169929'],
    prepend: 'https://sudomain.cloudfront.net/'
  },

  getEnvJSON: require('./config/environment')
});
{% endhighlight %}

The end result will turn

{% highlight html %}
<script src="assets/appname.js">
background: url('/images/foo.png');
{% endhighlight %}

into

{% highlight html %}
<script src="https://subdomain.cloudfront.net/assets/appname-342b0f87ea609e6d349c7925d86bd597.js">
background: url('https://subdomain.cloudfront.net/images/foo-735d6c098496507e26bb40ecc8c1394d.png');
{% endhighlight %}
