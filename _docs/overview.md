---
layout: docs
title: "Overview"
permalink: /docs/overview/
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2014-04-05-overview.md"
---

Ember CLI is an [Ember.js](http://emberjs.com) command line utility which provides a fast asset pipeline powered by [broccoli](https://github.com/joliss/broccoli) and strong conventional project structure. 

Ember CLI was based on the [Ember App Kit Project](https://github.com/stefanpenner/ember-app-kit) which is now deprecated.

### Assets Compilation

Ember CLI asset compilation is based on [broccoli](https://github.com/joliss/broccoli).

Broccoli has support for:

* [Handlebars](http://handlebarsjs.com)
* [Emblem](http://emblemjs.com)
* [LESS](http://lesscss.org/)
* [SASS](http://sass-lang.com/)
* [Compass](http://compass-style.org/)
* [Stylus](http://learnboost.github.io/stylus/)
* [CoffeeScript](http://coffeescript.org/)
* [EmberScript](http://emberscript.com/)
* Minified JS & CSS

You can find a list of available plugins [here](https://github.com/joliss/broccoli#plugins).

All of this compilation happens in the background while you're developing,
rebuilding each time you change a file.

### Modules

Ember CLI uses the [ES6 Module Transpiler](https://github.com/square/es6-module-transpiler),
which turns [ES6 module syntax](http://wiki.ecmascript.org/doku.php?id=harmony:modules#quick_examples)
into AMD (RequireJS-style) modules. Using the transpiler, you can write code
using tomorrow's syntax, today.

In the past, building an Ember application with any sort of module system
required you to wire up lots of pieces manually. Now, with the custom resolver included
in Ember CLI, your modules are automatically imported when needed. For example, your
route in `routes/post.js` will know to use the controller in `controllers/post.js`
and the template in `templates/post.hbs`. Of course, if your application does need
to explicitly include a module, it's only an `import` statement away.

### Testing using CLI

All apps built with Ember CLI are preconfigured to use [QUnit](http://qunitjs.com/),
the [Ember Testing](http://emberjs.com/guides/testing/integration/) package, and
the [Ember QUnit](https://github.com/rpflorence/ember-qunit). These tools,
along with the same module system as your application, make both unit and
integration tests a breeze to write.

### Dependency Management

Ember CLI uses the [Bower package manager](http://bower.io/), making it easy
to keep your front-end dependencies up to date. [NPM](http://npmjs.org)
is used to manage internal dependencies but you can also use it to introduce your own.

### Runtime Configuration
Ember CLI can use a configuration file named .ember-cli in your home directory.
In this file you can include any command-line options in a json file with
the commands camelized; as in the following example:
{% highlight bash %}
# ~/.ember-cli
{
  "skipGit" : true,
  "port" : 999,
  "host" : "0.1.0.1",
  "liveReload" : true,
  "environment" : "mock-development",
  "checkForUpdates" : false
}
{% endhighlight %}


### Content security policy

Ember CLI comes bundled with the [ember-cli-content-security-policy](https://github.com/rwjblue/ember-cli-content-security-policy) 
addon which enables the [Content Security Policy](http://content-security-policy.com/) in modern browsers 
when running the development server. When enabled, the Content Security Policy guards your application against the risks of XSS attacks. 
While [browser support](http://caniuse.com/#feat=contentsecuritypolicy) is still limited, ember-cli makes it easy to build your app
with the CSP in mind. This means enabling it on your production stack will mean little more than [adding the correct header](#deploy-content-security-policy).

### Community

Ember CLI is still very much WIP. It's an ongoing community effort. We welcome your
issues and PRs for features, bug fixes, and anything that would improve your quality
of life as an Ember developer.

Talk to us here:

* irc: #ember-cli on freenode
* issues: [ember-cli/issues](https://github.com/stefanpenner/ember-cli/issues)

### Node

Currently, Ember CLI supports node 0.10.5 and npm 1.4.6.
