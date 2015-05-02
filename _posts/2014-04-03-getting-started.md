---
layout: post
title: "Getting Started"
permalink: getting-started
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2014-04-03-getting-started.md"
---

### Prerequisites

#### Node

First, install the latest stable version of Node (version 0.12.x).

To do so, either follow the installation instructions on
[nodejs.org](http://nodejs.org/), or use your preferred package manager (such
as Homebrew on OS X) if you have one.

After installing Node, verify that Node is set up correctly by typing the
following commands on the command line. Both should output help messages:

{% highlight bash %}
node --help
npm --help
{% endhighlight %}

#### Ember CLI

Once you've installed Node, you'll need to install the Ember CLI globally with:

{% highlight bash %}
npm install -g ember-cli
{% endhighlight %}

This will give you access to the `ember` command-line runner.

#### Bower

You'll need to install [Bower](http://bower.io), a package manager that keeps
your front-end dependencies (including JQuery, Ember, and QUnit) up to date.
This is as easy as running:

{% highlight bash %}
npm install -g bower
{% endhighlight %}

This will give you access to the `bower` command-line runner.

#### Watchman

On OSX and UNIX-like operating systems, we recommended installing
[Watchman](https://facebook.github.io/watchman/) version 3.x, which provides
a more effective way for ember-cli to watch for project changes by hooking
into your system's native filesystem events.

{% highlight bash %}
brew install watchman
{% endhighlight %}

OSX filewatching has issues that can result in it easily entering a broken state,
while Node's built in `NodeWatcher` has trouble observing large trees. Watchman
is developed and used by Facebook to make file-watching work even on extremely massive
file trees.  You can read more about their motivations in their [announcement here](https://www.facebook.com/notes/facebook-engineering/watchman-faster-builds-with-large-source-trees/10151457195103920).

For complete installation instructions refer to the docs on the [watchman website](https://facebook.github.io/watchman/).

When Watchman is not installed, you will see this notice which can be safely ignored.

{% highlight bash %}
Could not find watchman, falling back to NodeWatcher for file system events
{% endhighlight %}

There is also a conflicting `npm` package named `watchman`, so make sure that
it is not in your `PATH` to avoid conflicts.  If the `npm` package is installed, you may see the
following warning.

{% highlight bash %}
invalid watchman found, version: [2.9.8] did not satisfy [^3.0.0], falling back to NodeWatcher
{% endhighlight %}

The following command will let you inspect which watchmans you have.

{% highlight bash %}
which -a watchman
{% endhighlight %}

If you have installed the wrong watchman, you can use npm uninstall to remove it.

{% highlight bash %}
npm uninstall -g watchman
{% endhighlight %}

#### PhantomJS

You can use the automated test runner of your choice with Ember CLI, however most testing
services will recommend or require [PhantomJS](http://phantomjs.org/), which you can install
via [npm](https://www.npmjs.org/).

PhantomJS is the default test runner for [Testem](https://github.com/airportyh/testem) and [Karma](http://karma-runner.github.io/0.12/index.html).

If you want to use PhantomJS to run your integration tests, it needs to be installed globally.

{% highlight bash %}
npm install -g phantomjs
{% endhighlight %}

### Create a new project

Run the generator for your project:

{% highlight bash %}
ember new my-new-app
{% endhighlight %}

This will create a new `my-new-app` folder and generate an application structure for you.

Once the generation process finishes, launch the app:

{% highlight bash %}
cd my-new-app
npm install && bower install
ember server
{% endhighlight %}

navigate to `http://localhost:4200` to see your new app in action.

navigate to `http://localhost:4200/tests` to see your test results in action.

#### Migrating an existing project that doesn't yet use Ember CLI

If your app uses Ember App Kit, there is a [migration guide](https://github.com/stefanpenner/ember-app-kit#migrating-to-ember-cli) located
on the README.

If your app uses globals (e.g. `App.Post`) from a different build pipeline such as Grunt, Ember-Rails, or Gulp,
you can try using the [Ember CLI migrator](https://github.com/fivetanley/ember-cli-migrator). The
Ember CLI migrator is a command line tool that looks at your JavaScript code using
a JavaScript parser and rewrites your code to ES6 following Ember CLI's conventions.
The migrator keeps your code style and keeps git history available via
`git log --follow`.

#### Cloning an existing project

Alternatively, if you are checking out an existing Ember project created with ember-cli,
you will need to install dependencies yourself before running the server:

{% highlight bash %}
git clone git@github.com:me/my-app.git
cd my-app && ember install
ember server
{% endhighlight %}

### Using Ember CLI

 Command                                     | Purpose
 :------------------------------------------ | :-------
 `ember`                                     | Prints out a list of available commands.
 `ember new <app-name>`                      | Creates a folder called `<app-name>` and generates an application structure for you.  If git is available the folder will be initialized as a git repository and an initial commit will be created.  Use  `--skip-git` flag to disable this feature.
 `ember init`                                | Generates an application structure for you in the current folder.
 `ember build`                               | Builds the application to `dist/` directory (customize via `--output-path` flag). Use `--environment` flag to specify the environment to build for (defaults to `development`). Use `--watch` flag keep the process running, observing the filesystem and rebuilding when changes occur.
 `ember server`                              | Starts up the server. Default port is `4200`. Use `--proxy` flag to proxy all ajax requests to the given address. For example `ember server --proxy http://127.0.0.1:8080` will proxy all your apps XHR to your server running at port 8080.
 <span style="white-space:nowrap">`ember generate <generator-name> <options>`</span> | Runs a specific generator. To see available generators, run `ember help generate`.
 `ember test`                                | Run tests with Testem on CI mode. You can pass any options to Testem through `testem.json`, by default we'll search for it under your project's root or you can specify `config-file`.
 `ember install`                             | Installs npm and bower dependencies
 `ember install:bower <packages>`            | Installs the given bower dependencies to your project and saves them to the `bower.json`
 `ember install <addon-name>`                | Installs the given addon to your project and saves it to the `package.json`. It will run the addon's `defaultBlueprint` if it provides one.

### Folder Layout

 File/folder         | Purpose
 :-------------      | :-------
 `app/`              | Contains your Ember application's code. Javascript files in this folder are *compiled* through the ES6 module transpiler and concatenated into a file called `app.js`. See the table below for more details.
 `dist/`             | Contains the *distributable* (that is, optimized and self-contained) output of your application. Deploy this to your server!
 `public/`           | This folder will be copied verbatim into the root of your built application. Use this for assets that don't have a build step, such as images or fonts.
 `tests/`            | Includes unit and integration tests for your app, as well as various helpers to load and run your tests.
 `tmp/`              | Various temporary output of build steps, as well as the debug output of your application (`tmp/public`).
 `bower_components/` | Your dependencies, both those included with `Ember CLI` and those installed with `Bower`.
 `vendor/`           | Your external dependencies not installed with `Bower` or `Npm`.
 `.jshintrc`         | [JSHint](http://jshint.com/) configuration.
 `.gitignore`        | Git configuration for ignored files.
 `Brocfile.js`       | Contains build specification for [Broccoli](https://github.com/joliss/broccoli).
 `bower.json`        | Bower configuration and dependency list. See [Managing Dependencies](managing-dependencies).
 `package.json`      | NPM configuration. Mainly used to list the dependencies needed for asset compilation.

### Layout within `app` folder

 File/folder    | Purpose
 :------------- | :-------
 `app/app.js` | Your application's entry point. This is the module that is first executed.
 `app/index.html` | The only actual page of your single-page app! Includes dependencies and kickstarts your Ember application. See [app/index.html](#appindexhtml).
 `app/router.js` | Your route configuration. The routes defined here correspond to routes in `app/routes/`.
 `app/styles/` | Contains your stylesheets, whether SASS, LESS, Stylus, Compass, or plain CSS (though only one type is allowed, see [Asset Compilation](#asset-compilation)). These are all compiled into `app.css`.
 `app/templates/` | Your Handlebars templates. These are compiled to `templates.js`. The templates are named the same as their filename, minus the extension (i.e. `templates/foo/bar.hbs` -> `foo/bar`).
 `app/controllers/`, `app/models/`, etc. | Modules resolved by the Ember CLI resolver. See [Using Modules &amp; the Resolver](using-modules).

[PhantomJS]: http://phantomjs.org
[homebrew]: http://brew.sh

#### `app/index.html`

The `app/index.html` file lays the foundation for your application.  This is where the basic DOM structure is laid out, the title attribute is set and stylesheet/javascript includes are done.  In addition to this, `app/index.html` includes multiple hooks - `{% raw %}{{content-for 'head'}}{% endraw %}` and `{% raw %}{{content-for 'body'}}{% endraw %}` - that can be used by [Add-ons](#add-ons) to inject content into your application's `head` or `body`.  These hooks need to be left in place for your application to function properly, but they can be safely ignored unless you are working directly with a particular add-on.

### Add-Ons

Add-ons are registered in NPM with a keyword of `ember-addon`. See a full list of existing add-ons registered in NPM [here](https://www.npmjs.org/browse/keyword/ember-addon).
