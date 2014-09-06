---
layout: post
title: "Environments"
permalink: Environments
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-05-environments.md"
---

Ember-CLI ships with support for managing your application's environment. By default, Ember-CLI will build an environment config file at config/environment. Here, you can define an ENV object for each environment (development and production by default).

The ENV object contains two important keys: 1) EmberENV, and 2) APP. The first can be used to define Ember feature flags (see the [Feature Flags guide](http://emberjs.com/guides/configuring-ember/feature-flags/)). The second can be used to pass flags/options to your application instance.

You can access these environment variables in your application code by importing from `../config/environment` or `your-application-name/config/environment`.

For example:

{% highlight javascript linenos %}
import config from 'your-application-name/config/environment';

if (config.ENV.environment === "development") {
  // ...
}
{% endhighlight %}

Ember-CLI assigns `ENV.EmberENV` to `window.EmberENV`, which Ember reads on application initialization.

Additionally, Ember-CLI contains a number of environment-dependent helpers for assets:

- [Env specific assets](#fingerprinting-and-cdn-urls)
- [Env specific asset fingerprinting](#environment-specific-assets)
