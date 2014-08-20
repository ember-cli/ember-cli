# ember-cli Changelog

* [ENHANCEMENT] replace multiple instances of __name__ in blueprints.
* [ENHANCEMENT] adds http-proxy for explicit, multi proxy use[#1474](https://github.com/stefanpenner/ember-cli/pull/1530)
* [BREAKING ENHANCEMENT] renames apiStub to http-mock to match other http-related generators [#1474] (https://github.com/stefanpenner/ember-cli/pull/1530)
* [ENHANCEMENT] Log proxy server traffic when using `ember serve --proxy` [#1583](https://github.com/stefanpenner/ember-cli/pull/1583)
* [ENHANCEMENT] Remove chain from express server [#1474](https://github.com/stefanpenner/ember-cli/pull/1474)
* [ENHANCEMENT] Remove Blueprint lookup failure stacktrace [#1476](https://github.com/stefanpenner/ember-cli/pull/1476)
* [ENHANCEMENT] --verbose errors option to have SilentError output stacktrace [#1480](https://github.com/stefanpenner/ember-cli/pull/1480)
* [BUGFIX] Modify service blueprint to create explicit injection [#1493](https://github.com/stefanpenner/ember-cli/pull/1493)
* [ENHANCEMENT] Generating a helper now also generates a test [#1503](https://github.com/stefanpenner/ember-cli/pull/1503)
* [BUGFIX] Do not run JSHint against trees returned from an addon.
* [BREAKING ENHANCEMENT] Addons can pull in test assets into test tree [#1453](https://github.com/stefanpenner/ember-cli/pull/1453)
* [BREAKING ENHANCEMENT] Addon model's \_root renamed to root [#1537](https://github.com/stefanpenner/ember-cli/pull/1537)
* [ENHANCEMENT] Addons can recursively add other addons [#1509](https://github.com/stefanpenner/ember-cli/pull/1509)
* [ENHANCEMENT] Upgrade `loader.js` to `1.0.1`. [#1543](https://github.com/stefanpenner/ember-cli/pull/1543)
* [BUGFIX] Allow `public/` to contain files in the root of the project. [#1549](https://github.com/stefanpenner/ember-cli/pull/1549)
* [ENHANCEMENT] Add `robots.txt` and `crossdomain.xml` files in the root of the project. [#1550](https://github.com/stefanpenner/ember-cli/pull/1550)
* [BUGFIX] Generating mixins and utils with several levels of nesting no longer produces a failing test. [#1551](https://github.com/stefanpenner/ember-cli/pull/1551)
* [BREAKING ENHANCEMENT] bower assets moved to bower_components instead of vendor [#1436](https://github.com/stefanpenner/ember-cli/pull/1436)
* [ENHANCEMENT] Move history support into a separate internal addon. [#1552](https://github.com/stefanpenner/ember-cli/pull/1552)
* [ENHANCEMENT] don't assume value of bowerrc.directory [#1553](https://github.com/stefanpenner/ember-cli/pull/1553)
* [ENHANCEMENT] es6 namespaced addons [#1544](https://github.com/stefanpenner/ember-cli/pull/1544)
* [ENHANCEMENT] Removed use of `memoize` from EmberApp. Allows multiple EmberApps to be instantiated [#1361](https://github.com/stefanpenner/ember-cli/issues/1361)
* [ENHANCEMENT] Add `ember destroy` command [#1547](https://github.com/stefanpenner/ember-cli/pull/1547)
* [BUGFIX] Ensure router.js is not modified when ember g route foo --dry-run [#1570](https://github.com/stefanpenner/ember-cli/pull/1570)
* [ENHANCEMENT] Add possibility to hide #ember-testing-container while testing [#1579](https://github.com/stefanpenner/ember-cli/pull/1579)
* [BUGFIX] Fix EmberAddon vendor tree [#1606](https://github.com/stefanpenner/ember-cli/pull/1606)
* [ENHANCEMENT] Addon blueprint [#1374](https://github.com/stefanpenner/ember-cli/pull/1374)
* [BUGFIX] Fix addons with empty directories [#]()
* [BUGFIX] Fix tests/helpers/start-app.js location from addon generator [#1626](https://github.com/stefanpenner/ember-cli/pull/1626)
* [BUGFIX] Allow addons to use history support middleware [#1632](https://github.com/stefanpenner/ember-cli/pull/1632)
* [ENHANCEMENT] Upgrade `broccoli-ember-hbs-template-compiler` to `1.6.1`.

### 0.0.40

* [BUGFIX] fix detection of static files to allow periods in urls [#1399](https://github.com/stefanpenner/ember-cli/pull/1399)
* [BUGFIX] fix processing of import statements in css [#1400](https://github.com/stefanpenner/ember-cli/pull/1400)
* [BUGFIX] fix detection of requests to be proxied [#1263](https://github.com/stefanpenner/ember-cli/pull/1263)
* [BUGFIX] fix ember update (broken promises) [#1265](https://github.com/stefanpenner/ember-cli/pull/1265)
* [BUGFIX] eagerly requireing inquirer was costing ~100ms -> 150ms on boot [https://github.com/stefanpenner/ember-cli/commit/0ae78df5b4772b126facfed1d3203e9c695e80a1)
* [BUGFIX] Fix issue with invalid warnings (regarding files in the root of `vendor/`) on Windows. [#1264](https://github.com/stefanpenner/ember-cli/issues/1264)
* [BUGFIX] Fix addons being unable to use `app.import` to pull in non-js/css assets from their own `vendor/` tree. [#1159](https://github.com/stefanpenner/ember-cli/pull/1159)
* [ENHANCEMENT] When using `app.import` to import non-js/css assets, you can now specify the destination of the asset. [#1159](https://github.com/stefanpenner/ember-cli/pull/1159)
* [BUGFIX] Fix issue with `ember build` failing if the public/ folder was deleted. [#1270](https://github.com/stefanpenner/ember-cli/issues/1270)
* [BREAKING ENHANCEMENT] CoffeeScript support is now brought in by `ember-cli-coffeescript`. To use CoffeeScript with future versions run `npm install --save-dev ember-cli-coffeescript` (and `broccoli-coffee` is no longer needed as a direct dependency). [#1289](https://github.com/stefanpenner/ember-cli/pull/1289)
* [BUGFIX] `Blueprint.prototype.normalizeEntityName`'s return value should update the entity name. [#1283](https://github.com/stefanpenner/ember-cli/issues/1283)
* [BREAKING ENHANCEMENT] Move test only js/css assets into test-vendor.js and test-vendor.css respectively. [#1288](https://github.com/stefanpenner/ember-cli/pull/1288)
* [ENHANCEMENT] Update default Ember version to 1.6.0.
* [ENHANCEMENT] Display friendly error message when the server fails to start (e.g. address in use). [#1306](https://github.com/stefanpenner/ember-cli/pull/1306)
* [BREAKING ENHANCEMENT] Rename test-vendor.{css,js} to test-support.{css,js} to better reflect its role. [#1320](https://github.com/stefanpenner/ember-cli/pull/1320)
* [BUGFIX] Store version check information correctly, and only change the `lastVersionCheckAt` timestamp when the version is checked from npm. [#1323](https://github.com/stefanpenner/ember-cli/pull/1323)
* [BUGFIX] Update `broccoli-es3-safe-recast` to fix bugs with incorrectly replaced segments. [#1340](https://github.com/stefanpenner/ember-cli/pull/1340)
* [ENHANCEMENT] EmberApp can take jshintrc path options for app and test jshintrc files. [#1341](https://github.com/stefanpenner/ember-cli/pull/1341)
* [ENHANCEMENT] Using broccoli-sass > 0.2.0 now allows you to use .sass files. [#1367](https://github.com/stefanpenner/ember-cli/pull/1367)
* [ENHANCEMENT] EmberAddon constructor to build an EmberApp object with defaults for addon projects. [#1343](https://github.com/stefanpenner/ember-cli/pull/1343)
* [ENHANCEMENT] Allow addons to be vendored outside of node modules [#1370](https://github.com/stefanpenner/ember-cli/pull/1370)
* [ENHANCEMENT] Make "ember version" show NPM and Node version (versions of all loaded modules with "--verbose" switch). [#1307](https://github.com/stefanpenner/ember-cli/pull/1307)
* [BUGFIX] Duplicate-checking for generating routes now accounts for `"`-syntax. [#1371](https://github.com/stefanpenner/ember-cli/pull/1371)
* [BREAKING BUGFIX] Standard variables passed in to Blueprints now handle slashes better. Breaking if you relied on the old behavior. [#1278](https://github.com/stefanpenner/ember-cli/pull/1278)
* [BUGFIX] Generating a route named 'basic' no longer adds it to router.js. [#1390](https://github.com/stefanpenner/ember-cli/pull/1390)
* [ENHANCEMENT] EmberAddon constructor defaults `process.env.EMBER_ADDON_ENV` to "development". [#]()
* [ENHANCEMENT] Tests now run with the "test" environment by default, `config/environment.js` contains an (empty) section for the "test" environment [#1401](https://github.com/stefanpenner/ember-cli/pull/1401)
* [ENHANCEMENT] Add Git initialization to `ember new` command [#1369](https://github.com/stefanpenner/ember-cli/pull/1369)
* [ENHANCEMENT] Addons can export an object instead of a function [#1377](https://github.com/stefanpenner/ember-cli/pull/1377)
* [ENHANCEMENT] Addons will automatically load a generic addon constructor that includes app/vendor trees based on treesFor property if no main key is specified in package.json. [#1377](https://github.com/stefanpenner/ember-cli/pull/1377)
* [ENHANCEMENT] Disable `LOG_RESOLVER` flag to reduce console.log noise by default. [#1431](https://github.com/stefanpenner/ember-cli/pull/1431)
* [ENHANCEMENT] Update `broccoli-asset-rev`to `0.0.17`
* [ENHANCEMENT] Upgrade `ember-qunit` to `0.1.8`. [#1427](https://github.com/stefanpenner/ember-cli/pull/1427)
* [BUGFIX] Fix pod based templates (was broken with the advent of the `templates` tree). [#4138](https://github.com/stefanpenner/ember-cli/pull/1438)
* [ENHANCEMENT] ExpressServer middleware extracted to addons that are always pulled into every Project first [#1446](https://github.com/stefanpenner/ember-cli/pull/1446)

### 0.0.39

* [BUGFIX] `ember build --watch` should run until SIGTERM. [#1197](https://github.com/stefanpenner/ember-cli/issues/1197)
* [BUGFIX] Failed build should return non-zero exit code. [#1169](https://github.com/stefanpenner/ember-cli/pull/1169)
* [BUGFIX] improve startup time by up to 3x
* [BUGFIX] Ensure `ember generate` always operate in relation to project root. [#1165](https://github.com/stefanpenner/ember-cli/pull/1165)
* [ENHANCEMENT] Upgrade `ember-cli-ember-data` to `0.1.0`. [#1178](https://github.com/stefanpenner/ember-cli/pull/1178)
* [BUGFIX] Update `ember-cli-ic-ajax` to prevent warnings. [#1180](https://github.com/stefanpenner/ember-cli/pull/1180)
* [BUGFIX] Throw error when trailing slash present in argument to `ember generate`. [#1184](https://github.com/stefanpenner/ember-cli/pull/1184)
* [ENHANCEMENT] Don't expect `Ember` or `Em` to be global in tests. `Ember` or `Em` needs to be imported. [#1201](https://github.com/stefanpenner/ember-cli/pull/1201)
* [BUGFIX] Make behaviour of `--dry-run` more obvious & add `--skip-npm` and `--skip-bower`. [#1205](https://github.com/stefanpenner/ember-cli/pull/1205)
* [ENHANCEMENT] Remove .gitkeep files from `ember init` inside an existing project [#1209](https://github.com/stefanpenner/ember-cli/pull/1209)
* [ENHANCEMENT] Addons can add commands to the local `ember` command. [#1196](https://github.com/stefanpenner/ember-cli/pull/1196)
* [ENHANCEMENT] Addons can implement a postBuild hook. [#1215](https://github.com/stefanpenner/ember-cli/pull/1215)
* [ENHANCEMENT] Addons can add post-processing steps to the `Brocfile.js` process. [#1214](https://github.com/stefanpenner/ember-cli/pull/1214)
* [ENHANCEMENT] `broccoli-asset-rev` has been moved to an addon using the standard addon post-processing hooks. [#1214](https://github.com/stefanpenner/ember-cli/pull/1214)
* [ENHANCEMENT] Allow `app.toTree` to accept an array of additional trees to merge in the final output. [#1214](https://github.com/stefanpenner/ember-cli/pull/1214)
* [BUGFIX] Only run JSHint after preprocessing. [#1221](https://github.com/stefanpenner/ember-cli/pull/1221)
* [ENHANCEMENT] Addons can add blueprints. [#1222](https://github.com/stefanpenner/ember-cli/pull/1222)
* [ENHANCEMENT] Allow testing of production assets. [#1230](https://github.com/stefanpenner/ember-cli/pull/1230)
* [ENHANCEMENT] Provide Ember CLI version to Project model. [#1239](https://github.com/stefanpenner/ember-cli/pull/1239)
* [BREAKING ENHANCEMENT] Split `app/templates` into its own tree to prevent preprocessing template files as if they were JavaScript. [#1238](https://github.com/stefanpenner/ember-cli/pull/1238)
* [ENHANCEMENT] Print a warning when using `app.import` for assets in the root of `vendor/` (this is a significant performance penalty).
* [ENHANCEMENT] Model generation no longer requires an attribute type. [#1252](https://github.com/stefanpenner/ember-cli/pull/1252)
* [ENHANCEMENT] Allow vendor files to be configurable. [#1187](https://github.com/stefanpenner/ember-cli/pull/1187)


### 0.0.38

* accidentally deploy with node v0.0.11 which builds an invalid package

### 0.0.37

* [BREAKING BUGFIX] ensure the CLI exits with the correct status, fixes hanging tests and some non-graceful exit cleanups [#1150](https://github.com/stefanpenner/ember-cli/pull/1150)
* [BUGFIX] Ensure EDITOR is set before allowing edit in ember init. [#1090](https://github.com/stefanpenner/ember-cli/pull/1090)
* [BUGFIX] Display message to user when diff cannot be applied cleanly [#1091](https://github.com/stefanpenner/ember-cli/pull/1091)
* [ENHANCEMENT] Notify when an ember-cli update is available, and add `ember update` command. [#899](https://github.com/stefanpenner/ember-cli/pull/899)
* [BUGFIX] Ensure that build output directory is cleaned up properly. [#1122](https://github.com/stefanpenner/ember-cli/pull/1122)
* [BUGFIX] Ensure that non-zero exit code is used when running `ember test` with failing tests. [#1123](https://github.com/stefanpenner/ember-cli/pull/1123)
* [BREAKING ENHANCEMENT] Change the expected interface for the `./server/index.js` file. It now receives the instantiated `express` server. [#1097](https://github.com/stefanpenner/ember-cli/pull/1097)
* [ENHANCEMENT] Allow addons to provide server side middlewares. [#1097](https://github.com/stefanpenner/ember-cli/pull/1097)
* [ENHANCEMENT] Automatically pluralize the attribute when generating a model. [#1120](https://github.com/stefanpenner/ember-cli/pull/1120)
* [BUGFIX] Make sure non-dasherized model attributes are also added to generated tests. [#1120](https://github.com/stefanpenner/ember-cli/pull/1120)
* [ENHANCEMENT] Upgrade `ember-qunit-notifications` to `0.0.3`. [#1117](https://github.com/stefanpenner/ember-cli/pull/1117)
* [ENHANCEMENT] Allow addons to specify load ordering. [#1132](https://github.com/stefanpenner/ember-cli/pull/1132)
* [ENHANCEMENT] Adds `ember build --watch` [#1131](https://github.com/stefanpenner/ember-cli/pull/1131)
* [BREAKING ENHANCEMENT] Accept options as second parameter of ember-app#import. Pass modules as exports. [#1121](https://github.com/stefanpenner/ember-cli/pull/1121)

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
