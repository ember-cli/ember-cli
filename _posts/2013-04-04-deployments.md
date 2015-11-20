---
layout: post
title: "Deployments"
permalink: deployments
category: user-guide
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-04-deployments.md"
---

You can easily deploy your Ember CLI application to a number of places.

### Heroku

Prerequistes:

- An Ember CLI application
- [Heroku Account](https://www.heroku.com)
- [Heroku Toolbelt](https://toolbelt.heroku.com)

Navigate to your Ember CLI application directory. Now, create your new Heroku application with the Ember CLI buildpack...

{% highlight bash %}
heroku create <OPTIONAL_APP_NAME> --buildpack https://github.com/tonycoco/heroku-buildpack-ember-cli.git
{% endhighlight %}

You should be able to now deploy your Ember CLI application with Heroku's git hooks...

{% highlight bash %}
git commit -am "Empty commit for Heroku deployment" --allow-empty
git push heroku master
{% endhighlight %}

Need to make a custom nginx configuration change? No problem. In your Ember CLI application, add a `config/nginx.conf.erb` file. You can copy the [existing configuration](https://github.com/tonycoco/heroku-buildpack-ember-cli/blob/master/config/nginx.conf.erb) file and make your changes to it.

### Azure
Continuous deployment with [Azure Websites](http://www.azure.com) is enabled through Microsoft's module [ember-cli-azure-deploy](https://github.com/felixrieseberg/ember-cli-azure-deploy). The installation is simple - just run the following commands in your Ember CLI app's root directory:

{% highlight bash %}
npm install --save-dev -g ember-cli-azure-deploy
azure-deploy init
{% endhighlight %}

Next, set up your Azure Website's source control to point to your repo - [either via GitHub, BitBucket, VSO or any of the other available options](http://azure.microsoft.com/en-us/documentation/articles/web-sites-publish-source-control/#Step4). As soon as you push a new commit to your repository, Azure Websites will automatically run `ember build` and deploy the contents of the created `dist` directory to your website's `wwwroot`.

### Firebase
To deploy your Ember CLI application to Firebase, you'll first need to enable hosting from your Firebase's Dashboard. Then, install the [Firebase Tools](https://github.com/firebase/firebase-tools):

{% highlight bash %}
npm install -g firebase-tools
{% endhighlight %}

You can then configure your application for deployment by running the following in your app's root directory and following the prompts:

{% highlight bash %}
firebase init
{% endhighlight %}

Finally, to deploy your application, run:

{% highlight bash %}
firebase deploy
{% endhighlight %}

For more configuration options, check out Firebase's [Hosting Guide](https://www.firebase.com/docs/hosting/guide/).

### History API and Base URL

If you are deploying the app to somewhere other than the root URL (`/`),
you will need to configure the value of `baseUrl` in `config/environment.js`.
For example

{% highlight javascript linenos %}
// config/environment.js
if (environment === 'production') {
  ENV.baseURL = '/path/to/ember/app/';
}
{% endhighlight %}

This value is used to set the value of `base` in `index.html`, e.g. `<base href="/path/to/ember/app/" />`,
as this is required for the History API,
and thus also the Router, to function correctly.

<a id="deploy-content-security-policy"></a>

### Content security policy
To enable the Content Security Policy on your production stack, you'll need to copy the
`Content-Security-Policy` and `X-Content-Security-Policy` (for IE) from the headers generated
by `ember server`. If you'd like to enable it in report-only mode, use `Content-Security-Policy-Report-Only`
and `X-Content-Security-Policy-Report-Only`. Make sure you've set a `report-uri` if you enable
the CSP in report-only mode.

### Deploying an HTTPS server using Nginx on a Unix/Linux/MacOSx machine

The following is a simple deployment with https using nginx.  Http just redirects to the https server here.  Don't forget to include your ssl keys in your config.

Before deployment make sure you run this command to populate the dist directory:

{% highlight bash %}
ember build --environment="production"
{% endhighlight %}

#### File: nginx.conf

    ## Nginx Production Https Ember Server Configuration

    ## https site##
    server {
        listen      443 default;
        server_name <your-server-name>;
        #root        /usr/share/nginx/html;
        root        <root path to an ember /dist directory>;
        index       index.html index.htm;

        # log files
        access_log  /var/log/nginx/<your-server-name>.access.log;
        error_log   /var/log/nginx/<your-server-name>.error.log;

        # ssl files
        ssl on;
        keepalive_timeout   60;

        # include information on SSL keys, cert, protocols and ciphers
        # SSLLabs.com is a great resource for this, along with testing
        # your SSL configuration: https://www.ssllabs.com/projects/documentation/

        # proxy buffers
        proxy_buffers 16 64k;
        proxy_buffer_size 128k;

        ## default location ##
        location / {
            try_files $uri $uri/ /index.html?/$request_uri;
        }

    }

    ## http redirects to https ##
    server {
        listen      80;
        server_name <your-server-name>;

        # Strict Transport Security
        add_header Strict-Transport-Security max-age=2592000;
        rewrite ^/.*$ https://$host$request_uri? permanent;
    }
