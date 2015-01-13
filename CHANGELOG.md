# ember-cli Changelog

# Master

- [ENHANCEMENT] Add option `--insecure-proxy` to `serve` to allow for proxying
  self signed SSL certificates.

### Applications
### Addons
### Blueprints

### 0.1.6

The following changes are required if you are upgrading from the previous
version:

- Users
  + Upgrade your project's ember-cli version - [docs](http://www.ember-cli.com/#project-update)
- Addon Developers
  + No changes required
- Core Contributors
  + Use `expect` over `assert` in tests going forward

#### Community Contributions

- [#2885](https://github.com/ember-cli/ember-cli/pull/2885) [ENHANCEMENT] NPM should use save-exact flags [@chadhietala](https://github.com/chadhietala)
- [#2840](https://github.com/ember-cli/ember-cli/pull/2840) [INTERNAL ]using 'expect' vs. assert. [@Mawaheb](https://github.com/Mawaheb)
- [#2669](https://github.com/ember-cli/ember-cli/pull/2669) [ENHANCEMENT] add .npmignore to addon blueprint [@pogopaule](https://github.com/pogopaule)
- [#2909](https://github.com/ember-cli/ember-cli/pull/2909) [INTERNAL] Use lib/ext/promise instead of RSVP directly [@zeppelin](https://github.com/zeppelin)
- [#2857](https://github.com/ember-cli/ember-cli/pull/2857) [ENHANCEMENT] Add descriptions to more Broccoli trees. [@rwjblue](https://github.com/rwjblue)
- [#2842](https://github.com/ember-cli/ember-cli/pull/2842) [INTERNAL] Prefer `expect` over `assert` for testing [@stavarotti](https://github.com/stavarotti)
- [#2847](https://github.com/ember-cli/ember-cli/pull/2847) [BUGFIX] Bump ember-router-generator (fixes WARN on description not present). [@abuiles](https://github.com/abuiles)
- [#2843](https://github.com/ember-cli/ember-cli/pull/2843) [INTERNAL] Unify using chai.expect [@twokul](https://github.com/twokul)
- [#2900](https://github.com/ember-cli/ember-cli/pull/2900) [INTERNAL] update some CI stuff [@ember-cli](https://github.com/ember-cli)
- [#2876](https://github.com/ember-cli/ember-cli/pull/2876) [BUGFIX] make sure adapter cannot extend from itself [@jakecraige](https://github.com/jakecraige)
- [#2869](https://github.com/ember-cli/ember-cli/pull/2869) [BUGFIX] Tolerate before & after references to missing addons [@ef4](https://github.com/ef4)
- [#2864](https://github.com/ember-cli/ember-cli/pull/2864) [ENHANCEMENT] the .gitkeep in /public can now be removed [@kellyselden](https://github.com/kellyselden)
- [#2887](https://github.com/ember-cli/ember-cli/pull/2887) [INTERNAL] I don’t think we need this anymore. [@ember-cli](https://github.com/ember-cli)
- [#2910](https://github.com/ember-cli/ember-cli/pull/2910) [DOCS] Update org references to ember-cli [@zeppelin](https://github.com/zeppelin)
- [#2911](https://github.com/ember-cli/ember-cli/pull/2911) [DOCS] More org updates to reference ember-cli [@Dhaulagiri](https://github.com/Dhaulagiri)
- [#2916](https://github.com/ember-cli/ember-cli/pull/2916) [BUGFIX] findAddonByName returning incorrect matches [@jakecraige](https://github.com/jakecraige)
- [#2918](https://github.com/ember-cli/ember-cli/pull/2918) [ENHANCEMENT] Updated testem [@johanneswuerbach](https://github.com/johanneswuerbach)
- [#2919](https://github.com/ember-cli/ember-cli/pull/2919) [ENHANCEMENT] implement Blueprint.prototype.addAddonToProject [@jakecraige](https://github.com/jakecraige)
- [#2920](https://github.com/ember-cli/ember-cli/pull/2920) [BUGFIX] explicitly bump broccoli-sourcemap-concat to fix #2890 [@krisselden](https://github.com/krisselden)
- [#2929](https://github.com/ember-cli/ember-cli/pull/2929) [BUGFIX] Bump ember-router-generator. [@abuiles](https://github.com/abuiles)
- [#2939](https://github.com/ember-cli/ember-cli/pull/2939) [ENHANCEMENT] Add a hook for postprocessing tests tree [@ef4](https://github.com/ef4)
- [#2941](https://github.com/ember-cli/ember-cli/pull/2941) [ENHANCEMENT] Bumped testem [@johanneswuerbach](https://github.com/johanneswuerbach)
- [#2944](https://github.com/ember-cli/ember-cli/pull/2944) [INTERNAL] update CONTRIBUTING.md [@jakecraige](https://github.com/jakecraige)

Thank you to all who took the time to contribute!

### 0.1.5

### Applications

- [#2727](https://github.com/ember-cli/ember-cli/pull/2727) Added
  sourcemap support to the JS concatenation and minification steps of
  the build. This eliminates the need for the wrapInEval hack. Any
  Javascript preprocessors that produce sourcemaps will also be
  automatically incorporated into the final result. Sourcemaps are
  enabled by default in dev, to enable them in production pass
  `{sourcemaps: { enabled: true, extensions: ['js']}}` to your
  EmberApp constructor.

- [#2777](https://github.com/ember-cli/ember-cli/pull/2777) allowed
  the creation of components with slashes in their names since this is
  supported in Handlebars 2.0.

- [#2800](https://github.com/ember-cli/ember-cli/pull/2800) Added 3 new commands

  ```
  ember install
  ember install:bower moment
  ember install:npm ember-browserify
  ```

  They behave exactly as you'd expect. Install runs npm and bower
  install on the project. The last two simply pass in the package names
  you give it to the underlying task to do it.

- [#2805](https://github.com/ember-cli/ember-cli/pull/2805) Added the
  `install:addon` command, which installs an addon with NPM and then
  runs the included generator of the same name  if it provides one.

  If the blueprint for the installed addon requires arguments, then
  you can pass them too, for example, the `ember-cli-cordova` addon
  needs an extra argument which you can pass running the command as
  follows: `ember install:addon ember-cli-cordova com.myapp.app`.

- [#2565](https://github.com/ember-cli/ember-cli/pull/2565) added
  support for command options aliases, as well as aliases for
  predefined options, this means that some commands can use aliases
  for their existing options, for example, instead of running `ember g
  route foo --type route` we can now use the -route alias: `ember g
  route foo -route`.

  You can see available aliases for each command running `ember help`,
  they will show as `aliases: ` follow by the alias.

- [#2668](https://github.com/ember-cli/ember-cli/pull/2668) added the
  `prepend` flag to `app.import` in `Brocfile.js`, allowing to prepend
  a file to the vendor bundle rather than appended which is the
  default behaviour.

   ```
   // Brocfile.js
   app.import('bower_components/es5-shim/es5-shim.js', {
     type: 'vendor',
     prepend: true
   });
   ```

- [#2694](https://github.com/ember-cli/ember-cli/pull/2694) disabled
  default lookup & active generation logging in
  `config/environment.js`.

- [#2748](https://github.com/ember-cli/ember-cli/pull/2748) improved
  the router generator to support properly nested routes and
  resources, previously if you had a route similar like:

  ```
  Router.map(function() {
    this.route("foo");
  });
  ```

  And you did `ember g route foo/bar` the generated routes would be

  ```
  Router.map(function() {
    this.route("foo");
    this.route("foo/bar");
  });
  ```

  Now it keeps manages nested routes properly so the result would be:

  ```
  Router.map(function() {
    this.route("foo", function() {
      this.route("bar");
    });
  });
  ```

  Additionally the option `--path` was added so you can do things like
  `ember g route friends/edit --path=:friend_id/id` creating a nested
  route under `friends` like: `this.route('edit', {path: ':friend_id/edit'})`

- [#2734](https://github.com/ember-cli/ember-cli/pull/2734) changed
  the options for editorconfig so it won't remove trailing whitespace
  on .diff files.

- [#2788](https://github.com/ember-cli/ember-cli/pull/2788) added an
  `on('error')` handler to the proxy blueprint, with this your `ember
  server` won't be killed when receiving `socket hang up` from the
  `http-proxy`.

- [#2741](https://github.com/stefanpenner/ember-cli/pull/2741) updated `broccoli-asset-rev` to 2.0.0.

- [#2779](https://github.com/ember-cli/ember-cli/pull/2779) fixed a
  bug in your `.ember-cli` file, if you had a liveReloadPort of say
  "4200" it would not actually end up as that port. This casts the
  string to a number so that the port is set correctly.

- [#2817](https://github.com/ember-cli/ember-cli/pull/2817) added a
  new feature so [Leek](https://github.com/twokul/leek) can be
  configured through your `.ember-cli` file. It means you will be able
  to configure the URLs Leek sends requests to, with this you can plug
  internal tools and track usage patterns.

- [#2828](https://github.com/ember-cli/ember-cli/pull/2828) added the
  option to consume `app.env` before app instance creation in your
  Brocfile, this is useful if you want to pass environment-dependent
  options to the EmberApp constructor in your Brocfile:

  ```
  new EmberApp({
    someOption: EmberApp.env() === 'production' ? 'foo' : 'bar';
  });
  ```
- [#2829](https://github.com/ember-cli/ember-cli/pull/2829) fixed an
  issue on the model-test blueprint which was causing the build to fail
  when the options `needs` wasn't present.

- [#2832](https://github.com/ember-cli/ember-cli/pull/2832) added a
  buildError hook which will be called when an error occurs during the
  `preBuild` or `postBuild` hooks for addons, or when `builder#build`
  fails hook.

- [#2836](https://github.com/ember-cli/ember-cli/pull/2836) added a
  check when passing `--proxy` to `ember server`. If the URL doesn't
  include `http` or `https` then the command will fail since it
  requires the protocol in order to get the proxy working correctly.

#### Addons

- [#2693](https://github.com/ember-cli/ember-cli/pull/2693) fixed an
  issue with blueprints ensuring that last loaded blueprint takes
  precedence.

- [#2805](https://github.com/ember-cli/ember-cli/pull/2805) Added the
  `install:addon` command, which installs an addon with NPM and then
  runs the included generator of the same name if it provides one,
  additionally if you addon generator's name is different to the addon
  name, you can pass the option `defaultBlueprint` in your
  `package.json` and the command will run the generator after
  installed. The following will run `ember g cordova-starter-kit`
  after it has successfully installed `ember-cli-cordova`

  ```
  name: 'ember-cli-cordova',
  'ember-addon': {
    defaultBlueprint: 'cordova-starter-kit'
  }
  ```
- [#2775](https://github.com/ember-cli/ember-cli/pull/2775) added a
  default `.jshintrc` for `in-repo-addons` so they are treated as
  `Node` applications.

### 0.1.4

#### Applications

* [BUGFIX] Use the container from the created Ember.Application for initializer tests. [#2582](https://github.com/stefanpenner/ember-cli/pull/2582)
* [ENHANCEMENT] Add extra contentFor hooks [#2588](https://github.com/stefanpenner/ember-cli/pull/2592)
  * `{{content-for 'head-footer'}}`
  * `{{content-for 'test-head-footer'}}`
  * `{{content-for 'body-footer'}}`
  * `{{content-for 'test-body-footer'}}`

* [BUGFIX] Create separate server blueprint to stop http-{mock,proxy} removing files [#2610](https://github.com/stefanpenner/ember-cli/pull/2610)
* [BUGFIX] Fixes `--proxy` so it proxies correctly to API's under subdomains [#2615](https://github.com/stefanpenner/ember-cli/pull/2615)
* [BUGFIX] Ensure `watchman` does not conflict with NPM's `watchman` package. [#2645](https://github.com/stefanpenner/ember-cli/pull/2645)
* [BUGFIX] Ensure that the generated meta tag is now self closing. [#2661](https://github.com/stefanpenner/ember-cli/pull/2661)

### 0.1.3

#### Applications

  * [#2586](https://github.com/stefanpenner/ember-cli/pull/2586) Set locationType to none in tests.
  * [#2573](https://github.com/stefanpenner/ember-cli/pull/2574) Added --silent option for quieter UI
  * [#2458](https://github.com/stefanpenner/ember-cli/pull/2458) Added additional file watching mechanism: [Watchman](https://facebook.github.io/watchman/)
    This helps resolve the recent Node + Yosemite file watching issues, but also improves file watching (when available) for all `*nix` systems

    What is Watchman?

    Watchman runs as a standalone service, this allows it to manage file-watching for multiple consumers (in our case ember-cli apps)

    How do I used it?
      homebrew: `brew install watchman`
      other: https://facebook.github.io/watchman/docs/install.html
      windows: not supported yet, but it [may happen](https://github.com/facebook/watchman/issues/19)

    What happens if its not installed?

    We fall back to the existing watcher NodeWatcher

    How do I force it to fallback to NodeWatch

    ```sh
    ember <command> --watcher=node
    ```

    Common problem: `invalid watchman found, version: [2.9.8] did not satisfy [^3.0.0]` this basically means you have an older version of watchman installed. Be sure to install `3.0.0` and run `watchman shutdown-server` before re-starting your ember server.

  * [#2265](https://github.com/stefanpenner/ember-cli/pull/2265) Added auto-restarting of server and triggering of LR on `server/*` file changes
  * [#2535](https://github.com/stefanpenner/ember-cli/pull/2535) Updated broccoli-asset-rev to 1.0.0
  * [#2452](https://github.com/stefanpenner/ember-cli/pull/2452) Including [esnext](https://github.com/esnext/esnext) via `ember-cli-esnext` per default
  * [#2518](https://github.com/stefanpenner/ember-cli/pull/2518) improved HTTP logging when using http-mocks and proxy by using [morgan](https://www.npmjs.org/package/morgan)
  * [#2532](https://github.com/stefanpenner/ember-cli/pull/2532) Added support to run specific tests via `ember test --module` and `ember test --filter`
  * [#2514](https://github.com/stefanpenner/ember-cli/pull/2514) Added config.usePodsByDefault for users who wish to have blueprints run in `pod` mode all the time
  * Warn on invalid command options
  * Allow array of paths to the preprocessCss phase
  * Adding --pods support for adapters, serializers, and transforms
  * As part of the Ember 2.0 push  remove controller types.
  * http-mock now follows ember-data conventions
  * many of ember-cli internals now are instrumented with [debug]
    usage: `DEBUG=ember-cli:* ember <command>` to see ember-cli specific verbose logging.
  * Added ember-cli-dependency-checker to app's package.json
  * Added option to disable auto-start of ember app.
  * Added optional globbing to init with `ember init <glob-pattern>`, this allows you to re-blueprint a single file like: `ember init app/index.html`
  * Added support to test the app when built with `--env production`.
  * Update to Ember 1.8.1
  * Update to Ember Data v1.0.0-beta.11
  * [#2351](https://github.com/stefanpenner/ember-cli/pull/2351) Fix automatic generated model belongs-to and has-many relations to resolve test lookup.
  * [#1888](https://github.com/stefanpenner/ember-cli/pull/1888) Allow multiple SASS/LESS files to be built by populating `outputPaths.app.css` option
  * [#2523](https://github.com/stefanpenner/ember-cli/pull/2523) Added `outputPaths.app.html` option
  * [#2472](https://github.com/stefanpenner/ember-cli/pull/2472) Added Pod support for test blueprints.

  Add much more: [view entire diff](https://github.com/stefanpenner/ember-cli/compare/v0.1.2...v0.1.3)

#### Addons

  * [#2505](https://github.com/stefanpenner/ember-cli/pull/2505) Added ability to dynamic add/remove module whitelist entries so that the [ember-browserify](https://github.com/ef4/ember-browserify) addon can work
  * [#2505](https://github.com/stefanpenner/ember-cli/pull/2505) Added an addon postprocess hook for all javascript
  * [#2271](https://github.com/stefanpenner/ember-cli/pull/2271) Added Addon.prototype.isEnabled for an addon to exclude itself from the project at runtime.
  * [#2451](https://github.com/stefanpenner/ember-cli/pull/2451) Ensure that in-repo addons are watched.
  * [#2411](https://github.com/stefanpenner/ember-cli/pull/2411) Add preBuild hook for addons.

### 0.1.2

#### Applications

* [BREAKING ENHANCEMENT] Remove hard-coded support for `broccoli-less-single`, use `ember-cli-less` for `.less` support now. [#2210](https://github.com/stefanpenner/ember-cli/pull/2210)
* [ENHANCEMENT] Provide a helpful error if the configuration info cannot be read from the proper `<meta>` tag. [#2219](https://github.com/stefanpenner/ember-cli/pull/2219)
* [ENHANCEMENT] Allow test filtering from the command line. Running `ember test --filter "foo bar"` or `ember test --server --filter "foo bar"` will limit test runs
  to tests that contain "foo bar" in their module name or test name. [#2223](https://github.com/stefanpenner/ember-cli/pull/2223)
* [ENHANCEMENT] Add a few more `content-for` hooks to `index.html` and `tests/index.html`. [#2236](https://github.com/stefanpenner/ember-cli/pull/2236)
* [ENHANCEMENT] Properly display the file causing build errors in `ember build --watch` and `ember serve` commands. [#2237](https://github.com/stefanpenner/ember-cli/pull/2237), [#2246](https://github.com/stefanpenner/ember-cli/pull/2246), and [#2297](https://github.com/stefanpenner/ember-cli/pull/2297)
* [ENHANCEMENT] Update `broccoli-asset-rev` to 0.3.1. [#2250](https://github.com/stefanpenner/ember-cli/pull/2250)
* [ENHANCEMENT] Add `ember-export-application-global` to allow easier debugging. [#2270](https://github.com/stefanpenner/ember-cli/pull/2270)
* [BUGFIX] Fix default `.gitignore` to properly match `bower_components`. [#2285](https://github.com/stefanpenner/ember-cli/pull/2285)
* [ENHANCEMENT] Display `baseURL` in `ember serve` startup messages. [#2291](https://github.com/stefanpenner/ember-cli/pull/2291)
* [BUGFIX] Fix issues resulting in files outside of `tmp/` being removed due to following of symlinks. [#2290](https://github.com/stefanpenner/ember-cli/pull/2290) and [#2301](https://github.com/stefanpenner/ember-cli/pull/2301)
* [ENHANCEMENT] Add --watcher=polling option to `ember test --server`. This provides a work around for folks having `EMFILE` errors in some scenarios. [#2296](https://github.com/stefanpenner/ember-cli/pull/2296)
* [ENHANCEMENT] Allow opting out of storing the applications configuration in the generated `index.html` via `storeConfigInMeta` option in the `Brocfile.js`. [#2298](https://github.com/stefanpenner/ember-cli/pull/2298)
* [BUGFIX] Update ember-cli-content-security-policy and ember-cli-inject-live-reload packages to latest version. Allows livereload to function properly regardless
  of host (0.1.0 always assumed `localhost` for the livereload server). [#2306](https://github.com/stefanpenner/ember-cli/pull/2306)
* [ENHANCEMENT] Update internal dependencies to latest versions. [#2307](https://github.com/stefanpenner/ember-cli/pull/2307)
* [BUGFIX] Allow overriding of vendor files to not loose required ordering. [#2312](https://github.com/stefanpenner/ember-cli/pull/2312)
* [ENHANCEMENT] Add `bowerDirectory` to `Project` model (discovered on initialization). [#2287](https://github.com/stefanpenner/ember-cli/pull/2287)

#### Addons

* [ENHANCEMENT] Allow addons to inject middleware into testem. [#2128](https://github.com/stefanpenner/ember-cli/pull/2128)
* [ENHANCEMENT] Add {{content-for 'body'}} to `app/index.html` and `tests/index.html`. [#2236](https://github.com/stefanpenner/ember-cli/pull/2236)
* [ENHANCEMENT] Add {{content-for 'test-head'}} to `tests/index.html`. [#2236](https://github.com/stefanpenner/ember-cli/pull/2236)
* [ENHANCEMENT] Add {{content-for 'test-body'}} to `tests/index.html`. [#2236](https://github.com/stefanpenner/ember-cli/pull/2236)
* [ENHANCEMENT] Allow adding multiple bower packages at once via `Blueprint.prototype.addBowerPackagesToProject`. [#2222](https://github.com/stefanpenner/ember-cli/pull/2222)
* [ENHANCEMENT] Allow adding multiple NPM packages at once via `Blueprint.prototype.addPackagesToProject`. [#2245](https://github.com/stefanpenner/ember-cli/pull/2245)
* [ENHANCEMENT] Ensure generated addons are in strict mode. [#2295](https://github.com/stefanpenner/ember-cli/pull/2295)
* [BUGFIX] Ensure that addon's with `addon/styles/app.css` are able to compile properly (copying contents of `addon/styles/app.css` into `vendor.css`). [#2301](https://github.com/stefanpenner/ember-cli/pull/2301)
* [ENHANCEMENT] Provide the `httpServer` instance to `serverMiddleware` (and `./server/index.js`). [#2302](https://github.com/stefanpenner/ember-cli/issues/2302)

#### Blueprints

* [ENHANCEMENT] Tweak helper blueprint to make it easier to test. [#2257](https://github.com/stefanpenner/ember-cli/pull/2257)
* [ENHANCEMENT] Streamline initializer and service blueprints. [#2260](https://github.com/stefanpenner/ember-cli/pull/2260)

### 0.1.1

* [BUGFIX] Fix symlink regression in Windows (update broccoli-file-remover to 0.3.1). [#2204](https://github.com/stefanpenner/ember-cli/pull/2204)

### 0.1.0

* [ENHANCEMENT] Add symlinking to speed up Broccoli builds. [#2125](https://github.com/stefanpenner/ember-cli/pull/2125)
* [BUGFIX] Fix issue with livereload in 0.0.47. [#2176](https://github.com/stefanpenner/ember-cli/pull/2176)
* [BUGFIX] Change content security policy addon to use report only mode by default. [#2190](https://github.com/stefanpenner/ember-cli/pull/2190)
* [ENHANCEMENT] Allow addons to customize their ES6 module prefix (for `addon` tree). [#2189](https://github.com/stefanpenner/ember-cli/pull/2189)
* [BUGFIX] Ensure all addon hooks are executed in addon test harness. [#2195](https://github.com/stefanpenner/ember-cli/pull/2195)

### 0.0.47

#### Applications

* [ENHANCEMENT] Add `--pod` option to blueprints for generate and destroy. Add `fileMapTokens` hook to blueprints, and optional
  blueprint file tokens `__path__` and `__test__` for pod support. [#1994](https://github.com/stefanpenner/ember-cli/pull/1994)
* [ENHANCEMENT] Provide better error messages when uncaught errors occur during `ember build` and `ember serve`. [#2043](https://github.com/stefanpenner/ember-cli/pull/2043)
* [ENHANCEMENT] Do not use inline `<script>` tags.  Set the stage for enabling content security policy. [#2058](https://github.com/stefanpenner/ember-cli/pull/2058)
* [ENHANCEMENT] Add [ember-cli-content-security-policy](https://github.com/rwjblue/ember-cli-content-security-policy) addon
  when running development server (see [content-security-policy.com](http://content-security-policy.com/) for details). [#2065](https://github.com/stefanpenner/ember-cli/pull/2065)
* [BREAKING] Remove `environment` and `getJSON` options to `EmberApp` (in the `Brocfile.js`).
* [ENHANCEMENT] Add `configPath` option to `EmberApp` (in the `Brocfile.js`) to allow using a custom file for obtaining configuration
  information. [#2068](https://github.com/stefanpenner/ember-cli/pull/2068)
* [BUGFIX] Use url.parse instead of manually checking baseURL. This allows `app://localhost/` URLs needed for node-webkit. [#2088](https://github.com/stefanpenner/ember-cli/pull/2088)
* [BUGFIX] Remove duplicate warning when generating controllers. [#2066](https://github.com/stefanpenner/ember-cli/pull/2066)
* [BREAKING ENHANCEMENT] Move `config` information out of the `assets/my-app-name.js` file and into a `<meta>` tag in the document `head`. [#2086](https://github.com/stefanpenner/ember-cli/pull/2086)
  * Removes `<my-app-name>/config/environments/*` from module system output.
  * Makes build output the same regardless of environment config.
  * Makes injection of custom config information as simple as adding/modifying/customizing the meta contents.
* [BREAKING BUGFIX] Update `loader.js` entry in `bower.json` to use the proper name.

  This requires editing `bower.json` to change:

```
  "loader": "stefanpenner/loader.js#1.0.1",
```

To:

```
  "loader.js": "stefanpenner/loader.js#1.0.1",
```
* [BREAKING ENHANCEMENT] Replace `{{BASE_TAG}}` in `index.html` with `{{content-for 'head'}}`. [#2153](https://github.com/stefanpenner/ember-cli/pull/2153)

#### Addons

* [BUGFIX] `addon/` directory is no longer required when running local development server inside an addon. [#2044](https://github.com/stefanpenner/ember-cli/pull/2044)
* [BUGFIX] Use the specified name for the addon (was previously using `dummy` for all addon's names). [#2042](https://github.com/stefanpenner/ember-cli/pull/2042)
* [ENHANCEMENT] Add `Registry.prototype.remove` to make it easier to remove preprocessor plugins. [#2048](https://github.com/stefanpenner/ember-cli/pull/2048)
* [ENHANCEMENT] Add `Registry.prototype.extensionsForType` to make it easier to detect what extensions are support for a given type
  of file (`js`, `css`, or `template` files). [#2050](https://github.com/stefanpenner/ember-cli/pull/2050)
* [BUGFIX] Allow `addon` tree to contain any filetype that is known by the JS preprocessor registry. [#2054](https://github.com/stefanpenner/ember-cli/pull/2054)
* [BUGFIX] Ensure that addons cannot override the application configuration (in the `config` hook). [#2133](https://github.com/stefanpenner/ember-cli/pull/2133)
* [ENHANCEMENT] Allow addons to implement `contentFor` method to add string output into the associated
  `{{content-for 'foo'}}` section in `index.html`. [#2153](https://github.com/stefanpenner/ember-cli/pull/2153)

#### Blueprints

* [ENHANCEMENT] Add `description` for blueprints created by `ember generate blueprint`. [#2062](https://github.com/stefanpenner/ember-cli/pull/2062)
* [ENHANCEMENT] Add `in-repo-addon` generator. [#2072](https://github.com/stefanpenner/ember-cli/pull/2072)
* [ENHANCEMENT] Add `before` and `after` options to `Blueprint.prototype.insertIntoFile`. [#2122](https://github.com/stefanpenner/ember-cli/pull/2122)
* [ENHANCEMENT] Allow `git` based application blueprints. [#2103](https://github.com/stefanpenner/ember-cli/pull/2103)

### 0.0.46

* [BUGFIX] Addons shared the same `treePaths` and `treeForMethods` listing. This meant that an addon changing `this.treePaths.vendor` (for example) would modify where
  ALL addons looked for their vendor trees. [#2035](https://github.com/stefanpenner/ember-cli/pull/2035)

### 0.0.45

#### Applications

* [BREAKING ENHANCEMENT] Moved `modulePrefix` to `config/environment.js`. [#1933](https://github.com/stefanpenner/ember-cli/pull/1933)
* [BREAKING ENHANCEMENT] Remove `window.MyAppNameENV`. You will now need to import the configuration instead of relying on using the global.  [#1903](https://github.com/stefanpenner/ember-cli/pull/1903).

```javascript
import ENV from '<appName>/config/environment';
ENV.API_HOST; // example.com
```

* [ENHANCEMENT] Allowing config of asset output paths. [#1904](https://github.com/stefanpenner/ember-cli/pull/1904)
* [ENHANCEMENT] Add a default `.ember-cli` file and document disableAnalytics. [#1801](https://github.com/stefanpenner/ember-cli/pull/1801)
* [BUGFIX] Add location type for test environment. This generally makes using `ember test` with a custom baseURL work properly. [#1915](https://github.com/stefanpenner/ember-cli/pull/1915)
* [ENHANCEMENT] Allow multiple pre-processors per type (for example, using `broccoli-sass` AND `broccoli-less` is now possible). [#1918](https://github.com/stefanpenner/ember-cli/pull/1918)
* [ENHANCEMENT] Update `startApp` to provide app configuration. [#1329](https://github.com/stefanpenner/ember-cli/pull/1329)
* [BUGFIX] Remove manual `env === 'production'` checks. [#1929](https://github.com/stefanpenner/ember-cli/pull/1929)
* [BUGFIX] Fixed an issue where project.config() could be called with undefined environment when starting express server. [#1959](https://github.com/stefanpenner/ember-cli/pull/1959)
* [ENHANCEMENT] Improve blueprint self-documentation by adding additional details to `ember help generate`. [#1279](https://github.com/stefanpenner/ember-cli/pull/1279)
* [ENHANCEMENT] Update `broccoli-asset-rev`to `0.1.1`. [#1945](https://github.com/stefanpenner/ember-cli/pull/1945)
* [ENHANCEMENT] Update app blueprint's `package.json`/`bower.json` to depend on ember-data. [#1873](https://github.com/stefanpenner/ember-cli/pull/1873)
* [BUGFIX] Ensure that things loaded by server/index.js override addons. This changes the middleware ordering so that the app's middlewares are loaded *before*
  the internal middlewares. [#2008](https://github.com/stefanpenner/ember-cli/pull/2008)
* [BUGFIX] Removed broccoli-sweetjs from the internal preprocessor registry. [#2014](https://github.com/stefanpenner/ember-cli/pull/2014)
* [ENHANCEMENT] Pull `podModulePrefix` from config/environment.js. [#2024](https://github.com/stefanpenner/ember-cli/pull/2024)
* [BUGFIX] Exit with a non-zero exit code (to indicate failure), and provide a nice error message if `ember test` runs nothing. [#2025](https://github.com/stefanpenner/ember-cli/pull/2025)

#### Addons

* [ENHANCEMENT] Allow addons to return a public tree. By default anything in an addon's `public/` folder will be copied into a folder for that addon's name
in the output path. [#1930](https://github.com/stefanpenner/ember-cli/pull/1930)
* [BUGFIX] Remove extra nesting of `addon/styles` tree. Previously, the addon styles tree was looking for `addon/styles/styles/`. [#1964](https://github.com/stefanpenner/ember-cli/pull/1964)
* [ENHANCEMENT] Add `config` hook for addons. [#1972](https://github.com/stefanpenner/ember-cli/pull/1972)
* [BUGFIX] Ensure we do not add `ember-addon` twice when running `ember init` (to upgrade an addon). [#1982](https://github.com/stefanpenner/ember-cli/pull/1982)
* [BUGFIX] Allow `addon/templates` to be properly available inside the `my-addon-name.js` file with the correct module name. [#1983](https://github.com/stefanpenner/ember-cli/pull/1983)

#### Blueprints

* [ENHANCEMENT] Add empty function to resource blueprint when resource is singular. [#1946](https://github.com/stefanpenner/ember-cli/pull/1946)
* [BUGFIX] Do not inject application route into app/router.js. [#1953](https://github.com/stefanpenner/ember-cli/pull/1953)
* [ENHANCEMENT] Add `Blueprint.prototype.lookupBlueprint` which allows a blueprint to lookup other Blueprints. This makes it much easier to provide Blueprints that
  augment existing internal blueprints without having to copy and override them completely. [#2016](https://github.com/stefanpenner/ember-cli/pull/2016)

### 0.0.44

#### Applications

* [BUGFIX] Provide useful error message when `app/styles/app.ext` is not found. [#1866](https://github.com/stefanpenner/ember-cli/pull/1866) and [#1894](https://github.com/stefanpenner/ember-cli/pull/1894)
* [ENHANCEMENT] Updated dependency broccoli-es3-safe-recast. [#1891](https://github.com/stefanpenner/ember-cli/pull/1898) and [#1898](https://github.com/stefanpenner/ember-cli/pull/1898)
* [ENHANCEMENT] Updated dependency broccoli-merge-trees. [#1891](https://github.com/stefanpenner/ember-cli/pull/1898) and [#1898](https://github.com/stefanpenner/ember-cli/pull/1898)
* [ENHANCEMENT] Updated dependency fs-extra. [#1891](https://github.com/stefanpenner/ember-cli/pull/1898) and [#1898](https://github.com/stefanpenner/ember-cli/pull/1898)
* [ENHANCEMENT] Updated dependency proxy-middleware. [#1891](https://github.com/stefanpenner/ember-cli/pull/1898) and [#1898](https://github.com/stefanpenner/ember-cli/pull/1898)
* [ENHANCEMENT] Updated dependency tiny-lr. [#1891](https://github.com/stefanpenner/ember-cli/pull/1898) and [#1898](https://github.com/stefanpenner/ember-cli/pull/1898)
* [BUGFIX] Update `broccoli-caching-writer` to fix performance regression. [#1901](https://github.com/stefanpenner/ember-cli/pull/1901)
* [BUGFIX] Ensure that a `.bowerrc` without `directory` specified does not error. [#1902](https://github.com/stefanpenner/ember-cli/pull/1902)

#### Addons

* [BUGFIX] Allow addons with styles to function properly. [#1892](https://github.com/stefanpenner/ember-cli/pull/1892)

#### Blueprints

* [BUGFIX] Fix `ember g http-mock foo` output to pass JSHint. [#1896](https://github.com/stefanpenner/ember-cli/pull/1896)

### 0.0.43

#### Applications

* [BUGFIX] Fix ember init command in empty directory. [#1779](https://github.com/stefanpenner/ember-cli/pull/1779)
* [ENHANCEMENT] Add triggerEvent to `tests/.jshintrc`. [#1782](https://github.com/stefanpenner/ember-cli/pull/1782)
* [ENHANCEMENT] Allow opting out of analytics via `.ember-cli` config file. [#1797](https://github.com/stefanpenner/ember-cli/pull/1797)
* Bump `ember-cli-qunit` version.
* [BUGFIX] Update broccoli-caching-writer dependents to allow linking fallback (enables easier usage of ember-cli from within Vagrant). [#1799](https://github.com/stefanpenner/ember-cli/pull/1799)
* [BUGFIX] Avoid issue where `ember init` stalls on fresh system due to `bower install` prompting for permission to use analytics. [#1805](https://github.com/stefanpenner/ember-cli/pull/1805)
* [BUGFIX] Allow usage of standard Node.js functionality in `config/environments.js` (fixes a regression in 0.0.42). [#1809](https://github.com/stefanpenner/ember-cli/pull/1809)
* [ENHANCEMENT] Make current environment available modules. [#1820](https://github.com/stefanpenner/ember-cli/pull/1820)
* [BUGFIX] Ensures that AppNameENV and EmberENV are setup before the vendor files have been loaded (changes in 0.0.42 caused enabling Ember feature flags impossible from `config/environments.js`). [#1825](https://github.com/stefanpenner/ember-cli/pull/1825)
* [ENHANCEMENT] Ensures that the `<base>` tag changes when the config file is updated. [#1825](https://github.com/stefanpenner/ember-cli/pull/1825)
* [ENHANCEMENT] Injects the `/tests/index.html` with the test environment configuration (was previously whatever server was running). [#1825](https://github.com/stefanpenner/ember-cli/pull/1825)
* [ENHANCEMENT] `bower_components` and `vendor` are kept separate for import purposes. When we moved to separate directories for
  `bower_components/` and `vendor/` in 0.0.41, to allow for users to upgrade easier we merged those two folders into one single `vendor`
  tree.  This meant that you would still `app.import('vendor/baz/foo.js')` and `import Foo from 'vendor';` even if the file actually resides in
  `bower_components/`. This lead to much confusion and forced users to understand the internals that are going on (merging the two directories into `vendor/`).
  Now you would import things from `bower_components/` or `vendor/` if that is where they were on disk. [#1836](https://github.com/stefanpenner/ember-cli/pull/1836)
* [BUGFIX] Allow nested output path, if path does not previously exist. [#1872](https://github.com/stefanpenner/ember-cli/pull/1872)
* [ENHANCEMENT] Update `ember-cli-qunit` to 0.1.0. To avoid vendoring files in the addon and prevent having to run `bower install` within the addon
  itself (in a `postinstall` hook) the addon now installs its required packages directly into the applications `bower.json` file.
  This speeds up the build and make addon development much easier.  [#1877](https://github.com/stefanpenner/ember-cli/pull/1877)

#### Blueprints

* [BUGFIX] `ember g http-proxy` does not truncate the base path on proxied requests. [#1874](https://github.com/stefanpenner/ember-cli/pull/1874)
* [ENHANCEMENT] Add empty function to `ember g resource` generator. [#1817](https://github.com/stefanpenner/ember-cli/pull/1817)
* [ENHANCEMENT] Add {{outlet}} by default when generating a route template. [#1819](https://github.com/stefanpenner/ember-cli/pull/1819)
* [ENHANCEMENT] Remove use of deprecated `view.state` property. [#1826](https://github.com/stefanpenner/ember-cli/pull/1826)
* [BUGFIX] Allow blueprints without files. [#1829](https://github.com/stefanpenner/ember-cli/pull/1829)
* [ENHANCEMENT] Make `ember g adapter` extend from application adapter if present. [#1831](https://github.com/stefanpenner/ember-cli/pull/1831)
* [ENHANCEMENT] Add --base-class options to `ember g adapter`. [#1831](https://github.com/stefanpenner/ember-cli/pull/1831)
* [BUGFIX] Quote module name in object literal for `ember g http-mock`. [#1823](https://github.com/stefanpenner/ember-cli/pull/1823)
* [ENHANCEMENT] Add `Blueprint.prototype.addBowerPackageToProject`. [#1830](https://github.com/stefanpenner/ember-cli/pull/1830)
* [ENHANCEMENT] Add `Blueprint.prototype.insertIntoFile`. [#1857](https://github.com/stefanpenner/ember-cli/pull/1857)

#### Addons

* [ENHANCEMENT] Expose Addon.prototype.isDevelopingAddon function. [#1785](https://github.com/stefanpenner/ember-cli/pull/1785)
* [ENHANCEMENT] Expose Addon.prototype.treeGenerator function, that automatically handles the
  returning an unwatchedTree vs the bare directory (therefore causing it to be watched). [#1785](https://github.com/stefanpenner/ember-cli/pull/1785)
* [ENHANCEMENT] Add default `Addon.prototype.blueprintsPath` implementation. Now if an addon has a `blueprints/` folder, it will be automatically used
  as the `blueprintsPath`. [#1876](https://github.com/stefanpenner/ember-cli/pull/1876)

### 0.0.42

* [ENHANCEMENT] Throw an error if an Addon does not specify a name. [#1741](https://github.com/stefanpenner/ember-cli/pull/1741)
* [ENHANCEMENT] Extract `CoreObject` into a standalone package (`core-object`). [#1752](https://github.com/stefanpenner/ember-cli/pull/1752)
* [ENHANCEMENT] Set a default `baseURL` in `test` to allow `testem` to function properly with a custom `baseURL` specified. [#1748](https://github.com/stefanpenner/ember-cli/pull/1748)
* [BUGFIX] Update `broccoli-concat` to solve a performance issue with the recent addon changes (allows better caching when no changes are detected). [#1757](https://github.com/stefanpenner/ember-cli/pull/1757) and [#1766](https://github.com/stefanpenner/ember-cli/pull/1766)
* [BUGFIX] Bring `.bowerrc` file back for `app` blueprint. Helps alleviate upgrade issues, and ensures a parent directories `.bowerrc` cannot break an ember-cli app. [#1761](https://github.com/stefanpenner/ember-cli/pull/1761)
* [ENHANCEMENT] Update and clarify the default project README. [#1768](https://github.com/stefanpenner/ember-cli/pull/1768)
* [BUGFIX] Ensure that `app.import`'ed assets can be properly watched (and trigger a reload upon change). [#1774](https://github.com/stefanpenner/ember-cli/pull/1774)
* [BUGFIX] Ensure that `postBuild` hook is called on addons during `ember build`. [#1775](https://github.com/stefanpenner/ember-cli/pull/1775)
* [BREAKING ENHANCEMENT] Enabled automatic reloads on `config/environment.js` changes. [#1777](https://github.com/stefanpenner/ember-cli/pull/1777)
* [BREAKING ENHANCEMENT] Export the current configuration to a module (`my-app-name/config/environment'). [#1777](https://github.com/stefanpenner/ember-cli/pull/1777)

### 0.0.41

* [ENHANCEMENT] Allow calling `this._super.someMethodName()` in subclasses of CoreObject. [#1721](https://github.com/stefanpenner/ember-cli/pull/1721)
* [ENHANCEMENT] `.jshintrc`: disable esnext Promise global (prevents issues when RSVP Promise was intended but
  (non-universally-implemented) global Promise was used instead. [#1723](https://github.com/stefanpenner/ember-cli/pull/1723)
* [BUGFIX] Prevent deletion of files when invalid output-path is provided. [#1649](https://github.com/stefanpenner/ember-cli/pull/1649)
* [BUGFIX] Fix the /tests URL in IE8. [#1707](https://github.com/stefanpenner/ember-cli/pull/1707)
* [ENHANCEMENT] Remove `.bowerrc` file from application blueprint (will still use directory specified in `.bowerrc`, but uses the default
  of `bower_components/` if no `.bowerrc` exists). [#1679](https://github.com/stefanpenner/ember-cli/pull/1679)
* [BUGFIX] Fixes support for `.ember-cli` settings file. [#1676](https://github.com/stefanpenner/ember-cli/pull/1676)
* [BUGFIX] Blueprint: replace multiple occurences of `__name__` with module name. [#1658](https://github.com/stefanpenner/ember-cli/pull/1658)
* [ENHANCEMENT] Replace internal live-reload middleware with addon. [#1643](https://github.com/stefanpenner/ember-cli/pull/1643)
* [ENHANCEMENT] Add .travis.yml to app blueprint. [#1636](https://github.com/stefanpenner/ember-cli/pull/1636)
* [ENHANCEMENT] Allow individual Blueprints to determine if an entity name is required. [#1631](https://github.com/stefanpenner/ember-cli/pull/1631)
* [ENHANCEMENT] Move `qunit` support into an addon. [#1295](https://github.com/stefanpenner/ember-cli/pull/1295)
* [BUGFIX] Running `ember new foo-bar --dry-run` does not create new directory. [#1602](https://github.com/stefanpenner/ember-cli/pull/1602)
* [ENHANCEMENT] Allow addons to return an `addon` tree that will be namespaced with the addons name. [#1544](https://github.com/stefanpenner/ember-cli/pull/1544)
* [BUGFIX] Ensure non `assets/` files can be served from `public/` or when added via `app.import` (using the `destDir`). [#1549](https://github.com/stefanpenner/ember-cli/pull/1549)
* [ENHANCEMENT] Update `ember-resolver` version (allows for components and their templates to be grouped together). [#1540](https://github.com/stefanpenner/ember-cli/pull/1540)
* [ENHANCEMENT] Update `testem` version. [#1539](https://github.com/stefanpenner/ember-cli/pull/1539)
* [ENHANCEMENT] Remove `originate` from application blueprint.
* [ENHANCEMENT] Add EditorConfig file to blueprints. [#1507](https://github.com/stefanpenner/ember-cli/pull/1507)
* [ENHANCEMENT] Add `Blueprint#beforeInstall". [#1498](https://github.com/stefanpenner/ember-cli/pull/1498)
* [ENHANCEMENT] Add `--type` option (and check) to `controller` and `route` generators. [#1498](https://github.com/stefanpenner/ember-cli/pull/1498)
* [BUGFIX] Call `normalizeEntityName` hook before `locals` hook [#1717](https://github.com/stefanpenner/ember-cli/pull/1717)
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
* [ENHANCEMENT] Add `ember destroy` command (removes files added by `generate` command). [#1547](https://github.com/stefanpenner/ember-cli/pull/1547)
* [BUGFIX] Ensure router.js is not modified when ember g route foo --dry-run [#1570](https://github.com/stefanpenner/ember-cli/pull/1570)
* [ENHANCEMENT] Add possibility to hide #ember-testing-container while testing [#1579](https://github.com/stefanpenner/ember-cli/pull/1579)
* [BUGFIX] Fix EmberAddon vendor tree [#1606](https://github.com/stefanpenner/ember-cli/pull/1606)
* [ENHANCEMENT] Addon blueprint [#1374](https://github.com/stefanpenner/ember-cli/pull/1374)
* [BUGFIX] Fix addons with empty directories [#]()
* [BUGFIX] Fix tests/helpers/start-app.js location from addon generator [#1626](https://github.com/stefanpenner/ember-cli/pull/1626)
* [BUGFIX] Allow addons to use history support middleware [#1632](https://github.com/stefanpenner/ember-cli/pull/1632)
* [ENHANCEMENT] Upgrade `broccoli-ember-hbs-template-compiler` to `1.6.1`.
* [ENHANCEMENT] Allow file patterns to be ignored by LiveReload [#1706](https://github.com/stefanpenner/ember-cli/pull/1706)
* [BUGFIX] Switch to OS-friendly line endings [#1718](https://github.com/stefanpenner/ember-cli/pull/1718)
* [BUGFIX] Prevent file deletions when the build `--output-path` is a parent directory [#1730](https://github.com/stefanpenner/ember-cli/pull/1730)

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
