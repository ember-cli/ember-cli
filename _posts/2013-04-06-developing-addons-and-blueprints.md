---
layout: post
title: "Developing Addons and Blueprints"
permalink: developing-addons-and-blueprints
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-06-developing-addons-and-blueprints.md"
---
Addons make it possible to easily share common code between
applications. However, if an addon only covers a very project specific use-case, [an In-Repo Addon](#detailed-list-of-blueprints-and-their-use) could be considered instead.

This guide will walk through the development cycle of a fictional
addon `ember-cli-x-button`.

### Installation
An addon can be installed with the `install` command:

`ember install <package name>`

To install the (fictional) x-button addon package:

`ember install ember-cli-x-button`

### Discovery

Ember CLI will detect the presence of an addon by inspecting each of
your applications dependencies and search their `package.json` files
for the presence of `ember-addon` in the `keywords` section (see
below).

{% highlight javascript %}
"keywords": [
  "ember-addon",
  ...
]
{% endhighlight %}

### Addon scenarios

The Ember CLI addons API currently supports the following scenarios:

* Performing operations on the `EmberApp` created in the consuming application's `Brocfile.js`
* Adding preprocessors to the default registry
* Providing a custom application tree to be merged with the consuming application
* Providing custom express (server) middlewares
* Adding custom/extra blueprints, typically for scaffolding application/project files
* Adding content to consuming applications

### Addon CLI options

Ember CLI has an *addon* command with some options:


`ember addon <addon-name> <options...>`

Note: An addon can NOT be created inside an existing application.

### Create addon
To create a basic addon:

Running this command should generate something like the following:

{% highlight bash %}
ember addon ember-cli-x-button
version x.y.zz
installing
  create .bowerrc
  create .editorconfig
  create tests/dummy/.jshintrc
  ...
  create index.js

Installing packages for tooling via npm
Installed browser packages via Bower.
{% endhighlight %}

### Addon conventions
The addon infrastructure is based on *"convention over configuration"*
in accordance with the *Ember* philosophy. You are encouraged to
follow these conventions to make it easier on yourself and for others
to better understand your code. The same applies for addon blueprints.

### Addon project structure
The addon project created follows these structure conventions:

- `app/` - merged with the application's namespace.
- `addon/` - part of the addon's namespace.
- `blueprints/` - contains any blueprints that come with the addon, each in a separate folder
- `public/` - static files which will be available in the application as `/your-addon/*`
- `tests/` - test infrastructure including a "dummy" app and acceptance test helpers.
- `vendor/` - vendor specific files, such as stylesheets, fonts, external libs etc.
- `Brocfile.js` - Compilation configuration
- `package.json` - Node meta-data, dependencies etc.
- `index.js` - main Node entry point (as per npm conventions)

### Package.json
The generated addon `package.json` file looks something like this:

{% highlight javascript %}
{
  "name": "ember-cli-x-button", // addon name
  "version": "0.0.1", // version of addon
  "directories": {
    "doc": "doc",
    "test": "test"
  },
  "scripts": {
    "start": "ember server",
    "build": "ember build",
    "test": "ember test"
  },
  "repository": "https://github.com/repo-user/my-addon",
  "engines": {
    "node": ">= 0.10.0"
  },
  "keywords": [
    "ember-addon"
    // add more keywords to better categorize the addon
  ],
  "ember-addon": {
    // addon configuration properties
    "configPath": "tests/dummy/config"
  },
  "author": "", // your name
  "license": "MIT", // license
  "devDependencies": {
    "body-parser": "^1.2.0",
    ... // add specific dev dependencies here!
  }
}
{% endhighlight %}

Let's add some meta data to categorize the addon a little better:

{% highlight javascript %}
"keywords": [
  "ember-addon",
  "x-button",
  "button"
]
{% endhighlight %}

### Addon entry point
An addon will leverage the npm conventions, and look for an `index.js` as the entry point unless another entry point is specified via the `"main"` property in the `package.json` file. You are encouraged to use `index.js` as the addon entry point.

The generated `index.js` is a simple JavaScript Object (POJO) that you can customize and expand as you see fit.

{% highlight javascript %}
// index.js
module.exports = {
  name: 'ember-cli-x-button'
};
{% endhighlight %}

During the build process, the `included` hook on your addon will be called, allowing you to perform setup logic or modify the app or including addon:

{% highlight javascript %}
// index.js
module.exports = {
  name: 'ember-cli-x-button',
  included: function(app, parentAddon) {
    var target = (parentAddon || app);
    // Now you can modify the app / parentAddon. For example, if you wanted
    // to include a custom preprocessor, you could add it to the target's
    // registry:
    //
    //     target.registry.add('js', myPreprocessor);
  }
};
{% endhighlight %}

### Configuring your ember-addon properties

By default, the `"ember-addon"` hash in the `package.json` file has the `"configPath"` property defined to point to the `config` directory of the test dummy application. 

Optionally, you may specify whether your `ember-addon` must run `"before"` or `"after"` any other Ember CLI addons.  Both of these properties can take either a string or an array of strings, where the string is the name of the another Ember CLI addon, as defined in the `package.json` of the other addon.

Optionally, you may specify a different name for the `"defaultBlueprint"`. It defaults to the name in the `package.json`. This blueprint will be run automatically when your addon is installed with the `ember install` command.

{% highlight javascript %}
"ember-addon": {
  // addon configuration properties
  "configPath": "tests/dummy/config",
  "before": "single-addon",
  "defaultBlueprint": "blueprint-that-isnt-package-name",
  "after": [
    "after-addon-1",
    "after-addon-2"
  ]
}
{% endhighlight %} 

### Managing addon dependencies
Install your client side dependencies via Bower.
Here we install a fictional bower dependency `x-button`:

{% highlight bash %}
ember install:bower x-button
{% endhighlight %}

Note that currently this will add the component to the main `dependencies` hash.
Move it to `devDependencies`.

{% highlight javascript %}
// bower.js
{
  "name": "ember-cli-x-button",
  "dependencies": {
    // ...
  },
  "devDependencies": {
    "x-button":  "^1.4.0"
  }
}
{% endhighlight %}

### Addon Brocfile

The addon's `Brocfile.js` is only used to configure the dummy application found in
`tests/dummy/`.  It is never referenced by applications which include the addon.

If you need to use `Brocfile.js`, you may have to specify paths relative to the
addon root directory.  For example to configure
[ember-cli-less](https://www.npmjs.org/package/ember-cli-less) to use `app.less`
in the dummy app:

{% highlight javascript %}
// Brocfile.js
var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

var app = new EmberAddon({
  lessOptions: {
    paths: ['tests/dummy/app/styles/'],
    outputFile: 'dummy.css'
  }
});

module.exports = app.toTree();
{% endhighlight %}

### Addon Components
The actual code for the addon goes in `addon/components/x-button.js`

{% highlight javascript %}
import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'button',

  setupXbutton: function() {
    // ...
  }.on('didInsertElement'),

  teardownXbutton: function() {
    this.get('x-button').destroy();
  }.on('willDestroyElement'),
});
{% endhighlight %}

In order to allow the consuming application to use the addon component in a template
directly you need to bridge the component via your addon's `app/components` directory.
Just import your component, and re-export it:

{% highlight javascript %}
// app/components/x-button.js

import Ember from 'ember';
import XButton from 'ember-cli-x-button/components/x-button';

export default XButton;
{% endhighlight %}

This setup allows others to modify the component by extending it while making
the component available in the consuming applications namespace. This means
anyone who installs your `x-button` addon can start using the component in their
templates with `{% raw %}{{x-button}}{% endraw %}` without any extra configuration.

### Default Blueprint
A blueprint with the same name as the addon (unless explicitly changed, see above) will
be automatically run after install (in development, it must be manually run after
linking). This is where you can tie your addon's bower dependencies into the client app
so that they actually get installed.

To create the blueprint, add the file `blueprints/ember-cli-x-button/index.js`.
This follows the usual Ember blueprints naming conventions.

{% highlight javascript %}
//blueprints/ember-cli-x-button/index.js
module.exports = {
  normalizeEntityName: function() {}, // no-op since we're just adding dependencies

  afterInstall: function() {
    return this.addBowerPackageToProject('x-button'); // is a promise
  }
};
{% endhighlight %}

### Importing Dependency Files 

As stated earlier the `included` hook on your addon's main entry point is run during
the build process. This is where you want to add `import` statements to actually
bring in the dependency files for inclusion. Note that this is a separate step from
adding the actual dependency itself---done in the default blueprint---which merely
makes the dependency available for inclusion.

{% highlight javascript %}
// index.js
module.exports = {
  name: 'ember-cli-x-button',

  included: function(app) {
    this._super.included(app);

    app.import(app.bowerDirectory + '/x-button/dist/js/x-button.js');
    app.import(app.bowerDirectory + '/x-button/dist/css/x-button.css');
  }
};
{% endhighlight %}

In the example file, the `included` hook is used. This hook is called
by the `EmberApp` constructor and gives access to the consuming
application as `app`. When the consuming application's `Brocfile.js`
is processed by Ember CLI to build/serve, the addon's `included`
function is called passing the `EmberApp` instance.

### Importing Static Files
To import static files such as images or fonts in the application
include them in `/public`. The consuming application will have access
to them via a directory with your addon's name.

For example, to add an image, save it in `/public/images/foo.png`. Then
from the consuming application access it as:

{% highlight css %}
  .foo {background: url("/your-addon/images/foo.png");}
{% endhighlight %}

### Content
If you want to add content to a page directly, you can use the `content-for` tag. An example of this is `{% raw %}{{content-for 'head'}}{% endraw %}` in `app/index.html`, which Ember CLI uses to insert it's own content at build time. Addons can access the `contentFor` hook to insert their own content.

{% highlight javascript %}
module.exports = {
  name: 'ember-cli-display-environment',

  contentFor: function(type, config) {
    if (type === 'environment') {
      return '<h1>' + config.environment + '</h1>';
    }
  }
};
{% endhighlight %}

This will insert the current environment the app is running under wherever `{% raw %}{{content-for 'environment'}}{% endraw %}` is placed. The `contentFor` function will be called for each `{% raw %}{{content-for}}{% endraw %}` tag in `index.html`.

### Advanced customization
If you want to go beyond the built in customizations or want/need more
advanced control in general, the following are some of the hooks
(keys) available for your addon Object in the `index.js` file. All
hooks expect a function as the value.

{% highlight javascript %}
includedCommands: function() {},
blueprintsPath: // return path as String
preBuild:
postBuild:
treeFor:
contentFor:
included:
postprocessTree:
serverMiddleware:
{% endhighlight %}

An example of advanced customization can be found [here](https://github.com/poetic/ember-cli-cordova/blob/master/index.js) and for server middleware [here](https://github.com/rwjblue/ember-cli-inject-live-reload/blob/master/index.js)

### Testing the addon with QUnit
The addon project contains a `/tests` folder which contains the
necessary infrastructure to run and configure tests for the addon. The
`/tests` folder has the following structure:

{% highlight bash %}
 dummy/
 helpers/
 unit/
 index.html
 test-helper.js
{% endhighlight %}

The `/dummy` folder contains the basic layout of a dummy app to be
used for to host your addon for testing. The `/helpers` folder
contains various *QUnit* helpers that are provided and those you
define yourself in order to keep your tests concise. The `/unit`
folder should contain your unit tests that test your addon in various
usage scenarios. To add integration (acceptance) tests add an
`integration/' folder.

`test-helper.js` is the main helper file that you should reference
from any of your unit test files. It imports the `resolver` helper
found in `/helpers` used to resolve pages in the `dummy` app.
`index.html` contains the test page that you can load in a browser to
display the results of running your integration tests.

### Writing acceptance tests

The following is an example of a simple *QUnit* acceptance test,
placed in `tests/unit/components`.

{% highlight javascript %}
// tests/unit/components/button-test.js

import { test, moduleForComponent } from 'ember-qunit';
import startApp from '../../helpers/start-app';
import Ember from 'ember';

var App;

moduleForComponent('x-button', 'XButtonComponent', {
  beforeEach: function() {
    App = startApp();
  },
  afterEach: function() {
    Ember.run(App, 'destroy');
  }
});

test('is a button tag', function(assert) {
  assert.equal('BUTTON', this.$().prop('tagName'));

  this.subject().teardownXButton();
});

// more tests follow...
{% endhighlight %}

For how to run and configure tests, see the [Ember CLI Testing](#testing) section.

### Create blueprint
A blueprint is a bundle of template files with optional installation logic.
It is used to scaffold (generate) specific application files based on
some arguments and options.
For more details see [generators-and-blueprints](#generators-and-blueprints)). An addon can have
one or more blueprints.

To create a *blueprint* for your addon:

`ember addon <blueprint-name> --blueprint`

By convention, the main blueprint of the addon should have the same
name as the addon itself:

`ember addon <addon-name> --blueprint`

In our example:

`ember addon x-button --blueprint`

This will generate a folder `blueprints/x-button` for the addon where
you can define your logic and templates for the blueprint. You can
define multiple blueprints for a single addon. The last loaded
blueprint wins with respect to overriding existing (same name)
blueprints that come with Ember or other addons (according to package
load order.)

### Blueprint conventions

Blueprints are expected to be located under the `blueprints` folder in
the addon root, just like blueprints overrides in your project root.

If you have your blueprints in another folder in your addon, you need
to tell ember-cli where to find them by specifying a `blueprintsPath`
property for the addon (see *advanced customization* section below).

If you are familiar with *Yeoman* (or Rails) generators, blueprints follow very similar conventions and structure.

To dive deeper into blueprints design, please see the [Ember CLI blueprints](https://github.com/stefanpenner/ember-cli/tree/master/blueprints) where you get a feeling for the blueprints API.

### Blueprints file structure

{% highlight bash %}
blueprints/
  x-button/
    index.js
    files/
      app/
        components/
          __name__/
{% endhighlight %}

Note that the special file or folder called `__name__` will create a
file/folder at that location in your app with the `__name__` replaced
by the first argument (name) you pass to the blueprint being
generated.

`ember g x-button my-button`

Will thus generate a folder `app/components/my-button` in the
application where the blueprint generator is run.

### Link to addon while developing

While you are developing and testing, you can run `npm link` from the
root of your addon project. This will make your addon locally
available by name.

Then run `npm link <addon-name>` in any hosting application project
root to make a link to your addon in your `node_modules` folder. Any
change in your addon will now directly take effect in any project that
links to it this way (see
[npm-tricks](http://www.devthought.com/2012/02/17/npm-tricks) for more
details).

Remember that `npm link` will not run the default blueprint in the same way that
`install` will, so you will have to do that manually via `ember g`.

While testing an addon using npm link, you need an entry in `package.json` with
your addon name, with any valid npm version: `"<addon-name>":"version"`.  Our
fictional example would require `"ember-cli-x-button": "*"`.  You can now run `ember g <addon-name>`
in your project.

### Publish addon
Use *npm* and *git* to publish the addon like a normal npm package.

{% highlight bash %}
npm version 0.0.1
git push origin master
git push origin --tags
npm publish
{% endhighlight %}

### Using a private repository
You can upload your addon code to a private git repository and call `ember install`
with a valid [git URL](https://www.npmjs.org/doc/files/package.json.html#git-urls-as-dependencies)
as the version.

If you are using [bitbucket.org](https://bitbucket.org) the [URL formats can be found here](https://confluence.atlassian.com/display/BITBUCKET/Use+the+SSH+protocol+with+Bitbucket#UsetheSSHprotocolwithBitbucket-RepositoryURLformatsbyconnectionprotocol).

When using the `git+ssh` format, the `ember install` command will require there to
be an available ssh key with read access to the repository. This can be tested
by running `git clone ssh://git@github.com:user/project.git`.

When using the `git+https` format, the `ember install` command will ask you for
the account password.

### Install and use addon
In order to use the addon from you hosting application:

To install your addon from the [npm.org](https://www.npmjs.org/) repository:

`ember install <your-addon-name-here>`.

For our *x-button* sample addon:

`ember install ember-cli-x-button my-button`.

This will first install the x-button addon from npm. Then, because we have
a blueprint with the same name as our addon, it will run the blueprint
automatically with the passed in arguments.

This is equivalent of running:

{% highlight bash %}
ember install:npm x-button
ember generate ember-cli-x-button my-button
{% endhighlight %}

### Updating addons
You can update an addon the same way you update an Ember app by
running `ember init` in your project root.

### Full example
For a good walkthrough of the (recent) development of a real world
addon, take a look at:
[Creating a DatePicker Ember CLI addon](http://edgycircle.com/blog/2014-creating-a-datepicker-ember-addon)
