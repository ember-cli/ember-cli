
ember-cli
==============================================================================

[![Latest NPM release][npm-badge]][npm-badge-url]
[![TravisCI Build Status][travis-badge]][travis-badge-url]
[![AppVeyor Build Status][appveyor-badge]][appveyor-badge-url]
[![Test Coverage][coveralls-badge]][coveralls-badge-url]
[![Code Climate][codeclimate-badge]][codeclimate-badge-url]

[logo]: https://avatars0.githubusercontent.com/u/10262982?v=3&s=150
[npm-badge]: https://img.shields.io/npm/v/ember-cli.svg
[npm-badge-url]: https://www.npmjs.com/package/ember-cli
[travis-badge]: https://img.shields.io/travis/ember-cli/ember-cli/master.svg?label=TravisCI
[travis-badge-url]: https://travis-ci.org/ember-cli/ember-cli
[appveyor-badge]: https://img.shields.io/appveyor/ci/embercli/ember-cli/master.svg?label=AppVeyor
[appveyor-badge-url]: https://ci.appveyor.com/project/embercli/ember-cli/branch/master
[coveralls-badge]: https://img.shields.io/coveralls/ember-cli/ember-cli/master.svg
[coveralls-badge-url]: https://coveralls.io/github/ember-cli/ember-cli
[codeclimate-badge]: https://img.shields.io/codeclimate/github/ember-cli/ember-cli.svg
[codeclimate-badge-url]: https://codeclimate.com/github/ember-cli/ember-cli

The Ember.js command line utility.


Features
------------------------------------------------------------------------------

- Asset build pipeline using [Broccoli.js](http://broccolijs.com/)
- ES6 transpilation using [Babel](http://babeljs.io/)
- Project structure conventions using ES6 module syntax
- Development server including live-reload and API proxy
- File/Project generator using blueprints
- Unit, Integration and Acceptance test support using
  [Testem](https://github.com/testem/testem)
- Powerful addon system for extensibility


Installation
------------------------------------------------------------------------------

```
npm install -g ember-cli
```

Usage
------------------------------------------------------------------------------

After installation the `ember` CLI tool will be available to you. It is the
entrypoint for all the functionality mentioned above.

You can call `ember <command> --help` to find out more about all of the
following commands or visit <http://ember-cli.com/user-guide/> to read
the in-depth documentation.


### Create a new project

```
ember new my-new-app
```

This will create a new folder `my-new-app`, initialize a Git project in it,
add the basic Ember.js project structure and install any necessary NPM and
Bower dependencies.


### Create a new addon project

```
ember addon my-new-addon
```

This is essentially similar to `ember new` but will generate the structure
for an ember-cli addon instead.


### Build the project

```
ember build
```

This will create a `dist` folder and run the build pipeline to generate all
the output files in it. You can specify `--environment=production` to build
in production mode, which includes code minification and other optimizations.


### Run the development server

```
ember serve
```

This will launch a development server that will automatically rebuild your
project on file changes and serves the built app at <http://localhost:4200/>.


### Run the test suite

```
ember test
```

This command will start the Testem runner, which will run all your tests from
the `tests` folder. This command also supports a `--server` option which will
automatically run tests on file changes.


### Generate files

```
ember generate route foo
```

This will generate a `route` named `foo`. `route` is an example here and can
be replaced by any other available blueprint. Blueprints are provided by
ember-cli itself and any of you installed addons. Run `ember generate --help`
to see a list of available blueprints in your project and their options.


### Install an ember-cli addon

```
ember install some-other-addon
```

This will search NPM for a package named `some-other-addon`, install it and
run any additional install steps defined in the addon.


Community
------------------------------------------------------------------------------

- Slack: [Get your invite](https://ember-community-slackin.herokuapp.com/)
- IRC: #ember-cli on [freenode](https://webchat.freenode.net/?channels=%23ember-cli)
- Issues: [ember-cli/issues](https://github.com/ember-cli/ember-cli/issues)
- Website: [ember-cli.com](http://ember-cli.com)


Development
------------------------------------------------------------------------------

Start by cloning the Git project to your local hard drive:

```
git clone https://github.com/ember-cli/ember-cli.git
```

### Link `ember` to your development version


Running the following command will link the global `ember` utility to your
local development version:

```
npm link
```

Note that the global `ember` CLI utility will automatically relay to any
project-local ember-cli installation. If you want to use your development
version there instead run the following command from your Ember.js
project folder:

```
npm link ember-cli
```

Read the official [npm-link documentation](https://www.npmjs.org/doc/cli/npm-link.html)
for more information.


### Run the test suite

```
npm test
```

will run ESLint and the "fast" subset of the test suite. Run
`npm run test-all` for the full test suite which will currently take quite a
few minutes due to heavy IO and network usage.

ember-cli is using [Mocha](https://mochajs.org/) for its internal tests. If
you want to run a specific subset of tests have a look at their
[documentation](https://mochajs.org/#exclusive-tests).


## Build the documentation

Use `npm run docs` to build HTML and JSON documentation with YUIDoc and place
it in `docs/build/`. Please help by improving this documentation.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE).
