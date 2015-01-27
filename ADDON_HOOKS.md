Table of Contents:

1. [config](#config)
- [bluprintsPath](#blueprintspath)
- [includedCommands](#includedcommands)
- [serverMiddleware](#servermiddleware)
- [postBuild](#postbuild)
- [preBuild](#prebuild)
- [buildError](#builderror)
- [included](#included)
- [postprocessTree](#postprocesstree)
- [lintTree](#linttree)
- [contentFor](#contentfor)
- [treeFor](#treefor)
  1. [treeForApp](#treefor-cont)
  - [treeForStyles](#treefor-cont)
  - [treeForTemplates](#treefor-cont)
  - [treeForAddon](#treefor-cont)
  - [treeForVendor](#treefor-cont)
  - [treeForTestSupport](#treefor-cont)
  - [treeForPublic](#treefor-cont)

For each hook we'll cover the following (if applicable):

- Received arguments
- Source
- Default implementation
- Uses
- Examples

<small>Compendium is largely based of a talk by [@rwjblue](https://github.com/rwjblue) which can be found [here](https://www.youtube.com/watch?v=e1l07N0ukzY&feature=youtu.be&t=1h40m53s)</small>

<a name='config'></a>
## Config

Augments the applications configuration settings.  Object returned from this hook is merged with the application's configuration object.  Application's configuration always take precedence.

**Received arguments:**

  - env - name of current environment (ie "developement")
  - baseConfig - Initial application config

**Source:** [lib/models/addon.js:312](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/models/addon.js#L312)

**Default implementation:**

```js
Addon.prototype.config = function (env, baseConfig) {
  var configPath = path.join(this.root, 'config', 'environment.js');

  if (fs.existsSync(configPath)) {
    var configGenerator = require(configPath);

    return configGenerator(env, baseConfig);
  }
};
```

**Uses:**

- Modifying configuration options (see list of defaults [here](https://github.com/ember-cli/ember-cli/blob/v0.1.4/lib/broccoli/ember-app.js#L83))
  - For example
    - `minifyJS`
    - `storeConfigInMeta`
    - `es3Safe`
    - et, al

**Examples:**

- Setting `storeConfigInMeta` to false in [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/v0.0.4/index.js#L7)

<a name='blueprintspath'></a>
## blueprintsPath

Tells the application where your blueprints exist.

**Received arguments:** None

**Source:** [lib/models/addon.js:304](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/models/addon.js#L304)

**Default implementation:**

```js
Addon.prototype.blueprintsPath = function() {
  var blueprintPath = path.join(this.root, 'blueprints');

  if (fs.existsSync(blueprintPath)) {
    return blueprintPath;
  }
};
```

**Uses:**

- Let application know where blueprints exists.

**Examples:**

- [ember-cli-coffeescript](https://github.com/kimroen/ember-cli-coffeescript/blob/v0.6.0/index.js#L29)

<a name='includedcommands'></a>
## includedCommands

Allows the specification of custom addon commands.  Expects you to return an object whose key is the name of the command and value is the command instance.

**Received arguments:** None

**Source:** [lib/models/project.js:234](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/models/project.js#L234)

**Default implementation:** None

**Uses:**

- Include custom commands into consuming application

**Examples:**

- [ember-cli-cordova](https://github.com/poetic/ember-cli-cordova/blob/v0.0.14/index.js#L19)

```js
  // https://github.com/rwjblue/ember-cli-divshot/blob/v0.1.6/index.js
  includedCommands: function() {
    return {
      'divshot': require('./lib/commands/divshot')
    };
  }
```

<a name='servermiddleware'></a>
## serverMiddleware

Designed to manipulate requests in development mode.

**Received arguments:**
  - options (eg express_instance, project, watcher, environment)

**Source:** [lib/tasks/server/express-server.js:63](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/tasks/server/express-server.js#L63)

**Default implementation:** None

**Uses:**

- Tacking on headers to each request
- Modifying the request object

*Note:* that this should only be used in development, and if you need the same behavior in production you'll need to configure your server.


**Examples:**

- [ember-cli-content-security-policy](https://github.com/rwjblue/ember-cli-content-security-policy/blob/v0.3.0/index.js#L25)

- [history-support-addon](https://github.com/stefanpenner/ember-cli/blob/master/lib/tasks/server/middleware/history-support/index.js#L13)

<a name='postbuild'></a>
## postBuild

Gives access to the result of the tree, and the location of the output.

**Received arguments:**

- Result object from broccoli build
  - `result.directory` - final output path

**Source:** [lib/models/builder.js:111](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/models/builder.js#L111)

**Default implementation:** None

**Uses:**

- Slow tree listing
- May be used to manipulate your project after build has happened
- Opportunity to symlink or copy files elsewhere.

**Examples:**

- [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/master/index.js#L14)
  - In this case we are using this in tandem with a rails middleware to remove a lock file.  This allows our ruby gem to block incoming requests until after the build happens reliably.

<a name='prebuild'></a>
## preBuild

Hook called before build takes place.

**Received arguments:**

**Source:** [lib/models/builder.js:114](https://github.com/rwjblue/ember-cli/blob/pre-build-duh/lib/models/builder.js#L114)

**Default implementation:** None

**Uses:**

**Examples:**

- [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/master/index.js#L14)
  - In this case we are using this in tandem with a rails middleware to create a lock file.
  *[See postBuild]*

<a name='builderror'></a>
## buildError

buildError hook will be called on when an error occurs during the
preBuild or postBuild hooks for addons, or when builder#build
fails

**Received arguments:**

- The error that was caught during the processes listed above

**Source:** [lib/models/builder.js:122](https://github.com/rwjblue/ember-cli/blob/pre-build-duh/lib/models/builder.js#L11://github.com/ember-cli/ember-cli/blob/ffd52b584a0fb3201878431339744acdabb0fa24/lib/models/builder.js#L122)

**Default implementation:** None

**Uses:**

- Custom error handling during build process

**Examples:**

<a name='included'></a>
## included

Usually used to import assets into the application.

**Received arguments:**

- `EmberApp` instance [see ember-app.js](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/broccoli/ember-app.js)

**Source:** [lib/broccoi/ember-app.js:216](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/broccoli/ember-app.js#L216)

**Default implementation:** None

**Uses:**

- including vendor files
- setting configuration options

*Note:* Any options set in the consuming application will override the addon.

**Examples:**

```js
// https://github.com/yapplabs/ember-colpick/blob/master/index.js
included: function colpick_included(app) {
  this._super.included(app);

  var colpickPath = path.join(app.bowerDirectory, 'colpick');

  this.app.import(path.join(colpickPath, 'js',  'colpick.js'));
  this.app.import(path.join(colpickPath, 'css', 'colpick.css'));
}
```

- [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/master/index.js#L6)

<a name='postprocesstree'></a>
## postprocessTree

**Received arguments:**

- post processing type (eg all)
- receives tree after build

**Source:** [lib/broccoli/ember-app.js:251](https://github.com/stefanpenner/ember-cli/blob/v0.1.4/lib/broccoli/ember-app.js#L251)

**Default implementation:** None

**Uses:**

- fingerprint assets
- running processes after build but before toTree

**Examples:**

- [broccoli-asset-rev](https://github.com/rickharrison/broccoli-asset-rev/blob/c82c3580855554a31f7d6600b866aecf69cdaa6d/index.js#L29)

<a name='linttree'></a>
## lintTree

Return value is merged into the **tests** tree. This lets you inject
linter output as test results.

**Received arguments:**

- tree type ('app', 'tests', or 'addon')
- tree of Javascript files

**Source:** [lib/broccoli/ember-app.js:326](https://github.com/ef4/ember-cli/blob/be3e4461157e416e18953d84032897b218be6820/lib/broccoli/ember-app.js#L326-L347)

**Default implementation:** None

**Uses:**

- JSHint
- any other form of automated test generation that turns code into tests

**Examples:**

- [ember-cli-qunit](https://github.com/ember-cli/ember-cli-qunit/blob/6513bbcc4a4eb567e1d477cb8ea24f31197b7c34/index.js#L88-L94)
- [ember-cli-mocha](https://github.com/ef4/ember-cli-mocha/blob/ec5a7cd064aabbfe47fbcb3389383f80cde8b668/index.js#L83-L89)


<a name='contentfor'></a>
## contentFor

Allow addons to implement contentFor method to add string output into the associated {{content-for 'foo'}} section in index.html

**Received arguments:**

- type
- config

**Source:** [lib/broccoli/ember-app.js:953](https://github.com/ember-cli/ember-cli/blob/v0.1.4/lib/broccoli/ember-app.js#L953)

**Default implementation:** None

**Uses:**

- For instance, to inject analytics code into index.html

**Examples:**

- [ember-cli-google-analytics](https://github.com/pgrippi/ember-cli-google-analytics/blob/v1.2.0/index.js#L80)

<a name='treefor'></a>
## treeFor

Return value is merged with application tree of same type

**Received arguments:**

- returns given type of tree (eg app, vendor, bower)

**Source:** [lib/broccoli/ember-app.js:240](https://github.com/ember-cli/ember-cli/blob/v0.1.4/lib/broccoli/ember-app.js#L240)

**Default implementation:**

```js
Addon.prototype.treeFor = function treeFor(name) {
  this._requireBuildPackages();

  var tree;
  var trees = [];

  if (tree = this._treeFor(name)) {
    trees.push(tree);
  }

  if (this.isDevelopingAddon() && this.app.hinting && name === 'app') {
    trees.push(this.jshintAddonTree());
  }

  return this.mergeTrees(trees.filter(Boolean));
};
```

**Uses:**

- manipulating trees at build time

**Examples:**

<a name='treefor-cont'></a>
# treeFor (cont...)

Instead of overriding `treeFor` and acting only if the tree you receive matches the one you need EmberCLI has custom hooks for the following Broccoli trees

- treeForApp
- treeForStyles
- treeForTemplates
- treeForAddon
- treeForVendor
- treeForTestSupport
- treeForPublic

See more [here](https://github.com/ember-cli/ember-cli/blob/b12e0023dc653316f68aa58b9bb14ade3037e9e6/lib/models/addon.js#L38)
