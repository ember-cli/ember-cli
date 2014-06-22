# ember-cli Changelog

* [BUGFIX] Ensure EDITOR is set before allowing edit in ember init. [#1090](https://github.com/stefanpenner/ember-cli/pull/1090)
* [BUGFIX] Display message to user when diff cannot be applied cleanly [#1091](https://github.com/stefanpenner/ember-cli/pull/1091)
* [ENHANCEMENT] Notify when an ember-cli update is available, and add `ember update` command. [#899](https://github.com/stefanpenner/ember-cli/pull/899)
* [BUGFIX] Ensure that build output directory is cleaned up properly. [#1122](https://github.com/stefanpenner/ember-cli/pull/1122)
* [BUGFIX] Ensure that non-zero exit code is used when running `ember test` with failing tests. [#1123](https://github.com/stefanpenner/ember-cli/pull/1123)
* [BREAKING ENHANCEMENT] Change the expected interface for the `./server/index.js` file. It now receives the instantiated `express` server. [#1097](https://github.com/stefanpenner/ember-cli/pull/1097)
* [ENHANCEMENT] Allow addons to provide server side middlewares. [#1097](https://github.com/stefanpenner/ember-cli/pull/1097)
* [ENHANCEMENT] Automatically pluralize the attribute when generating a
  model. [#1120](https://github.com/stefanpenner/ember-cli/pull/1120)
* [BUGFIX] Make sure non-dasherized model attributes are also added to
  generated tests. [#1120](https://github.com/stefanpenner/ember-cli/pull/1120)
* [ENHANCEMENT] Upgrade `ember-qunit-notifications` to `0.0.3`. [#1117](https://github.com/stefanpenner/ember-cli/pull/1117)
* [ENHANCEMENT] Adds `ember build --watch` [#1131](https://github.com/stefanpenner/ember-cli/pull/1131)


### 0.0.36

* deployed bundled package with outdated bundled depds... Likely user
  error (by @stefanpenner)

### 0.0.35

* [BUGFIX] Ensure that vendored JS files are concatted in a safe way (to prevent issues with ASI). [#988](https://github.com/stefanpenner/ember-cli/pull/988)
* [ENHANCEMENT] Use the `Project` model to load the project name and environment configuration (removes boilerplate from `Brocfile.js`). [#989](https://github.com/stefanpenner/ember-cli/pull/989)
* [BUGFIX] Pass `--port` option through when calling `ember test --port 8987` (allows overriding the port when running concurrent `ember test` commands). [#991](https://github.com/stefanpenner/ember-cli/pull/991)
* [ENHANCEMENT] Add `.ember-cli` configuration file. [#563](https://github.com/stefanpenner/ember-cli/pull/563)
* [ENHANCEMENT] Add edit capability to `ember init`. [#1000](https://github.com/stefanpenner/ember-cli/pull/1000)
* [ENHANCEMENT] Add the current environment to the application config (the `MyApplicationENV` global). [#1017](https://github.com/stefanpenner/ember-cli/pull/1017)
* [BUGFIX] Ensure that the project `.jshintrc` file is looked up in the project's root. [#1019](https://github.com/stefanpenner/ember-cli/pull/1019)
* [ENHANCEMENT] Allow addons to hook into the application build process. [#1025](https://github.com/stefanpenner/ember-cli/pull/1025)
* [ENHANCEMENT] Allow addons to register custom preprocessors. [#1030](https://github.com/stefanpenner/ember-cli/pull/1030)
* [BUGFIX] Prevent route blueprint adding duplicate entries to router.js [#1042](https://github.com/stefanpenner/ember-cli/pull/1042)
* [ENHANCEMENT] Add blueprint listing in ember help generate. [#952](https://github.com/stefanpenner/ember-cli/pull/952)
* [BUGFIX] Add missing descriptions for `build`, `serve`, and `test` commands. [#1045](https://github.com/stefanpenner/ember-cli/issues/1045)
* [ENHANCEMENT] Do not remove output directory. This allows easier cross-project symlinking (previous behavior broke the link when the output path was destroyed). [#1034](https://github.com/stefanpenner/ember-cli/pull/1034)
* [ENHANCEMENT] Keep output path (`/dist` by default) up to date with both `ember server` and `ember build`. [#1034](https://github.com/stefanpenner/ember-cli/pull/1034)
* [ENHANCEMENT] Use the `ember-cli-ic-ajax` addon to bring in ic-ajax. [#1047](https://github.com/stefanpenner/ember-cli/issues/1047)
* [ENHANCEMENT] Use the `ember-cli-ember-data` addon to bring in ember-data. [#1047](https://github.com/stefanpenner/ember-cli/issues/1047)
* [BUGFIX] Allow fingerprinting to be enabled/disabled in a more custom way. [#1066](https://github.com/stefanpenner/ember-cli/pull/1066)
* [ENHANCEMENT] Use `ember-addon` as the "addon" keyword. [#1071](https://github.com/stefanpenner/ember-cli/pull/1071)
* [ENHANCEMENT] loader should now support CJS mode of AMD.
* [ENHANCEMENT] Upgrade broccoli-asset-rev to 0.0.6 and allow passing a `customHash` in fingerprint options. [#1024](https://github.com/stefanpenner/ember-cli/pull/1024)

### 0.0.34

* [BUGFIX] broccoli-es6-safe-recast now once again has one-at-a-time semantics this improves incremental rebuild performance
* [BUGFIX] upgrade broccoli-sane-watcher to include better error messages when attempting to watch non-existent files
* [ENHANCEMENT] Allow opting out of `ES3SafeFilter`. [#966](https://github.com/stefanpenner/ember-cli/pull/966)
* [ENHANCEMENT] Provide `--watcher` option for switching between polling and events-based file watching. [#970](https://github.com/stefanpenner/ember-cli/pull/970)
* [BUGFIX] Ensure that tmp/ is cleaned up after running `ember server` or `ember test --server`. [#971](https://github.com/stefanpenner/ember-cli/pull/971)
* [BUGFIX] Fix errors with certain `generate` commands that depend on `inflection`. [f016820](https://github.com/stefanpenner/ember-cli/commit/f016820)
* [BUGFIX] Do not wrap `vendor` assets in eval when `wrapInEval` is set. [#983](https://github.com/stefanpenner/ember-cli/pull/983)
* [ENHANCEMENT] Use `wrapInEval` by default for application assets when running in development. [#983](https://github.com/stefanpenner/ember-cli/pull/983)
* [ENHANCEMENT] Add integration-test blueprint [#985](https://github.com/stefanpenner/ember-cli/pull/985)

### 0.0.33

* [BUGFIX] broccoli-sane-watcher now recovers after filters throw [#940](https://github.com/stefanpenner/ember-cli/pull/940)
* [ENHANCEMENT] Use ember-data.prod.js when ENV=production [#909](https://github.com/stefanpenner/ember-cli/pull/909).
* [BUGFIX] Ensure that config/environment is findable and required when setting up baseURL for server. [#916](https://github.com/stefanpenner/ember-cli/pull/916)
* [BUGFIX] Fix importing of non-JS/CSS [#915](https://github.com/stefanpenner/ember-cli/pull/915)
* [ENHANCEMENT] Use `window.MyProjectNameENV` instead of `window.ENV`. [#922](https://github.com/stefanpenner/ember-cli/pull/922)
* [BUGFIX] Disallow projects with periods in their name. [#927](https://github.com/stefanpenner/ember-cli/pull/927)
* [ENHANCEMENT] Allow customization of Javascript minification options. [#928](https://github.com/stefanpenner/ember-cli/pull/928)
* [BUGFIX] TestServer now waits until the build is done before starting. [#932](https://github.com/stefanpenner/ember-cli/pull/932)
* [ENHANCEMENT] Upgrade `leek` to `0.0.6`. [#934](https://github.com/stefanpenner/ember-cli/pull/934)
* [BUGFIX] `leek` upgrade fixes [#642](https://github.com/stefanpenner/ember-cli/issues/642), [#709](https://github.com/stefanpenner/ember-cli/issues/709)
* [ENHANCEMENT] Allow disabling of automatic fingerprinting. [#930](https://github.com/stefanpenner/ember-cli/pull/930)
* [ENHANCEMENT] Update ember-cli-shims to add `ember-data` shim. [#941](https://github.com/stefanpenner/ember-cli/pull/941)
* [ENHANCEMENT] Update default jshint settings to require importing Ember. [#941](https://github.com/stefanpenner/ember-cli/pull/941)
* [ENHANCEMENT] Bring generators in-house via blueprints. [#747](https://github.com/stefanpenner/ember-cli/pull/747)
* [BUGFIX] Only process application code with ES3SafeFilter. [#949](https://github.com/stefanpenner/ember-cli/pull/949)
* [ENHANCEMENT] Separate application code from vendor code. Generate `/assets/vendor.js` for vendored code. [#949](https://github.com/stefanpenner/ember-cli/pull/949)
* [ENHANCEMENT] Provide `registry` access from `EmberApp`. [#955](https://github.com/stefanpenner/ember-cli/pull/955)
* [BUGFIX] Ensure that `EmberENV` is setup (to allow enabling flagged features). [#958](https://github.com/stefanpenner/ember-cli/pull/958)

### 0.0.29

* [ENHANCEMENT] less CPU intensive watching thanks to @krisselden's https://github.com/krisselden/broccoli-sane-watcher and @amasad's https://github.com/amasad/sane
* [BUGFIX] Upgrade broccoli-es6-concatenator to 0.1.6 to fix a concatenation issue. [broccoli-es6-concatenator#17](https://github.com/joliss/broccoli-es6-concatenator/pull/17)
* [BUGFIX] prevent pointless event emitter memory leak warning [#850](https://github.com/stefanpenner/ember-cli/pull/850)
* [ENHANCEMENT] add and es3 safe transpile step: specifically promise.catch and promise.finally -> promise['catch'] & promise['finally']. In addition we cover afew more variables see: https://github.com/stefanpenner/es3-safe-recast [#823](https://github.com/stefanpenner/ember-cli/pull/823)
* [ENHANCEMENT] Load the vendor.css in the rendered HTML. [#728](http://github.com/stefanpenner/ember-cli/pull/728)
* [ENHANCEMENT] Allow `testem` port to be specified when running `ember test --server`. [#729](https://github.com/stefanpenner/ember-cli/pull/729)
* [BUGFIX] Use EMBER_ENV if specified in ENV_VARIABLES `EMBER_ENV=production ember build`. [#753](https://github.com/stefanpenner/ember-cli/pull/753)
* [ENHANCEMENT] If both EMBER_ENV and --environment are specified, use EMBER_ENV. [#753](https://github.com/stefanpenner/ember-cli/pull/753)
* [ENHANCEMENT] Update broccoli-jshint to 0.5.0 (more efficient caching for faster rebuilds). [#758](https://github.com/stefanpenner/ember-cli/pull/758)
* [ENHANCEMENT] Ensure that the `app/templates/components` directory is created automatically. [#761](https://github.com/stefanpenner/ember-cli/pull/761)
* [BUGFIX] For `ember-init`, Use app name if specified, over package.json or cwd name. [#792](https://github.com/stefanpenner/ember-cli/pull/792)
* [ENHANCEMENT] Add support for Web Notifications for QUnit test suite with ember-qunit-notifications. [#804](https://github.com/stefanpenner/ember-cli/pull/804)
* [BUGFIX] Ensure that files in app/ are JSHinted properly. [#832](https://github.com/stefanpenner/ember-cli/pull/832)
* [ENHANCEMENT] Update ember-load-initializers to 0.0.2.
* [ENHANCEMENT] Add broccoli-asset-rev for fingerprinting + source re-writing. [#814](https://github.com/stefanpenner/ember-cli/pull/814)
* [BUGFIX] Prevent broccoli from watching `node_modules/ember-cli/lib/broccoli/`. [#857](https://github.com/stefanpenner/ember-cli/pull/857)
* [BUGFIX] Prevent collision between running `ember server` and `ember test --server` simultaneously. [#862](https://github.com/stefanpenner/ember-cli/pull/862)
* [ENHANCEMENT] Show timing and slow tree listing for each rebuild. [#860](https://github.com/stefanpenner/ember-cli/pull/860) & [#865](https://github.com/stefanpenner/ember-cli/pull/865)
* [BUGFIX] Disable `wrapInEval` by default. [#866](//github.com/stefanpenner/ember-cli/pull/866)
* [ENHANCEMENT] Allow passing `tests` and `hinting` to `new EmberApp()`. [#876](https://github.com/stefanpenner/ember-cli/pull/876)
* [BUGFIX] Prevent slow tree printout during `ember test --server` from bleeding through `testem` UI.[#877](https://github.com/stefanpenner/ember-cli/pull/877)
* [ENHANCEMENT] Remove unused `vendor/_loader.js` file. [#880](https://github.com/stefanpenner/ember-cli/pull/880)
* [ENHANCEMENT] Allow disabling JSHint tests from within QUnit UI. [#878](https://github.com/stefanpenner/ember-cli/pull/878)
* [ENHANCEMENT] Upgrade `ember-resolver` to `0.1.1` (and lock down version in `bower.json`). [#885](https://github.com/stefanpenner/ember-cli/pull/885)

### 0.0.28

* [FEATURE] The `baseURL` in your `environment.js` now gets the leading and trailing slash automatically if you omit them. [#683](https://github.com/stefanpenner/ember-cli/pull/683)
* [FEATURE] The development server now serves the site under the specified `baseURL`. [#683](https://github.com/stefanpenner/ember-cli/pull/683)
* [FEATURE] Expose server: Bring back the API stub's functionality, give users the opportunity to add their own middleware. [#683](https://github.com/stefanpenner/ember-cli/pull/683)
* [ENHANCEMENT] `project.require()` can now be used to require files from the user's project. [#683](https://github.com/stefanpenner/ember-cli/pull/683)
* [ENHANCEMENT] Plugins can fall back to alternate file extensions (i.e scss, sass)
* [BUGFIX] Fix incorrect generation of all `vendor/` assets in build output. [#645](https://github.com/stefanpenner/ember-cli/pull/645)
* [ENHANCEMENT] Update to Broccoli 0.12. Prevents double initial rebuilds when running `ember server`. [#648](https://github.com/stefanpenner/ember-cli/pull/648)
* [BREAKING ENHANCEMENT] The generated `app.js` and `app.css` files are now named for your application name. [#638](https://github.com/stefanpenner/ember-cli/pull/638)
* [ENHANCEMENT] added first iteration of a slow but thorough acceptance
  test. A new app is generated, depedencies resolve, and the test for
  that base app are run.  [#614](https://github.com/stefanpenner/ember-cli/pull/614)
* [ENHANCEMENT] Use handlebars-runtime in production. [#675](https://github.com/stefanpenner/ember-cli/pull/675)
* [BUGFIX] Do not watch `vendor/` for changes (watching vendor drammatically increases CPU usage). [#693](https://github.com/stefanpenner/ember-cli/pull/693)
* [ENHANCEMENT] Minify CSS [#688](https://github.com/stefanpenner/ember-cli/pull/688)
* [ENHANCEMENT] Allows using app.import for things other than JS and CSS (i.e. fonts, images, json, etc). [#699](https://github.com/stefanpenner/ember-cli/pull/699)
* [BUGFIX] Fix `ember --help` output for test and version commands. [#701](https://github.com/stefanpenner/ember-cli/pull/701)
* [BUGFIX] Fix package.json preprocessor dependencies not being included in the registry. [#703](https://github.com/stefanpenner/ember-cli/pull/703)
* [BUGFIX] Update `testem` version to fix error thrown for certain assertions when running `ember test`, also fixes issue with `ember test --server` in Node 0.10. [#714](https://github.com/stefanpenner/ember-cli/pull/714)

### 0.0.27

* [BUGFIX] ` ENV.LOG_MODULE_RESOLVER` must be set pre-1.6 to get better container logging.
* [FEATURE] Added support for ember-scripts preprocessing.
* [ENHANCEMENT] Refactor `blueprint.js` to remove unnecessary variable assignment, change double iteration to simple reduce, and remove function that only swapped arguments and called through. [#537](https://github.com/stefanpenner/ember-cli/pull/537)
* [ENHANCEMENT] Refactor `test-loader.js` for readability and to prevent unnecessary iterations [#524](https://github.com/stefanpenner/ember-cli/pull/524)
* [ENHANCEMENT] Remove `Ember.setupForTesting` and
  `Router.reopen({location: 'none'});` from test helpers [#516](https://github.com/stefanpenner/ember-cli/pull/516).
* [ENHANCEMENT] Update loom-generators-ember-appkit to `^1.1.1`.
* [BUGFIX] Whitelist `ic-ajax` exports to prevent import validation warnings. [#533](https://github.com/stefanpenner/ember-cli/pull/533)
* [BUGFIX] `ember init` fails on `NULL_PROJECT` ([#546](https://github.com/stefanpenner/ember-cli/pull/546))
* [ENHANCEMENT] Files added by ember-cli should not needed to be specified in `Brocfile.js`. [#536](https://github.com/stefanpenner/ember-cli/pull/536)
* [ENHANCEMENT] Ensure minified output is using `compress` and `mangle` options with `uglify-js`. [#564](https://github.com/stefanpenner/ember-cli/pull/564)
* [BUGFIX] Update to Broccoli 0.10.0. This should resolve the primary issue `ember-cli` has on `Windows`. [#578](https://github.com/stefanpenner/ember-cli/pull/578)
* [ENHANCEMENT] Always Precompile Handlebars templates. [#574](https://github.com/stefanpenner/ember-cli/pull/574)
* [ENHANCEMENT] Update to Broccoli 0.11.0. This provides better timing information for `Watcher`. [#587](https://github.com/stefanpenner/ember-cli/pull/587)
* [ENHANCEMENT] Track rebuild timing. [#588](https://github.com/stefanpenner/ember-cli/pull/587)
* [ENHANCEMENT] Remove global defined helpers in favor of http://api.qunitjs.com/equal http://api.qunitjs.com/strictEqual/, etc. [#579](https://github.com/stefanpenner/ember-cli/pull/579)
* [BREAKING BUGFIX] No longer rely on `broccoli-bower` to automatically import vendored files. Use `app.import` to import dependencies and specify modules to whitelist. [#562](https://github.com/stefanpenner/ember-cli/pull/562)
* [ENHANCEMENT] Removed `proxy-url` and `proxy-host` parameters and introduced `proxy` param with full proxy url. ([#567](https://github.com/stefanpenner/ember-cli/pull/567))
* [BREAKING ENHANCEMENT] Update to jQuery 1.11.1. ** updates `bower.json`
* [ENHANCEMENT] When using non-NPM installed package (aka "running on master") the branch name and SHA are now printed along with the prior version number. [#634](https://github.com/stefanpenner/ember-cli/pull/634)

### 0.0.25

* [BUGFIX] The blueprinted application's `package.json` forces an older version of `ember-cli`. Fixed in [#518](https://github.com/stefanpenner/ember-cli/pull/518).

### 0.0.24

* Changes to `index.html`: Script tags were moved into body, `ENV` and the app are now defined in the same script tag.
* introduce NULL Project, to gracefully handle out-of-project
  invocations of the cli. Like new/init [fixes #502]
* pre 1.0.0 dependency are now locked down to exact versions, post 1.0.0 deps are in good faith semver locked.
* patch to quickfix some broccoli + Windows IO issues. We expect a proper solution soon, but this will hold us over (#493)[https://github.com/stefanpenner/ember-cli/pull/493]
* Add a custom watcher to make broccoli more usable on windows by catching file errors ([493](https://github.com/stefanpenner/ember-cli/pull/493)).
* Allow `ember new` and `ember init` to receive a `blueprint` argument to allow for alternative project scaffolding ([462](https://github.com/stefanpenner/ember-cli/pull/462))
* Add `ember test` with Testem integration ([388](https://github.com/stefanpenner/ember-cli/pull/388)).
* some improvements to bower dependency management, unfortunately until bower.json stabilizes broccoli-bower stability is at the whim of bower component authors.
* introduce maintainable + upgradable ember app specific brocfile filter
  ([396](https://github.com/stefanpenner/ember-cli/pull/396))
* ember cli now attempts to use the project-local ember-cli if
  available, this should help with people who have multiple versions of
  the cli installed. ([5a3c9a](https://github.com/stefanpenner/ember-cli/commit/5a3c9a97e407c128939feb5bd8cd98db2a8e3181))
* Complete restructuring of how ember-cli works internally
* `ember help` now offers nicely colored output
* Extracts shims in vendor into bower package ([#342](https://github.com/stefanpenner/ember-cli/pull/342))
  * locks it to version `0.0.1`
* Extracts initializers autoloading into bower package ([#337](https://github.com/stefanpenner/ember-cli/pull/337))
  * locks it to version `0.0.1`
* Introduces broccoli-bower ([#333](https://github.com/stefanpenner/ember-cli/pull/333))
  * locks it to version `0.2.0`
* Fix issue where app.js files are appended to tests.js ([#347](https://github.com/stefanpenner/ember-cli/pull/347))
* upgrade broccoli to `0.9.0` [v0.9.0 brocfile changes](https://gist.github.com/joliss/15630762fa0f43976418)
* Use configuration from `config/environments.js` to pass options to `Ember.Application.create`. ([#370](https://github.com/stefanpenner/ember-cli/pull/370))
* Adds `ic-ajax` to the list of ignored modules for tests([#378](https://github.com/stefanpenner/ember-cli/pull/378))
* Adds per command help output ([#376](https://github.com/stefanpenner/ember-cli/pull/376))
* Ensures that the broccoli trees are cleaned up properly. ([#444](https://github.com/stefanpenner/ember-cli/pull/444))
* Integrate leek package for ember-cli usage analytics reporting. ([#448](https://github.com/stefanpenner/ember-cli/pull/448))
* Generate current live build to `tmp/output/` when running `ember server`. This is very useful for
  debugging the current Broccoli tree without manually running `ember build`. ([#457](https://github.com/stefanpenner/ember-cli/pull/457))
* Use `tmp/output/` directory created in [#457](https://github.com/stefanpenner/ember-cli/pull/457) for Testem setup.
  This allows using the `testem` command to run Testem in server mode (allowing capturing multiple browsers and other goodies). [#463](https://github.com/stefanpenner/ember-cli/pull/463)
* Added `ember test --server` to run the `testem` command line server. `ember test --server` will automatically re-run your tests after a rebuild. [#474](https://github.com/stefanpenner/ember-cli/pull/474)
* Add JSHinting for `app/` and `test/` trees when building in development. This generates console logs as well as QUnit tests (so that `ember test` shows failures). [#482](https://github.com/stefanpenner/ember-cli/pull/482)
* Use the name specified in `package.json` while doing `ember init`. This allows you to use a different application name than your folder name. [#491](https://github.com/stefanpenner/ember-cli/pull/491)
* Allow disabling live reload via `ember server --live-reload=false`. [#510](https://github.com/stefanpenner/ember-cli/pull/510)

### 0.0.23

* Adds ES6 import validation ([#209](https://github.com/stefanpenner/ember-cli/pull/209))
* CSS broccoli fixes ([#325](https://github.com/stefanpenner/ember-cli/pull/325))
* Speed up boot ([#273](https://github.com/stefanpenner/ember-cli/pull/273))

### 0.0.22

* Makes sure that user cannot create an application named `test`([#256](https://github.com/stefanpenner/ember-cli/pull/256))
* Adds broccoli-merge-trees dependency and updates Brocfile to use it
* Locks blueprint to particular version of ember-cli, broccoli & friends:
  * ember-cli 0.0.21
  * broccoli (v0.7.2)
  * broccoli-es6-concatenator (v0.1.4)
  * broccoli-static-compiler (v0.1.4)
  * broccoli-replace version (v0.1.5)

### 0.0.21

* Use `loader.js` from `bower` ([0c1e8d28](https://github.com/stefanpenner/ember-cli/commit/0c1e8d28ca4bf6d24dc28af1fa4736690394eb5a))
* Drops implementation files ([54df0288](https://github.com/twokul/ember-cli/commit/54df0288cd456aec782f0cbda269c603fe7be005))
* Drop boilerplate tests ([c6f7475e](https://github.com/twokul/ember-cli/commit/c6f7475e0c8b3013b4af8ea5139aa25818aedeaf))
* Use named-amd version of `ic-ajax` ([#225](https://github.com/stefanpenner/ember-cli/pull/225))
* Separate `tests` and `app` code. Tests are now within 'assets/tests.js' (#220).
* Implement `--proxy-port` and `--proxy-host` parameters to `ember server` command (#40)
* Add support for `.ember-cli` file to provide default flags to commands ([7b90bd9](https://github.com/stefanpenner/ember-cli/commit/dfac84ffd27acedfd18189a0e4b0b5d3fb13bd7b))
* Ember initializers are required automatically ([#242](https://github.com/stefanpenner/ember-cli/pull/242))
* Supports alternate preprocessors (eg. broccoli-sass vs. broccoli-ruby-sass) ([59ddbd](https://github.com/stefanpenner/ember-cli/commit/59ddbdf4ce14e8f514d124e158cfdc9708026623))
* Also exposes `registerPlugin` method on preprocessor module that allows anyone to register additional plugins ([59ddbd](https://github.com/stefanpenner/ember-cli/commit/59ddbdf4ce14e8f514d124e158cfdc9708026623))

### 0.0.20

* Run tests through /tests.
* Integrate ember-qunit.
* Makes sure `livereload` reports error from `watcher` ([a1d447fe](https://github.com/stefanpenner/ember-cli/commit/a1d447fe654271f6cf4ea1e6b092a17bc6beed3a))
* Support multiple CSS Preprocessors ([LESS](http://lesscss.org/), [Sass](http://sass-lang.com/) and [Stylus](http://learnboost.github.io/stylus/))
* upgrade broccoli to 0.5.0. slight Brocfile syntax change:

  ```js
  var foo = makeTree("foo")
  // is now just
  var foo = "foo";
  ```
