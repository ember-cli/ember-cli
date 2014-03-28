---
layout: default
title: "Overview"
permalink: index.html
---

Ember CLI is an [Ember.js](http://emberjs.com) command line utility. It is based on
the [Ember App Kit](https://github.com/stefanpenner/ember-app-kit) project that was
intended to be an ideal project template (structure) for Ember.js projects. It has
proved to be very useful. It allowed users to quickly iterate while building real
ambitious applications.

The goal for Ember CLI is to eventually replace Ember App Kit with a faster [broccoli](https://github.com/joliss/broccoli)
pipeline and strong conventions in place.

### Asset Compilation

Ember CLI asset compilation is based on [broccoli](https://github.com/joliss/broccoli).

Broccoli has support for:

* Handlebars or Emblem templates
* [LESS](http://lesscss.org/) (or [SASS](http://sass-lang.com/), or
[Compass](http://compass-style.org/), or [Stylus](http://learnboost.github.io/stylus/)...)
* [CoffeeScript](http://coffeescript.org/)
* Minified JS & CSS

You can find a list of available plugins [here](https://github.com/joliss/broccoli#plugins).

All of this compilation happens in the background while you're developing,
rebuilding each time you change a file.

### Modules

Ember App Kit uses the [ES6 Module Transpiler](https://github.com/square/es6-module-transpiler),
which turns [ES6 module syntax](http://wiki.ecmascript.org/doku.php?id=harmony:modules#quick_examples)
into AMD (RequireJS-style) modules. Using the transpiler, you can write code
using tomorrow's syntax, today.

In the past, building an Ember application with any sort of module system
required lots of manual wiring-up of pieces. With the custom resolver included
in Ember App Kit, though, your modules are automatically used when needed. Your
route in `routes/post.js` will know to use the controller in `controllers/post.js`
and the template in `templates/post.hbs`. Of course, if your application does need
to explicitly include a module, it's only an `import` statement away.

### Testing

All apps built with EAK are preconfigured to use [QUnit](http://qunitjs.com/),
the [Ember Testing](http://emberjs.com/guides/testing/integration/) package, and
the [Ember QUnit](https://github.com/rpflorence/ember-qunit). These tools,
along with the same module system as your application, make both unit and
integration tests a breeze to write.

### Dependency Management

Ember App Kit uses the [Bower package manager](http://bower.io/), making it easy
to keep your front-end dependencies up to date.

### And More

Ember CLI is still very much WIP. It's an ongoing community effort. We welcome your
issues and PRs for features, bug fixes, and anything that would improve your quality
of life as an Ember developer.
