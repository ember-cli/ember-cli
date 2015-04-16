---
layout: post
title: "Building your own Ember"
permalink: building-your-own-ember
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-13-building-your-own-ember.md"
---

There are cases where you need to use your own version of Ember.js. To do that,
the first step is to fork the project on Github and apply your changes. Let's
assume your project's repository is available at
`https://github.com/tomsterpower/ember.js.git`, and that it is the master branch
you wish to use.

First, you need to amend bower.json so that your fork is used:

{% highlight javascript %}
{
  (...)
  "dependencies": {
    "ember": "https://github.com/tomsterpower/ember.js.git#master",
    (...)
  }
}
{% endhighlight %}

You then want to do a clean bower install:

{% highlight bash %}
rm -rf bower_components
bower clean cache
bower install
{% endhighlight %}

Once that is done, a clone of your Ember.js repository has been checked out into
`bower_components/ember`. You still need to build the versions for the different
environments:

{% highlight bash %}
cd bower_components/ember
npm run build
{% endhighlight %}

You should now have the necessary files in `bower_components/ember/dist` and you
now need to tell Broccoli where to find them. Edit `Brocfile.js` to specify
where the development and production versions of Ember are found:

{% highlight javascript %}
var app = new EmberApp({
  (...)
  vendorFiles: {
    'ember.js': {
      development: "bower_components/ember/dist/ember.debug.js",
      production:  "bower_components/ember/dist/ember.prod.js"
    }
  }
  (...)
});
{% endhighlight %}

The last piece of the puzzle is `ember-template-compiler`. By default, Broccoli
will look for it at `bower_components/ember/ember-template-compiler.js` but it
has been built and placed in the dist folder so this needs to be configured,
too. This configuration takes place in `config/environment.js`:

{% highlight javascript %}
module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'tomster-power',
    (...)
    },
    'ember-cli-htmlbars': {
      templateCompilerPath: 'bower_components/ember/dist/ember-template-compiler'
    }
  };
  (...)
}
{% endhighlight %}

Now when you restart `ember serve`, your app should be using your own,
hand-rolled version of Ember.

All you need to do is to automate the building steps in your CI and production
servers.
