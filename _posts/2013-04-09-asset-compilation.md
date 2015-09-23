---
layout: post
title: "Asset Compilation"
permalink: asset-compilation
category: user-guide
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-09-asset-compilation.md"
---

### Raw Assets

* `public/assets` vs `app/styles`

To add images, fonts, or other assets, place them in the `public/assets` directory. For
example, if you place `logo.png` in `public/assets/images`, you can reference it in
templates with `assets/images/logo.png` or in stylesheets with
`url('/assets/images/logo.png')`.

### Minifying

The compiled css-files are minified by `broccoli-clean-css` or `broccoli-csso`,
if it is installed locally. You can pass minifer-specific options to them using
the `minifyCSS:options` object in your ember-cli-build. Minification is enabled by
default in the production-env and can be disabled using the `minifyCSS:enabled`
switch.

Similarly, the js-files are minified with `broccoli-uglify-js` in the
production-env by default. You can pass custom options to the minifier via the
`minifyJS:options` object in your ember-cli-build. To enable or disable JS minification
you may supply a boolean value for `minifyJS:enabled`.

For example, to disable minifying of CSS and JS, add in `ember-cli-build.js`:
{% highlight bash %}
minifyCSS: {
  enabled: false
},
minifyJS: {
  enabled: false
}
{% endhighlight %}

### Source Maps

Ember CLI supports producing source maps from your CSS and JS files.
Source maps are configured by the `sourcemaps` option and
are disabled in production by default.

In dev, the default setting is equal to:

{% highlight bash %}
sourcemaps: {
  enabled: true,
  extensions: ['js']
}
{% endhighlight %}

Pass `{enabled: true}` to your EmberApp constructor to enable source maps for javascript.
Use the `extensions` option to configure CSS.

### Stylesheets

Ember CLI supports plain CSS out of the box. You can add your css styles to
`app/styles/app.css` and it will be served at `assets/application-name.css`.

For example, to add bootstrap in your project you need to do the following:
{% highlight bash %}
bower install bootstrap --save
{% endhighlight %}

In `ember-cli-build.js` add the following:
{% highlight bash %}
app.import('bower_components/bootstrap/dist/css/bootstrap.css');
{% endhighlight %}
it's going to tell [Broccoli](https://github.com/joliss/broccoli) that we want this file to be concatenated with our `vendor.css` file.

To use a CSS preprocessor, you'll need to install the appropriate
[Broccoli](https://github.com/joliss/broccoli) plugin. When using a
preprocessor, Broccoli is configured to look for an `app.less`, `app.scss`, `app.sass`,
or `app.styl` manifest file in `app/styles`. This manifest should import any
additional stylesheets.

All your preprocessed stylesheets will be compiled into one file and served at
`assets/application-name.css`.

If you would like to change this behavior, or compile to multiple output stylesheets, you can adjust the [Output Paths Configuration](#configuring-output-paths)

#### CSS

To use plain CSS with `app.css`:

* Write your styles in `app.css` and/or organize your CSS into multiple stylesheet files and import these files with `@import` from within `app.css`.
* [CSS `@import` statements](https://developer.mozilla.org/en-US/docs/Web/CSS/@import) (e.g. `@import 'typography.css';`) must be valid CSS, meaning `@import` statements *must* precede all other rules and so be placed at the *top* of `app.css`.
* In the production build, the `@import` statements are replaced with the contents of their files and the final minified, concatenated single CSS file is built to `dist/assets/yourappname-FINGERPRINT_GOES_HERE.css`.
* Any individual CSS files are also built and minified into `dist/assets/` in case you need them as standalone stylesheets.
* Relative pathing gets changed (how to customize?)

Example `app.css` with valid `@import` usage:

{% highlight css linenos %}
/* @imports must appear at top of stylesheet to be valid CSS */
@import 'typography.css';
@import 'forms.css';

/* Any CSS rules must go *after* any @imports */
.first-css-rule {
  color: red;
}
...
{% endhighlight %}

#### CSS Preprocessors

To use one of the following preprocessors, all you need to do is install the appropriate NPM module.
The respective files will be picked up and processed automatically.

#### LESS

To enable [LESS](http://lesscss.org/), you'll need to add
[ember-cli-less](https://github.com/gdub22/ember-cli-less) to
your NPM modules.

{% highlight bash %}
ember install ember-cli-less
{% endhighlight %}

#### Sass

To enable [Sass](http://sass-lang.com/), you'll need to
install the [ember-cli-sass](https://github.com/aexmachina/ember-cli-sass) addon
to your project *(both .scss/.sass are allowed)*.

{% highlight bash %}
ember install ember-cli-sass
{% endhighlight %}

#### Compass

To use [Compass](http://compass-style.org/) with your ember-cli app, install
[ember-cli-compass-compiler](https://github.com/quaertym/ember-cli-compass-compiler) addon using NPM.

{% highlight bash %}
ember install ember-cli-compass-compiler
{% endhighlight %}

#### Stylus

To enable [Stylus](http://learnboost.github.io/stylus/), you must first add
[ember-cli-stylus](https://github.com/drewcovi/ember-cli-stylus) to your NPM
modules:

{% highlight bash %}
ember install ember-cli-stylus
{% endhighlight %}

### CoffeeScript

To enable [CoffeeScript](http://coffeescript.org/), you must
first add [ember-cli-coffeescript](https://github.com/kimroen/ember-cli-coffeescript) to your
NPM modules:

{% highlight bash %}
ember install ember-cli-coffeescript
{% endhighlight %}

The modified `package.json` should be checked into source control. CoffeeScript
can be used in your app's source and in tests, just use the `.coffee` extension
on any file.

The ES6 module transpiler does not directly support CoffeeScript, but using them
together is simple. Use the `` ` `` character to escape out to JavaScript from
your `.coffee` files, and use the ES6 syntax there:

{% highlight coffeescript linenos %}
# app/models/post.coffee
`import Ember from 'ember'`
`import User from 'appkit/models/user'`

Post = Ember.Object.extend
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
npm install broccoli-ember-script --save-dev
{% endhighlight %}

Note that the ES6 module transpiler is not directly supported with Emberscript, to allow use of ES6 modules use the `` ` `` character to escape raw Javascript similar to the CoffeeScript example above.

### Emblem

For [Emblem](http://emblemjs.com/), run the following commands:

{% highlight bash %}
ember install ember-cli-emblem
{% endhighlight %}

If you're using the older broccoli-emblem-compiler addon, you need to switch to ember-cli-emblem. The older broccoli-emblem-compiler compiles directly to JS instead of Handlebars and therefore is broken on all newer version of HTMLBars.

### Fingerprinting and CDN URLs

Fingerprinting is done using the addon
[broccoli-asset-rev](https://github.com/rickharrison/broccoli-asset-rev)
(which is included by default).

When the environment is production (e.g. `ember build --environment=production`),
the addon will automatically fingerprint your js, css, png, jpg, and gif assets
by appending an md5 checksum to the end of their filename
(e.g. `assets/yourapp-9c2cbd818d09a4a742406c6cb8219b3b.js`). In addition, your
html, js, and css files will be re-written to include the new name. There are
a few options you can pass in to `EmberApp` in your `ember-cli-build.js` to customize
this behavior.

* `enabled` - Default: `app.env === 'production'` - Boolean. Enables fingerprinting
if true. **True by default if current environment is production.**
* `exclude` - Default: `[]` - An array of strings. If a filename contains any
item in the exclude array, it will not be fingerprinted.
* `ignore` - Default: `[]` - An array of strings.  If a filename contains any item in the
ignore array, the contents of the file will not be processed for fingerprinting.
* `extensions` - Default: `['js', 'css', 'png', 'jpg', 'gif', 'map']` - The file types
to add md5 checksums.
* `prepend` - Default: `''` - A string to prepend to all of the assets. Useful
for CDN urls like `https://subdomain.cloudfront.net/`
* `replaceExtensions` - Default: `['html', 'css', 'js']` - The file types to
replace source code with new checksum file names.
* `customHash` - When specified, this is appended to fingerprinted filenames instead
of the md5. Pass `null` to suppress the hash, which can be useful when using `prepend`.

As an example, this `ember-cli-build` will exclude any file in the fonts/169929
directory as well as add a cloudfront domain to each fingerprinted asset.

{% highlight javascript linenos %}
var app = new EmberApp({
  fingerprint: {
    exclude: ['fonts/169929'],
    prepend: 'https://subdomain.cloudfront.net/'
  }
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

You can disable fingerprinting in your `ember-cli-build.js`:

{% highlight javascript %}
var app = new EmberApp({
  fingerprint: {
    enabled: false
  }
});
{% endhighlight %}

Or remove the entry from your `EmberApp` and  `broccoli-asset-rev`
from your `package.json`.

### Application Configuration

Application configurations from your `ember-cli-build.js` file will be stored inside a
special meta tag in `dist/index.html`.

sample meta tag:

{% highlight javascript %}
<meta name="user/config/environment" content="%7B%22modulePre.your.config">
{% endhighlight %}

This meta tag is required for your ember application to function properly.
If you prefer to have this tag be part of your compiled javascript files
instead, you may use the `storeConfigInMeta` flag in `ember-cli-build.js`.

{% highlight javascript %}
var app = new EmberApp({
  storeConfigInMeta: false
});
{% endhighlight %}

#### Configuring output paths

The compiled files are output to the following paths:

|Assets|Output File|
|---|---|
|`app/index.html`|`/index.html`|
|`app/*.js`|`/assets/application-name.js`|
|`app/styles/app.css`|`/assets/application-name.css`|
|other CSS files in `app/styles`|same filename in `/assets`|
|JavaScript files you import with `app.import()`|`/assets/vendor.js`|
|CSS files you import with `app.import()`|`/assets/vendor.css`|

To change these paths, specify the `outputPaths` config option in `ember-cli-build.js`. The default setting is shown here:

{% highlight javascript %}
var app = new EmberApp({
  outputPaths: {
    app: {
      html: 'index.html',
      css: {
        'app': '/assets/application-name.css'
      },
      js: '/assets/application-name.js'
    },
    vendor: {
      css: '/assets/vendor.css',
      js: '/assets/vendor.js'
    }
  }
});
{% endhighlight %}

You may edit any of these output paths, but make sure to update your `app.outputPaths.app.html`, default it is `index.html`, and `tests/index.html`.

{% highlight javascript %}
var app = new EmberApp({
  outputPaths: {
    app: {
      js: '/assets/main.js'
    }
  }
});
{% endhighlight %}

The `outputPaths.app.css` option uses a key value relationship. The *key* is the input file and the *value* is the output location. Note that we do not include the extension for the input path, because each preprocessor has a different extension.

When using CSS preprocessing, only the `app/styles/app.scss` (or `.less` etc) is compiled. If you need to process multiple files, you must add another key:

{% highlight javascript %}
var app = new EmberApp({
  outputPaths: {
    app: {
      css: {
        'app': '/assets/application-name.css',
        'themes/alpha': '/assets/themes/alpha.css'
      }
    }
  }
});
{% endhighlight %}

#### Integration

When using Ember inside another project, you may want to launch Ember only when a specific route is accessed. If you're preloading the Ember javascript before you access the route, you have to disable `autoRun`:

{% highlight javascript %}
var app = new EmberApp({
  autoRun: false
});
{% endhighlight %}

To manually run Ember:
`require("app-name/app")["default"].create({/* app settings */});`

#### Subresource integrity

SRI calculation is done using the addon
[ember-cli-sri](https://github.com/jonathanKingston/ember-cli-sri)
(which is included by default).

This plugin is used to generate [SRI integrity](http://www.w3.org/TR/SRI/) for your applications.
Subresource integrity is a security concept used to check JavaScript and stylesheets are loaded with the correct content when using a CDN.

#### Why
The reason to add this to your application is to protect against poisoned CDNs breaking JavaScript or CSS.

- [JavaScript DDoS prevention](https://blog.cloudflare.com/an-introduction-to-javascript-based-ddos/)
  - The latest [GitHub DDoS attack](http://googleonlinesecurity.blogspot.co.uk/2015/04/a-javascript-based-ddos-attack-as-seen.html)
- Protection against corrupted code on less trusted servers

#### Customize

To customize SRI generation see: [ember-cli-sri](https://github.com/jonathanKingston/ember-cli-sri)
