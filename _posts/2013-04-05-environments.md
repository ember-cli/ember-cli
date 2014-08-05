---
layout: post
title: "Environments"
permalink: Environments
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-05-environments.md"
---

Ember-CLI ships with support for managing your application's environment. By default, Ember-CLI will build an environment config file at config/environment. Here, you can define an ENV object for each environment (development and production by default).

The ENV object contains two important keys: 1) EmberENV, and 2) APP. The first can be used to define Ember feature flags (see the [Feature Flags guide](http://emberjs.com/guides/configuring-ember/feature-flags/)). The second can be used to pass flags/options to your application instance.

By default, Ember-CLI assigns `ENV.EmberENV` to `window.EmberENV`, which Ember reads on application initialization. Further, it assigns the ENV object to `window.YourApplicationNameENV`. You can access environment variables inside your application by traversing this global window property.

Additionally, Ember-CLI contains a number of environment-dependent helpers for assets:

- [Env specific assets](#fingerprinting-and-cdn-urls)
- [Env specific asset fingerprinting](#environment-specific-assets)
