---
layout: default
title: "Managing Dependencies"
permalink: dependencies.html
---
Ember App Kit uses [Bower](http://bower.io/) for dependency management.

### Bower Configuration

The Bower configuration file, `bower.json`, is located at the root of your EAK
project, and lists the dependencies for your project.  Changes to your
dependencies should be managed through this file, rather than manually
installing packages individually.

Executing `bower install` will install all of the dependencies listed in
`bower.json` in one step.

EAK is configured to have git ignore your `vendor` directory by default. Using
the Bower configuration file allows collaborators to fork your repo and get
their dependencies installed locally by executing `bower install` themselves.

EAK watches `bower.json` for changes. Thus it reloads your app if you install
new dependencies via `bower install --save <dependencies>`.

Further documentation about Bower is available at their
[official documentation page](http://bower.io/).
