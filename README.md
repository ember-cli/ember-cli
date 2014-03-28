## ember-cli [![Build Status](https://travis-ci.org/stefanpenner/ember-cli.png?branch=master)](https://travis-ci.org/stefanpenner/ember-cli)

an ember commandline utility.


## Warning

Although potentially exciting, this is still really a WIP, use at your own risk.

## Why?

The [ember-app-kit](https://github.com/stefanpenner/ember-app-kit) project has proved to be quite useful, 
we have learned lots, and it allowed us to iterate quickly while building real ambitious applications.

While it's initial incarnation is useful, it has several meta problems:

1. It is not "simple" and appears daunting
2. Because of inline configuration, the api surface area is massive
3. #2 does not allow users to express the "what" just the "how", this prevents EAK from doing more of the heavy lifting itself
4. [#2 #3] makes it quite tedious to upgrade

## Rationale for #3

If we want to upgrade or swap in a faster build pipeline it would be a major pain currently. But with #3, in theory it should be minimal pain.

## Guidelines

+ convention over configuration. (look to rails)
  + we should provide internal configuration/implementation to satisfy the 'what' with the how.
+ simple > easy
+ the current contents of `tasks/*` should reside in the ember executables library
+ the pipeline-related Broccoli configuration should also reside in the above mentioned library.

## Usage

### Getting Started

```bash
npm install -g ember-cli

ember new my-cool-app
cd my-cool-app
ember server
```

### Current Commands

```bash
ember build <env-name>
ember server
ember init [app-name] [--dry-run] [--skip-npm-install]
ember new  [app-name]
```

### Developing

You may want to use `npm link` to make your local source directory a globally installed package.
See [npm-developers](https://www.npmjs.org/doc/misc/npm-developers.html).

#### Running tests

Once:

```bash
npm test
```

On every file change:

```bash
npm run-script autotest
```

#### LESS, Sass, or Stylus

You can use [LESS](http://lesscss.org/), [Sass](http://sass-lang.com/) *(scss only)*, or [Stylus](http://learnboost.github.io/stylus/) by installing the corresponding Broccoli package (`broccoli-sass`, `broccoli-less-single` or `broccoli-stylus-single`).

For example, to enable SCSS compilation:

```bash
npm install --save-dev broccoli-sass
```

#### Contributing

Submit a pull request (code + tests) and make sure to add the change to [CHANGELOG.md](https://github.com/stefanpenner/ember-cli/blob/master/CHANGELOG.md).

Building will now compile `app/styles/app.scss` into `app.css` in your output.

#### Ideas

+ excutable (this project)

  ```bash
  ember
  ember init  <app-name>
  ember build <env-name> [default: development] [optional: target path]
  ember server
    --autotest   [default: false]
    --port       [default: 8000]
    --subscribe  [default:release, optional: (beta|canary)]
                 # on "start" of an app, it will prompt the user if the channel they
                 # subscribe to has an update.
                 # if an update occured. they are asked [yes, no] to try the update (using bower)
                 #   (what about other libs? ember-data or components or..)
    --env        [default: development] # allow previewing the various build envs.
    --app        [default: .]

  ember generate [...]
  ember generate scaffold [...] # for resources

  ember addon # reserved for future use.
  ```

+ folder structure: (very similar to what we currently have)

  ```bash
  app/*            # like EAK today
  tasks/           # custom user tasks
  vendor/          # mostly for bower, some non-bower stuff will reside.
  tests/           # tests test config and test helpers.
  tmp/*            # created on demand, but scratch pad for EAK.
  Brocfile.js      # should contain a mechanism for default ember tasks to be loaded
                   # should be the place for users to define custom broccoli related things.
  package.json
  bower.json
  .gitignore
  .travis
  .jshintrc
  ```

+ configuration

  ```bash
  server.js                    # for adding additional connect middleware (like a proxy to the backend)
  Brocfile                     # default tasks will exist in "ember"
  tasks/                       # custom user tasks
  ```

+ detect `.js`, `.coffee`, `.styl`, `.scss`, `.sass` and use the appropriate filter, or throw with useful error.

  ```javascript
  new Error('Tried compiling: `app.coffee` but CoffesScript is missing, to install please: `npm install coffee-script --save-dev`')
  ```

+ tasks (consider extracting them into `broccoli-ember`)
