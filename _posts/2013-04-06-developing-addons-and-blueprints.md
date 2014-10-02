---
layout: post
title: "Developing Addons and Blueprints"
permalink: developing-addons-and-blueprints
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-06-developing-addons-and-blueprints.md"
---
Addons make it possible to easily share common code between
applications.

This guide will walk through the development cycle of a fictional
addon `ember-cli-x-button`.

### Installation
An addon can be installed like any other npm package:

`npm install --save-dev <package name>`

To install the (fictional) x-button addon package:

`npm install --save-dev ember-cli-x-button`

### Discovery

Ember CLI will detect the presence of an addon by inspecting each of
your applications dependencies and search their `package.json` files
for the presence of `ember-addon` in the `keywords` section (see
below).

{% highlight javascript %}
  "keywords": [
    "ember-addon"
    ...
  ],
{% endhighlight %}

### Addon scenarios

The Ember CLI addons API currently supports the following scenarios:

* Performing operations on the `EmberApp` created in the consuming application's `Brocfile.js`
* Adding preprocessors to the default registry
* Providing a custom application tree to be merged with the consuming application
* Providing custom express (server) middlewares
* Adding custom/extra blueprints, typically for scaffolding application/project files

### Addon CLI options

Ember CLI comes has an *addon* command with some options:


`ember addon <addon-name> <options...>`

Note: An addon can NOT be created inside an existing application.

### Create addon
To create a basic addon:

Running this command should generate something like the following:

{% highlight bash %}
ember addon my-x-button
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
{% endhighlight %}

Let's add some meta data to categorize the addon a little better:

{% highlight javascript %}
  "keywords": [
    "ember-addon",
    "x-button",
    "button"
  ],
{% endhighlight %}

### Addon entry point
An addon will leverage the npm conventions, and look for an `index.js` as the entry point unless another entry point is specified via the `"main"` property in the `package.json` file. You are encouraged to use `index.js` as the addon entry point.

The generated `index.js` is a simple JavaScript Object (POJO) that you can customize and expand as you see fit.

{% highlight javascript %}
// index.js
module.exports = {
  name: 'my-addon'
};
{% endhighlight %}

### Managing addon dependencies
Install your client side dependencies via Bower.
Here we install a fictional bower dependency `x-button`:

```
bower install --save-dev x-button
```

Adds bower components to development dependencies

{% highlight javascript %}
// bower.js
{
  "name": "ember-x-button",
  "dependencies": {
    // ...
  },
  "devDependencies": {
    "x-button":  "^1.4.0"
  }
{% endhighlight %}

### Addon Brocfile

Normally you can leave the `Brocfile.js` as is. Only touch it if you need to customize the merging of trees for the addon and you understand how to use the [Brocfile API](https://www.npmjs.org/package/broccoli).

### Components
In order to allow the consuming application to use the addon component without manual import statements, put the component under the `app/components` directory.

{% highlight javascript %}
// app/components/x-button.js

import Ember from 'ember';
import XButton from 'ember-x-button/components/x-button';

export default XButton;
{% endhighlight %}

The code imports the component from the addon directory and exports it again. This setup allows others to modify the component by extending it while making the component available in the consuming applications namespace.

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

### Blueprints
To create a blueprint, add a file `blueprints/x-button/index.js`. This follows the usual Ember blueprints naming conventions.

Make sure the dependency files are imported into the consuming application.
Use the `included` hook to import the files in the correct order.

We want to register a no-op package in bower called *x-button*. Consume it as `x-button: 0.0.1`. Import `x-button/dist/js/x-button.js` and `x-button/dist/css/x-button.css`.

{% highlight javascript %}
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

### Advanced customization
If you want to go beyond the built in customizations or want/need more
advanced control in general, the following are some of the hooks
(keys) available for your addon Object in the `index.js` file. All
hooks expect a function as the value.

{% highlight javascript %}
includedCommands: function() {},
blueprintsPath: // return path as String
postBuild:
treeFor:
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
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

test('is a button tag', function() {
  equal('BUTTON', this.$().prop('tagName'));

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

While testing an addon using npm link, you need an entry in `package.json` with
your addon name, with any valid npm version: `"<addon-name>":"version"`.  Our
fictional example would require `"x-button": "*"`.  You can now run `ember g <addon-name>`
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
You can upload your addon code to a private git repository and call `npm install`
with a valid [git URL](https://www.npmjs.org/doc/files/package.json.html#git-urls-as-dependencies)
as the version.

If you are using [bitbucket.org](https://bitbucket.org) the [URL formats can be found here](https://confluence.atlassian.com/display/BITBUCKET/Use+the+SSH+protocol+with+Bitbucket#UsetheSSHprotocolwithBitbucket-RepositoryURLformatsbyconnectionprotocol).

When using the `git+ssh` format, the `npm install` command will require there to
be an available ssh key with read access to the reposirtory. This can be tested
by running `git clone ssh://git@github.com:user/project.git`.

When using the `git+https` format, the `npm install` command will ask you for
the account password.

### Install and use addon
In order to use the addon from you hosting application:

To install your addon from the [npm.org](https://www.npmjs.org/) repository:

`npm install ember-cli-<your-addon-name-here> --save-dev`.

For our *x-button* sample addon:

`npm install ember-cli-x-button --save-dev`.

Run the *x-button* blueprint generator via:

`ember generate x-button`

### Updating addons
You can update an addon the same way you update an Ember app by
running `ember init` in your project root.

### Full example
For a good walkthrough of the (recent) development of a real world
addon, take a look at:
[Creating a DatePicker Ember CLI addon](http://edgycircle.com/blog/2014-creating-a-datepicker-ember-addon)
