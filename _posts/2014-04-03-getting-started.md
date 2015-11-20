---
layout: post
title: "Getting Started"
permalink: getting-started
category: user-guide
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2014-04-03-getting-started.md"
---

### Prerequisites

#### Node

First, install the latest stable version of Node (version 4.0.x).

To do so, either follow the installation instructions on
[nodejs.org](http://nodejs.org/), or use your preferred package manager (such
as [Homebrew](http://brew.sh/) on OSX) if you have one.

After the installation is complete, verify that Node is set up correctly by
typing the below commands on the command line. Both should output a version
number:

{% highlight bash %}
node -v
npm -v
{% endhighlight %}

#### Ember CLI

Once you've installed Node, you'll need to globally install Ember CLI:

{% highlight bash %}
npm install -g ember-cli
{% endhighlight %}

This will give you access to the `ember` command-line runner.

#### Bower

You'll need to globally install [Bower](http://bower.io), a package manager that keeps your front-end dependencies (including jQuery, Ember, and QUnit) up-to-date:

{% highlight bash %}
npm install -g bower
{% endhighlight %}

This will give you access to the `bower` command-line runner.

#### Watchman

On OSX and UNIX-like operating systems, we recommend installing [Watchman](https://facebook.github.io/watchman/)
version 3.x, which provides Ember CLI a more effective way for watching project changes.

File-watching on OSX is error-prone and Node's built-in `NodeWatcher` has trouble
observing large trees. [Watchman](https://facebook.github.io/watchman/) on the other hand, solves these problems and
performs well on extremely massive file trees. You can read more about Facebook's motivations [here](https://www.facebook.com/notes/facebook-engineering/watchman-faster-builds-with-large-source-trees/10151457195103920).

On OSX, you can install Watchman using [Homebrew](http://brew.sh/):

{% highlight bash %}
brew install watchman
{% endhighlight %}

For complete installation instructions, refer to the docs on the [Watchman website](https://facebook.github.io/watchman/). Note, there exists a similarly named `npm` package (watchman) which is __not__ the intended installation. If you have this package installed you may see the following warning:

{% highlight bash %}
invalid watchman found, version: [2.9.8] did not satisfy [^3.0.0], falling back to NodeWatcher
{% endhighlight %}

If you intend on using the `npm` version for another purpose, make sure it's not on your `PATH` otherwise, remove it using:

{% highlight bash %}
npm uninstall -g watchman
{% endhighlight %}

When in doubt, use the following command to inspect which Watchman(s) you have:

{% highlight bash %}
which -a watchman
{% endhighlight %}

Lastly, when Watchman is not installed, a notice is displayed when invoking various commands.  You can safely ignore this message:

{% highlight bash %}
Could not find watchman, falling back to NodeWatcher for file system events
{% endhighlight %}

#### PhantomJS

With Ember CLI, you can use the automated test runner of your choice, however
most testing services will recommend or require [PhantomJS](http://phantomjs.org/), which you can install
via [npm](https://www.npmjs.com/package/phantomjs) or the [PhantomJS website](http://phantomjs.org).  Note, PhantomJS is the default test runner for [Testem](https://github.com/airportyh/testem) and [Karma](http://karma-runner.github.io/0.12/index.html).

If you want to use PhantomJS to run your integration tests, it must be globally installed:

{% highlight bash %}
npm install -g phantomjs
{% endhighlight %}

#### Create a new project

Run the `new` command along with the desired app name to create a new project:

{% highlight bash %}
ember new my-new-app
{% endhighlight %}

Ember CLI will create a new `my-new-app` directory and in it, generate the application structure.

Once the generation process is complete, launch the app:

{% highlight bash %}
cd my-new-app
ember server
{% endhighlight %}

Navigate to `http://localhost:4200` to see your new app in action.

Navigate to `http://localhost:4200/tests` to see your test results in action.

#### Migrating an existing Ember project that doesn't use Ember CLI

If your app uses the deprecated Ember App Kit, there is a [migration guide](https://github.com/stefanpenner/ember-app-kit#migrating-to-ember-cli) located
on the README.

If your app uses globals (e.g. `App.Post`) from a different build pipeline such as Grunt, Ember-Rails, or Gulp,
you can try using the [Ember CLI migrator](https://github.com/fivetanley/ember-cli-migrator). The
Ember CLI migrator is a command line tool that looks at your JavaScript code using
a JavaScript parser and rewrites it to ES6 following Ember CLI's conventions.
The migrator keeps your code style and keeps git history available via
`git log --follow`.

#### Cloning an existing project

If you are checking out an existing Ember CLI-based project, you will need to
install `npm` and `bower` dependencies before running the server:

{% highlight bash %}
git clone git@github.com:me/my-app.git
cd my-app
npm install
bower install
ember server
{% endhighlight %}

### Using Ember CLI

 Command                                     | Purpose
 :------------------------------------------ | :-------
 `ember`                                     | Prints out a list of available commands.
 `ember new <app-name>`                      | Creates a directory called `<app-name>` and in it, generates an application structure.  If git is available the directory will be initialized as a git repository and an initial commit will be created.  Use  `--skip-git` flag to disable this feature.
 `ember init`                                | Generates an application structure in the current directory.
 `ember build`                               | Builds the application into the `dist/` directory (customize via the `--output-path` flag). Use the `--environment` flag to specify the build environment (defaults to `development`). Use the `--watch` flag to keep the process running and rebuilding when changes occur.
 `ember server`                              | Starts the server. The default port is `4200`. Use the `--proxy` flag to proxy all ajax requests to the given address. For example, `ember server --proxy http://127.0.0.1:8080` will proxy all ajax requests to the server running at `http://127.0.0.1:8080`.
 <span style="white-space:nowrap">`ember generate <generator-name> <options>`</span> | Runs a specific generator. To see available generators, run `ember help generate`.
 <span style="white-space:nowrap">`ember destroy <generator-name> <options>`</span> | Removes code created by the `generate` command.  If the code was generated with the `--pod` flag, you must use the same flag when running the `destroy` command.
 `ember test`                                | Run tests with Testem in CI mode. You can pass any options to Testem through a `testem.json` file. By default, Ember CLI will search for it under your project's root. Alternatively, you can specify a `config-file`.
 `ember install <addon-name>`                | Installs the given addon into your project and saves it to the `package.json` file. If provided, the command will run the addon's default [blueprint](http://www.ember-cli.com/extending/#generators-and-blueprints).

### Folder Layout

 File/directory         | Purpose
 :-------------      | :-------
 `app/`              | Contains your Ember application's code. Javascript files in this directory are *compiled* through the ES6 module transpiler and concatenated into a file called `<app-name>.js`. See the table below for more details.
 `dist/`             | Contains the *distributable* (optimized and self-contained) output of your application. Deploy this to your server!
 `public/`           | This directory will be copied verbatim into the root of your built application. Use this for assets that don't have a build step, such as images or fonts.
 `tests/`            | Includes your app's unit and integration tests, as well as various helpers to load and run the tests.
 `tmp/`              | Temporary application build-step and debug output.
 `bower_components/` | `Bower` dependencies (both default and user-installed).
 `node_modules/`     | `npm` dependencies (both default and user-installed).
 `vendor/`           | Your external dependencies not installed with `Bower` or `npm`.
 `.jshintrc`         | [JSHint](http://jshint.com/) configuration.
 `.gitignore`        | Git configuration for ignored files.
 `ember-cli-build.js` | Contains the build specification for [Broccoli](https://github.com/joliss/broccoli).
 `bower.json`        | Bower configuration and dependency list. See [Managing Dependencies](#managing-dependencies).
 `package.json`      | npm configuration and dependency list. Mainly used to list the dependencies needed for asset compilation.

### Layout within `app` directory

 File/directory    | Purpose
 :------------- | :-------
 `app/app.js` | Your application's entry point. This is the first executed module.
 `app/index.html` | The only page of your single-page app! Includes dependencies, and kickstarts your Ember application. See [app/index.html](#appindexhtml).
 `app/router.js` | Your route configuration. The routes defined here correspond to routes in `app/routes/`.
 `app/styles/` | Contains your stylesheets, whether SASS, LESS, Stylus, Compass, or plain CSS (though only one type is allowed, see [Asset Compilation](#asset-compilation)). These are all compiled into `<app-name>.css`.
 `app/templates/` | Your HTMLBars templates. These are compiled to `/dist/assets/<app-name>.js`. The templates are named the same as their filename, minus the extension (i.e. `templates/foo/bar.hbs` -> `foo/bar`).
 `app/controllers/`, `app/models/`, etc. | Modules resolved by the Ember CLI resolver. See [Using Modules &amp; the Resolver](#using-modules).

[PhantomJS]: http://phantomjs.org
[Homebrew]: http://brew.sh

#### `app/index.html`

The `app/index.html` file lays the foundation for your application. This is where the basic DOM structure is laid out, the title attribute is set, and stylesheet/javascript includes are done. In addition to this, `app/index.html` includes multiple hooks - `{% raw %}{{content-for 'head'}}{% endraw %}` and `{% raw %}{{content-for 'body'}}{% endraw %}` - that can be used by [addons](#addons) to inject content into your application's `head` or `body`. These hooks need to be left in place for your application to function properly however, they can be safely ignored unless you are directly working with a particular addon.

### Addons

Addons are registered in npm with a keyword of `ember-addon`. See a full list of existing addons registered in NPM [here](https://www.npmjs.org/browse/keyword/ember-addon).

### Developing on a subpath

If your app isn't running on the root URL (`/`), but on a subpath (like `/my-app/`), your app will only be accessible on `/my-app/` and not on `/my-app`, too. Sometimes, this can be a bit annoying. Therefore you should take the following snippet as an example for a simple route which takes you to the right URL if you've entered the wrong one:

{% highlight javascript %}
app.get('/my-app', function(req, res, next) {

  if (req.path != '/my-app/') {
    res.redirect('/my-app/');
  } else {
    next();
  }

});
{% endhighlight %}

Just place it within the `index.js` file of your app's `/server` directory (so that it gets applied when the ember-cli development server is being started). The snippet simply tests if the URL that is beeing accessed begins with `/my-app/`. And if it doesn't, you'll get redirected. Otherwise, the redirection will be skipped.
