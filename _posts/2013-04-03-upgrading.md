---
layout: post
title: "Upgrading"
permalink: upgrading
category: user-guide
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-03-upgrading.md"
---

### Upgrading an Ember CLI App

Steps to upgrade to the latest version of Ember CLI are included with [each
release](https://github.com/stefanpenner/ember-cli/releases), but these are the
common steps one would follow to update Ember CLI using NPM from within your
project directory.

#### Setup

* Remove old global ember-cli

    {% highlight bash %}
    npm uninstall -g ember-cli
    {% endhighlight %}

* Clear NPM cache

    {% highlight bash %}
    npm cache clean
    {% endhighlight %}

* Clear Bower cache

    {% highlight bash %}
    bower cache clean
    {% endhighlight %}

* Install a new global ember-cli, replacing X.X.X with the version of ember-cli
  you want to install

    {% highlight bash %}
    npm install -g ember-cli@X.X.X
    {% endhighlight %}

#### Project Update

* Delete temporary development directories

    {% highlight bash %}
    rm -rf node_modules bower_components dist tmp
    {% endhighlight %}

* Update your project's `package.json` file to use the latest version of
  ember-cli, replacing X.X.X with the version of ember-cli you want to install

    {% highlight bash %}
    npm install ember-cli@X.X.X --save-dev
    {% endhighlight %}

* Reinstall NPM and Bower dependencies

    {% highlight bash %}
    npm install && bower install
    {% endhighlight %}

* Run the new project blueprint on your projects directory. Please follow the
  prompts, and review all changes (tip: you can see a diff by pressing d).

    {% highlight bash %}
    ember init
    {% endhighlight %}

The most common sources of upgrade pain are not clearing out old packages in the
first step of the project update and missing a change in the last step of the
project update.  Please review each change from the last step carefully to
ensure you both have not missed a change from the upgrade and that you have not
accidentally removed code you may have added to your project during your work.

When the upgrade process has completed, you should be able to issue the `ember
-v` command and see that the `version:` noted in the resulting output matches
the version you just upgraded to.
