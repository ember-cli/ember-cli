---
layout: post
title: "Getting Started"
permalink: getting-started
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2014-04-03-getting-started.md"
---

### Prerequisites

If you don't already have Node installed, you can get it from
[nodejs.org](http://nodejs.org/) or your package manager of choice (including
[Homebrew](http://brew.sh/) on OSX).

Once you've installed Node, you'll need to install the Ember CLI globally with:

{% highlight bash %}
npm install -g ember-cli
{% endhighlight %}

This will give you access to the `ember` command-line runner.

You'll need to install [Bower](http://bower.io), a package manager that keeps
your front-end dependencies (including JQuery, Ember, and QUnit) up to date.
This is as easy as running:

{% highlight bash %}
npm install -g bower
{% endhighlight %}

This will give you access to the `bower` command-line runner.

Next, you will need to run the generator for your project:

{% highlight bash %}
ember new my-new-app
{% endhighlight %}

This will create a new `my-new-app` folder and generate an application structure for you.

Once the generation process finishes, launch the app:

{% highlight bash %}
cd my-new-app && ember server
{% endhighlight %}

and navigate to [http://0.0.0.0:4200](http://0.0.0.0:4200) to see your new app in action.

### Using Ember CLI

`ember`

Prints out a list of available commands.

`ember new <app-name>`

Creates a folder called `<app-name>` and generates an application structure for you.

`ember init`

Generates an application structure for you in the current folder.

`ember build`

Builds the application depending on the environment.

`ember server`

Starts up the server. Default port is `4200`.

`ember generate <generator-name> <options>`

Runs a specific generator. See [cavneb/loom-generators-ember-appkit](https://github.com/cavneb/loom-generators-ember-appkit)
for available generators.

### Default Flags

You can provide default flags by creating a file in your project's root called `.ember-cli`. For example, say I have a file called `.ember-cli` with the contents:

{% highlight bash %}
--proxy-port 3000
{% endhighlight %}

Any time I run `ember server` it will always work as if I had run `ember server --proxy-port 3000`. This works with any flag for any command.

### Folder Layout

`app/`

Contains your Ember application's code. Javascript files in this folder are *compiled* through
the ES6 module transpiler and concatenated into a file called `app.js`. See the table below for more details.

`dist/`

Contains the *distributable* (that is, optimized and self-contained) output of your application. Deploy this to your server!

`public/`

This folder will be copied verbatim into the root of your built application. Use this for assets that don't have a build step, such as images or fonts.

`tests/`

Includes unit and integration tests for your app, as well as various helpers to load and run your tests.

`tmp/`

Various temporary output of build steps, as well as the debug output of your application (`tmp/public`).

`vendor/`

Your dependencies, both those included with EAK and those installed with Bower.

`.jshintrc`

[JSHint](http://jshint.com/) configuration.

`.gitignore`

Git configuration for ignored files.

`Brocfile.js`

Contains build specification for [Broccoli](https://github.com/joliss/broccoli).

`bower.json`

Bower configuration and dependency list. See [Managing Dependencies](managing-dependencies).

`package.json`

NPM configuration. Mainly used to list the dependencies needed for asset compilation.

### Layout within `app` folder

`app/app.js`

Your application's entry point. This is the module that is first executed.

`app/index.html`

The only actual page of your single-page app! Includes dependencies and kickstarts your Ember application.

`app/router.js`

Your route configuration. The routes defined here correspond to routes in `app/routes/`.

`app/styles/`

Contains your stylesheets, whether SASS, LESS, Stylus, Compass, or plain CSS
(though only one type is allowed, see [Asset Compilation](asset-compilation)).
These are all compiled into `app.css`.

`app/templates/`

Your Handlebars templates. These are compiled to `templates.js`.
The templates are named the same as their filename, minus the extension (i.e. `templates/foo/bar.hbs` -> `foo/bar`).

`app/controllers/`, `app/models/`, etc

Modules resolved by the Ember CLI resolver. See [Using Modules &amp; the Resolver](using-modules).
