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

Ember CLI supports plain CSS out of the box. To use a CSS preprocessor, you'll
need to install the appropriate [Broccoli](https://github.com/joliss/broccoli)
plugin. By default, the Broccoli plugins are configured to simply compile all
of the `*.less*`, `*.scss`, or `*.styl` files in `app/styles` to
`assets/app.css` in your output.

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
[broccoli-stylus](https://github.com/sindresorhus/broccoli-stylus) to your NPM
modules:

{% highlight bash %}
npm install --save-dev broccoli-stylus
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

### Emblem

For Emblem, run the following commands:

{% highlight bash %}
npm install --save-dev broccoli-emblem-compiler && bower install emblem.js --save
{% endhighlight %}
