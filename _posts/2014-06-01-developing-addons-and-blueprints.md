## Developing Addons and Blueprints
Addons make it possible to easily share common code between applications.

This guide will walk through the development cycle of a fictional addon `ember-cli-xbutton`.

### Installation
An addon can be installed like any other npm package:

`npm install --save-dev <package name>`

To install the (fictional) xbutton addon package:

`npm install --save-dev ember-cli-xbutton`

### Discovery
Ember CLI will detect the presence of an addon by inspecting each of your applications dependencies and search their `package.json` files for the presence of `ember-addon` in the `keywords` section (see below).

```javascript
  "keywords": [
    "ember-addon"
    ...
  ],
```

### Addon scenarios
The Ember CLI addons API currently supports the following scenarios:

* Performing operations on the `EmberApp` created in the consuming application's `Brocfile.js`
* Adding preprocessors to the default registry
* Providing a custom application tree to be merged with the consuming application
* Providing custom express (server) middlewares
* Adding custom/extra blueprints, typically for scaffolding application/project files

### Addon CLI options
Ember CLI comes has an *addon* command with some options:

```bash
ember addon <addon-name> <options...>
  Creates a new folder and runs ember init in it.
  --dry-run (Default: false)
  --verbose (Default: false)
  --blueprint (Default: addon)
  --skip-npm (Default: false)
  --skip-bower (Default: false)
  --skip-git (Default: false)
```

Note that an addon can NOT be created inside an existing application.

### Create addon
To create a basic addon:

`ember addon <addon-name>`

Running this command should generate something like the following:

```bash
ember addon my-xbutton
version x.y.zz
installing
  create .bowerrc
  create .editorconfig
  create tests/dummy/.jshintrc
  create .travis.yml
  create Brocfile.js
  create README.md

  create tests/dummy/app/app.js
  ... more test files

  create bower.json
  create .gitignore
  create package.json  

  ...
  create vendor/.gitkeep
  create addon/.gitkeep
  create app/.gitkeep
  create index.js

Installing packages for tooling via npm
Installed browser packages via Bower. 
```

### Addon conventions
The addon infrastructure is based on *"convention over configuration"* in accordance with the *Ember* philosophy. 
You are encouraged to follow these conventions to make it easier on yourself and for others to better understand your code. The same applies for addon blueprints.

### Addon project structure
The addon project created follows these structure conventions:

`app/` - merged with the application's namespace. 
`addon/` - part of the addon's namespace.
`blueprints/` - contains any blueprints that come with the addon, each in a separate folder
`tests/` - test infrastructure including a "dummy" app and acceptance test helpers.
`vendor/` - vendor specific files, such as stylesheets, fonts, external libs etc. 
`Brocfile.js` - Compilation configuration
`package.json` - Node meta-data, dependencies etc.
`index.js` - main Node entry point (as per npm conventions)

### Package.json
The generated addon `package.json` file looks something like this:

```javascript
{
  "name": "ember-cli-xbutton", // addon name
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
```

Let's add some meta data to categorize the addon a little better:

```javascript
  "keywords": [
    "ember-addon",
    "xbutton",
    "button"
  ],
```

### Addon entry point
An addon will leverage the npm conventions, and look for an `index.js` as the entry point unless another entry point is specified via the `"main"` property in the `package.json` file. You are encouraged to use `index.js` as the addon entry point.

The generated `index.js` is a simple Javascript Object (POJO) that you can customize and expand as you see fit.

```javascript
// index.js
module.exports = {
  name: 'my-addon'
};
```

### Managing addon dependencies
Install your client side dependencies via Bower.
Here we install a fictional bower dependency `xbutton`:

```
bower install --save-dev xbutton
```

Adds bower components to development dependencies

```javascript
// bower.js
{
  "name": "ember-xbutton",
  "dependencies": {
    // ...
  },
  "devDependencies": {
    "xbutton":  "^1.4.0"
  }
```

### Addon Brocfile

Normallu you can leave the `Brocfile.js` as is. Only touch it if you need to customize the merging of trees for the addon and you understand how to use the [Brocfile API](https://www.npmjs.org/package/broccoli).

### Components
In order to allow the consuming application to use the addon component without manual import statements, put the component under the `app/components` directory.  

```javascript
// app/components/xbutton.js
 
import Ember from 'ember';
import XButton from 'ember-xbutton/components/xbutton';
 
export default XButton;
```

The code imports the component from the addon directory and exports it again. This setup allows others to modify the component by extending it while making the component available in the consuming applications namespace.

The actual code for the addon goes in `addon/components/xbutton.js`

```javascript
import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'button',

  setupXbutton: function() {
    // ...
  }.on('didInsertElement'),

  teardownXbutton: function() {
    this.get('xbutton').destroy();
  }.on('willDestroyElement'),
});
```

### Blueprints
To create a blueprint, add a file `blueprints/xbutton/index.js`. This follows the usual Ember blueprints naming conventions. 

Make sure the dependency files are imported into the consuming application.
Use the `included` hook to import the files in the correct order. 

```javascript
module.exports = {
  name: 'ember-cli-xbutton',
 
  included: function(app) {
    this._super.included(app);

    app.import('bower_components/unbutton/dist/unbutton.js');
    app.import('bower_components/xbutton/dist/js/xbutton.js');
    app.import('bower_components/xbutton/dist/css/xbutton.css');
  }
};
```

In the example file, the `included` hook is used. This hook is called by the `EmberApp` constructor and gives access to the app as `app`. 

When the consuming application's `Brocfile.js` is processed by Ember CLI to build/serve etc. the addon's `included` function is called passing the `EmberApp` instance.

### Advanced customization
If you want to go beyond the built in customizations or want/need more advanced control in general, the following are some of the hooks (keys) available for your addon Object in the `index.js` file. All hooks expect a function as the value.

```javascript
includedCommands: function() {}
blueprintsPath: // return path as String
postBuild: 
treeFor: 
included: 
postprocessTree: 
serverMiddleware: 
```

An example of advanced customization can be found [here](https://github.com/poetic/ember-cli-cordova/blob/master/index.js) and for server middleware [here](https://github.com/rwjblue/ember-cli-inject-live-reload/blob/master/index.js)

### Testing addon
The addon project contains a `/tests` folder which contains the necessary infrastructure to run and configure tests for the addon.
The `/tests` folder has the following structure:

- `/dummy`
- `/helpers`
- `/unit`
- `index.html`
- `test_helper.js`

The `/dummy` folder contains the basic layout of a dummy app to be used for to host your addon for testing. 

The `/helpers` folder contains various *qunit* helpers that are provided and those you define yourself in order to keep your tests concise.

The `/unit` folder should contain your unit tests that test your addon in various usage scenarios. These test may also be full integration tests that test the addon being hosted in the dummy app.

`test_helper.js` is the main helper file that you should reference from any of your unit test files. It imports the `resolver` helper found in `/helpers` used to resolve pages in the `dummy` app.

`index.html` contains the test page that you can load in a browser to display the results of running the unit tests.

### Writing acceptance tests
The following is an example of a simple *QUnit* acceptance test, placed in `tests/unit/components`.

```javascript
// tests/unit/components/button-test.js

import { test, moduleForComponent } from 'ember-qunit';
import startApp from '../../helpers/start-app';
import Ember from 'ember';

var App;

moduleForComponent('xbutton', 'XButtonComponent', {
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
```

For how to run and configure tests, see the [[Ember CLI Testing]] section.

### Create blueprint
A blueprint is a bundle of template files with optional installation logic.
It is used to scaffold (generate) specific application files based on some arguments and options.
For more details see [[generators-and-blueprints]]). An addon can have one or more blueprints.

To create a *blueprint* for your addon:

`ember addon <blueprint-name> --blueprint`

By convention, the main blueprint of the addon should have the same name as the addon itself:

`ember addon <addon-name> --blueprint`

In our example:

`ember addon xbutton --blueprint`

This will generate a folder `blueprints/xbutton` for the addon where you can define your logic and templates for the blueprint. You can define multiple blueprints for a single addon. The last loaded blueprint wins with respect to overriding existing (same name) blueprints that come with Ember or other addons (according to package load order.)

### Blueprint conventions
Blueprints are expected to be located under the `blueprints` folder in the addon root, just like blueprints overrides in your project root.

If you have your blueprints in another folder in your addon, you need to tell ember-cli where to find them by specifying a `blueprintsPath` property for the addon (see *advanced customization* section below).

If you are familiar with *Yeoman* (or Rails) generators, blueprints follow very similar conventions and structure.

To dive deeper into blueprints design, please see the [Ember CLI blueprints](https://github.com/stefanpenner/ember-cli/tree/master/blueprints) where you get a feeling for the blueprints API. 

### Blueprints file structure

```bash
blueprints/
  xbutton/
    index.js
    files/
      app/
        components/
          __name__/
  unbutton
    index.js
    files/
      config/
        __name__.js
```

Note that the special file or folder called `__name__` will create a file/folder at that location in your app with the `__name__` replaced by the first argument (name) you pass to the blueprint being generated.

`ember g xbutton my-button``

Will thus generate a folder `app/components/my-button` in the application where the blueprint generator is run.

### Link to addon while developing
While you are developing and testing, you can run `npm link` from the root of your addon project. This will make your addon locally available by name.

Then run `npm link <addon-name>` in any hosting application project root to make a link to your addon in your `node_modules` folder. Any change in your addon will now directly take effect in any project that links to it this way (see [npm-tricks](http://www.devthought.com/2012/02/17/npm-tricks) for more details.

### Publish addon
Use *npm* and *git* to publish the addon like a normal npm package.

```bash
npm version 0.0.1
git push origin master
git push origin --tags
npm publish
```

See [npm-version](https://www.npmjs.org/doc/cli/npm-version.html) for details. 

These commands will:

- tag with the version number
- push the committed addon code to your git repo (origin branch)
- push the new tag to your git repo (origin branch)
- publish addon to the global npm repository.

### Install and use addon
In order to use the addon from you hosting application:

To install your addon from the [npm.org](https://www.npmjs.org/) repository:

`npm install ember-cli-<your-addon-name-here> --save-dev`.

For our *xbutton* sample addon:

`npm install ember-cli-xbutton --save-dev`.

Run the *xbutton* blueprint generator via:

`ember generate xbutton`

### Updating addons
You can update an addon the same way you update an Ember app by running `ember init` in your project root.

### Full example
For a good walkthrough of the (recent) development of a real world addon, take a look at: 
[Creating a DatePicker Ember CLI addon](http://edgycircle.com/blog/2014-creating-a-datepicker-ember-addon)
