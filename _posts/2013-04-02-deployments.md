---
layout: post
title: "Deployments"
permalink: deployments
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-02-deployments.md"
---

You can easily deploy your Ember CLI application to a number of places.

### Heroku

Prerequistes:

- An Ember CLI application
- [Heroku Account](https://www.heroku.com)
- [Heroku Toolbelt](https://toolbelt.heroku.com)

Change directories to your Ember CLI application's. Now, create your new Heroku application with the Ember CLI buildpack...

{% highlight bash %}
heroku create <OPTIONAL_APP_NAME> --buildpack https://github.com/tonycoco/heroku-buildpack-ember-cli.git
{% endhighlight %}

You should be able to now deploy your Ember CLI application with Heroku's git hooks...

{% highlight bash %}
git commit -am "Empty commit for Heroku deployment" --allow-empty
git push heroku master
{% endhighlight %}

Need to make a custom nginx configuration change? No problem. In your Ember CLI application, add a `config/nginx.conf.erb` file. You can copy the [existing configuration](https://github.com/tonycoco/heroku-buildpack-ember-cli/blob/master/config/nginx.conf.erb) file and make your changes to it.
