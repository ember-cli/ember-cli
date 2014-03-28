---
layout: default
title: "Asset Compilation"
permalink: asset-compilation.html
---

### Raw Assets

* `public/assets` vs `app/styles`

For adding images, fonts, or other assets use the `public/assets` folder. For
example you can do `public/assets/images`, and in your templates using
`/assets/images/logo.png` or from stylesheets using
`url('/assets/images/background.jpg')`.

### Stylesheets

Ember App Kit supports, out of the box, the most popular CSS preprocessors, as
well as just raw CSS. You'll need to install the appropriate Grunt plugin. By
default, the grunt tasks are configured to simply compile all of the `*.less*`,
`*.scss`, or `*.styl` files in `app/styles` to `app.css` in your output.

#### CSS

* Relative pathing gets changed (how to customize?)
* `@import` statements -> concat

#### LESS

To enable [LESS](http://lesscss.org/), you'll need to add `broccoli-less-single`
to your NPM modules.

```
npm install --save-dev broccoli-less-single
```

#### SASS

To enable [Sass](http://sass-lang.com/) *(SCSS without Sass)*, you'll need to
add `broccoli-sass` to your NPM modules.

```
npm install --save-dev broccoli-sass
```

#### Stylus

To enable [Stylus](http://learnboost.github.io/stylus/), you must first add
`broccoli-stylus` to your NPM modules:

```
npm install --save-dev broccoli-stylus
```

### CoffeeScript

To enable [CoffeeScript](http://coffeescript.org/), you must
first add `broccoli-coffee` to your NPM modules:

```
npm install --save-dev broccoli-coffee
```

The modified `package.json` should be checked into source control. CoffeeScript
can be used in your app's source and in tests, just use the `.coffee` extension
on any file.

The ES6 module transpiler does not directly support CoffeeScript, but using them
together is simple. Use the `` ` `` character to escape out to JavaScript from
your `.coffee` files, and use the ES6 syntax there:

```coffee
# app/models/post.coffee
`import User from 'appkit/models/user'`

Post = Em.Object.extend
  init: (userId) ->
    @set 'user', User.findById(userId)

`export default Post`
```

Note that earlier versions of the transpiler had explicit support for
CoffeeScript, but that support has been removed.

### Emblem

For Emblem, run the following commands:

```
npm install --save-dev broccoli-emblem-compiler
bower install emblem.js --save
```
