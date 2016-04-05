Table of Contents:

1. [config](#config)
- [blueprintsPath](#blueprintspath)
- [includedCommands](#includedcommands)
- [serverMiddleware](#servermiddleware)
- [postBuild](#postbuild)
- [preBuild](#prebuild)
- [outputReady](#outputready)
- [buildError](#builderror)
- [included](#included)
- [shouldIncludeChildAddon](#shouldincludechildaddon)
- [setupPreprocessorRegistry](#setuppreprocessorregistry)
- [postprocessTree](#postprocesstree)
- [lintTree](#linttree)
- [contentFor](#contentfor)
- [treeFor](#treefor)
  1. [treeForApp](#treefor-cont)
  - [treeForStyles](#treefor-cont)
  - [treeForTemplates](#treefor-cont)
  - [treeForAddonTemplates](#treefor-cont)
  - [treeForAddon](#treefor-cont)
  - [treeForVendor](#treefor-cont)
  - [treeForTestSupport](#treefor-cont)
  - [treeForPublic](#treefor-cont)
  - [treeForAddonTestSupport](#treefor-cont)

For each hook we'll cover the following (if applicable):

- Received arguments
- Source
- Default implementation
- Uses
- Examples

<small>Compendium is largely based of a talk by [@rwjblue](https://github.com/rwjblue) which can be found [here](https://www.youtube.com/watch?v=e1l07N0ukzY&feature=youtu.be&t=1h40m53s).</small>

<a name='config'></a>
## Config

Augments the applications configuration settings.  Object returned from this hook is merged with the application's configuration object.  Application's configuration always take precedence.

**Received arguments:**

  - env - name of current environment (ie "development")
  - baseConfig - Initial application config

**Source:** [lib/models/addon.js:797](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/addon.js#L797)

**Default implementation:**

```js
Addon.prototype.config = function (env, baseConfig) {
  var configPath = path.join(this.root, 'config', 'environment.js');

  if (existsSync(configPath)) {
    var configGenerator = require(configPath);

    return configGenerator(env, baseConfig);
  }
};
```

**Uses:**

- Modifying configuration options (see list of defaults [here](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js#L163))
  - For example
    - `minifyJS`
    - `storeConfigInMeta`
    - `es3Safe`
    - et, al

**Examples:**

- Setting `storeConfigInMeta` to false in [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/v0.7.0/index.js#L16)

<a name='blueprintspath'></a>
## blueprintsPath

Tells the application where your blueprints exist.

**Received arguments:** None

**Source:** [lib/models/addon.js:769](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/addon.js#L769)

**Default implementation:**

```js
Addon.prototype.blueprintsPath = function() {
  var blueprintPath = path.join(this.root, 'blueprints');

  if (existsSync(blueprintPath)) {
    return blueprintPath;
  }
};
```

**Uses:**

- Let application know where blueprints exists.

**Examples:**

- [ember-cli-coffeescript](https://github.com/kimroen/ember-cli-coffeescript/blob/v1.13.2/index.js#L26)

<a name='includedcommands'></a>
## includedCommands

Allows the specification of custom addon commands.  Expects you to return an object whose key is the name of the command and value is the command instance.

**Received arguments:** None

**Source:** [lib/models/project.js:392](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/project.js#L392)

**Default implementation:** None

**Uses:**

- Include custom commands into consuming application

**Examples:**

- [ember-cli-cordova](https://github.com/poetic/ember-cli-cordova/blob/v0.0.19/index.js#L46)

```js
  // https://github.com/rwjblue/ember-cli-divshot/blob/v0.1.7/index.js
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

**Source:** [lib/tasks/server/express-server.js:105](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/tasks/server/express-server.js#L105)

**Default implementation:** None

**Uses:**

- Tacking on headers to each request
- Modifying the request object

*Note:* that this should only be used in development, and if you need the same behavior in production you'll need to configure your server.

**Examples:**

- [ember-cli-content-security-policy](https://github.com/rwjblue/ember-cli-content-security-policy/blob/v0.5.0/index.js#L84)

- [history-support-addon](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/tasks/server/middleware/history-support/index.js#L25)

<a name='postbuild'></a>
## postBuild

Gives access to the result of the tree, and the location of the output.

**Received arguments:**

- Result object from broccoli build
  - `result.directory` - final output path

**Source:** [lib/models/builder.js:173](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/builder.js#L173)

**Default implementation:** None

**Uses:**

- Slow tree listing
- May be used to manipulate your project after build has happened

<a name='prebuild'></a>
## preBuild

Hook called before build takes place.

**Received arguments:**

**Source:** [lib/models/builder.js:163](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/builder.js#L163)

**Default implementation:** None

**Uses:**

<a name='outputready'></a>
## outputReady

Hook called after the build has been processed and the files have been copied to the output directory

**Received arguments:**

- Result object from broccoli build
  - `result.directory` - final output path

**Default implementation:** None

**Examples:**

- Opportunity to symlink or copy files elsewhere.
- [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/v0.7.0/index.js#L45)
  - In this case we are using this in tandem with a rails middleware to remove a lock file.  This allows our ruby gem to block incoming requests until after the build happens reliably.

<a name='builderror'></a>
## buildError

buildError hook will be called on when an error occurs during the
preBuild, postBuild or outputReady hooks for addons, or when builder#build
fails

**Received arguments:**

- The error that was caught during the processes listed above

**Source:** [lib/models/builder.js:177](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/builder.js#L177)

**Default implementation:** None

**Uses:**

- Custom error handling during build process

**Examples:**

- [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/v0.7.0/index.js#L11)

<a name='included'></a>
## included

Usually used to import assets into the application.

**Received arguments:**

- `EmberApp` instance [see ember-app.js](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js)

**Source:** [lib/broccoli/ember-app.js:432](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js#L432)

**Default implementation:** None

**Uses:**

- including vendor files
- setting configuration options

*Note:* Any options set in the consuming application will override the addon.

**Examples:**

```js
// https://github.com/yapplabs/ember-colpick/blob/master/index.js
included: function colpick_included(app) {
  this._super.included.apply(this, arguments);

  var colpickPath = path.join(app.bowerDirectory, 'colpick');

  this.app.import(path.join(colpickPath, 'js',  'colpick.js'));
  this.app.import(path.join(colpickPath, 'css', 'colpick.css'));
}
```

- [ember-cli-rails-addon](https://github.com/rondale-sc/ember-cli-rails-addon/blob/v0.7.0/index.js#L15)

<a name='shouldincludechildaddon'></a>
## shouldIncludeChildAddon

Can be used to exclude addons from being added as a child addon.

**Received arguments:**

- `Addon` instance [see addon.js](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/addon.js)

**Source:** [lib/models/addon.js:831](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/addon.js#L831)

**Default implementation:**

```js
Addon.prototype.shouldIncludeChildAddon = function() {
  return true;
};
```

**Uses:**

- Abstract away multiple addons while only including one into the built assets

**Examples:**

```js
shouldIncludeChildAddon: function select_shouldIncludeChildAddon(childAddon) {
  if(childAddon.name === 'ember-cli-some-legacy-select-component') {
    return this.options.legacyMode;
  } else if(childAddon.name === 'ember-cli-awesome-new-select-component') {
    return !this.options.legacyMode;
  } else {
    return this._super.shouldIncludeChildAddon.apply(this, arguments);
  }
}
```

<a name='setuppreprocessorregistry'></a>
## setupPreprocessorRegistry

Used to add preprocessors to the preprocessor registry. This is often used by addons like [ember-cli-htmlbars](https://github.com/ember-cli/ember-cli-htmlbars)
and [ember-cli-coffeescript](https://github.com/kimroen/ember-cli-coffeescript) to add a `template` or `js` preprocessor to the registry.

**Received arguments**

- `type` either `"self"` or `"parent"`
- `registry` the registry to be set up

**Source:** [ember-cli-preprocessor-registry/preprocessors:43](https://github.com/ember-cli/ember-cli-preprocessor-registry/blob/master/preprocessors.js#L43)

**Default implementation:** None

**Uses:**

- Adding preprocessors to the registry.

**Examples:**

```js
// https://github.com/ember-cli/ember-cli-htmlbars/blob/v1.0.3/ember-addon-main.js#L21
setupPreprocessorRegistry: function(type, registry) {
  // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
  registry.remove('template', 'broccoli-ember-hbs-template-compiler');

  registry.add('template', {
    name: 'ember-cli-htmlbars',
    ext: 'hbs',
    _addon: this,
    toTree: function(tree) {
      var htmlbarsOptions = this._addon.htmlbarsOptions();
      return htmlbarsCompile(tree, htmlbarsOptions);
    },

    precompile: function(string) {
      var htmlbarsOptions = this._addon.htmlbarsOptions();
      var templateCompiler = htmlbarsOptions.templateCompiler;
      return utils.template(templateCompiler, string);
    }
  });

  if (type === 'parent') {
    this.parentRegistry = registry;
  }
}
```

<a name='postprocesstree'></a>
## postprocessTree

**Received arguments:**

- post processing type (eg all)
- receives tree after build
- receives tree for a given type after preprocessors (like HTMLBars or babel) run.

available types:

* js
* template
* all
* css
* test

**Source:** [lib/broccoli/ember-app.js:505](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js#L505)

**Default implementation:** None

**Examples:**

- [broccoli-asset-rev](https://github.com/rickharrison/broccoli-asset-rev/blob/c82c3580855554a31f7d6600b866aecf69cdaa6d/index.js#L29)

<a name='preprocesstree'></a>
## preprocessTree

**Received arguments:**

- type of tree (eg template, js)
- receives tree for a given type before preprocessors (like HTMLBars or babel) run.

available types:

* js
* template
* css
* test

**Source:** [lib/broccoli/ember-app.js:551](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js#L551)

**Default implementation:** None

**Uses:**

- removing / adding files from the build.

<a name='linttree'></a>
## lintTree

Return value is merged into the **tests** tree. This lets you inject
linter output as test results.

**Received arguments:**

- tree type ('app', 'tests', 'templates', or 'addon')
- tree of files (JavaScript files for `app`, `tests`, and `addon` types)

**Source:** [lib/broccoli/ember-app.js:571](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js#L571)

**Default implementation:** None

**Uses:**

- JSHint
- any other form of automated test generation that turns code into tests

**Examples:**

- [ember-cli-qunit](https://github.com/ember-cli/ember-cli-qunit/blob/v1.4.1/index.js#L206)
- [ember-cli-mocha](https://github.com/ef4/ember-cli-mocha/blob/66803037fe203b24e96dea83a2bd91de48b842e1/index.js#L101)


<a name='contentfor'></a>
## contentFor

Allow addons to implement contentFor method to add string output into the associated {{content-for 'foo'}} section in index.html

**Received arguments:**

- type
- config
- content

**Source:** [lib/broccoli/ember-app.js:1616](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js#L1616)

**Default implementation:** None

**Uses:**

- For instance, to inject analytics code into index.html

**Examples:**

- [ember-cli-google-analytics](https://github.com/pgrippi/ember-cli-google-analytics/blob/v1.5.0/index.js#L79)

<a name='treefor'></a>
## treeFor

Return value is merged with application tree of same type

**Received arguments:**

- returns given type of tree (eg app, vendor, bower)

**Source:** [lib/broccoli/ember-app.js:462](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/broccoli/ember-app.js#L462)

**Default implementation:**

```js
// https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/addon.js#L286
Addon.prototype.treeFor = function treeFor(name) {
  this._requireBuildPackages();

  var trees = this.eachAddonInvoke('treeFor', [name]);
  var tree = this._treeFor(name);

  if (tree) {
    trees.push(tree);
  }

  if (this.isDevelopingAddon() && this.hintingEnabled() && name === 'app') {
    trees.push(this.jshintAddonTree());
  }

  return mergeTrees(trees.filter(Boolean), {
    overwrite: true,
    annotation: 'Addon#treeFor (' + this.name + ' - ' + name + ')'
  });
};
```

**Uses:**

- manipulating trees at build time

**Examples:**

<a name='treefor-cont'></a>
# treeFor (cont...)

Instead of overriding `treeFor` and acting only if the tree you receive matches the one you need EmberCLI has custom hooks for the following Broccoli trees:

- treeForApp
- treeForStyles
- treeForTemplates
- treeForAddonTemplates
- treeForAddon
- treeForVendor
- treeForTestSupport
- treeForPublic
- treeForAddonTestSupport

When overriding a hook, if you want to preserve it's original functionality, call the same method on `_super` with the function arguments.

**Examples:**

```js
treeForAddon: function(tree) {
  var checker = new VersionChecker(this);
  var isOldEmber = checker.for('ember', 'bower').lt('1.13.0');

  if (isOldEmber) {
    tree = new Funnel(tree, { exclude: [ /instance-initializers/ ] });
  }

  return this._super.treeForAddon.call(this, tree);
}
```

<a name='isDevelopingAddon'></a>
## isDevelopingAddon

Allows to mark the addon as developing, triggering live-reload in the project the addon is linked to

**Received arguments:** None

**Default implementation:** None

**Uses:**

- Working on projects with internal addons

**Examples:**

```js
  // addon index.js
  isDevelopingAddon: function() {
    return true;
  }
```

See more [here](https://github.com/ember-cli/ember-cli/blob/v2.4.3/lib/models/addon.js#L97).
