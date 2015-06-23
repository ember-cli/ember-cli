---
layout: post
title: "Environments"
permalink: Environments
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-05-environments.md"
---

Ember-CLI ships with support for managing your application's environment. Ember-CLI will build an environment config file at config/environment. Here, you can define an ENV object for each environment (development, test and production). For now, this is limited to the three environments mentioned.

The ENV object contains two important keys: 1) EmberENV, and 2) APP. The first can be used to define Ember feature flags (see the [Feature Flags guide](http://emberjs.com/guides/configuring-ember/feature-flags/)). The second can be used to pass flags/options to your application instance.

You can access these environment variables in your application code by importing from `../config/environment` or `your-application-name/config/environment`.

For example:

{% highlight javascript linenos %}
import ENV from 'your-application-name/config/environment';

if (ENV.environment === 'development') {
  // ...
}
{% endhighlight %}

Ember-CLI assigns `ENV.EmberENV` to `window.EmberENV`, which Ember reads on application initialization.

Additionally, Ember-CLI contains a number of environment-dependent helpers for assets:

- [Env specific assets](#environment-specific-assets)
- [Env specific asset fingerprinting](#fingerprinting-and-cdn-urls)

It is now also possible to override command line options by creating a file in your app's root directory called `.ember-cli` and placing desired overrides in it.

For example, a common desire is to [change the port](http://stackoverflow.com/questions/24003944/save-port-number-for-ember-cli-in-a-config-file) that ember-cli serves the app from. It's possible to pass the port number directly to ember server in the command line, e.g. `ember server --port 8080`. If you wish to make this change a permanent configuration change, make the `.ember-cli` file and add the options you wish to pass to the server in a hash.

{% highlight javascript %}
{
  "port": 8080
}
{% endhighlight %}
