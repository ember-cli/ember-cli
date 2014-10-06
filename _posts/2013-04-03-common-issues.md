---
layout: post
title: "Common Issues"
permalink: commonissues
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-03-common-issues.md"
---

### Content security policy

Ember-cli comes bundled with the [ember-cli-content-security-policy](https://github.com/rwjblue/ember-cli-content-security-policy) addon which enables the [Content Security Policy](http://content-security-policy.com/) in modern browsers when running the development server. 

Enabeling the Content Security Policy (by sending the `Content-Security-Policy` header) reduces the risks of XSS attacks. The default header sent by the addon sends a policy where only content from `'self'` is allowed. This means that by default, the browser will restrict your app from loading assets and data outside of `localhost:4200` or doing any inline style or script modifications. If your app does any of these, you'll see a lot of these errors:

{% highlight bash %}
Refused to execute inline script because it violates the following Content Security Policy directive: ...
{% endhighlight %}

You can modify the CSP for you app by setting the `contentSecurityPolicy` option in your configuration:

{% highlight javascript %}
if (environment === 'development') {
  ENV.contentSecurityPolicy = {
    'default-src': "'none'",
    // Allow Google Analytics, Google AJAX CDN, Same Origin and eval statements (needed for ember-cli)
    'script-src': "'self' 'unsafe-eval' www.google-analytics.com ajax.googleapis.com",
    'font-src': "'self'",
    // Allow data (ajax) requests to some-api.local
    'connect-src': "'self' some-api.local",  
    'img-src': "'self'",
    // Allow inline styles
    'style-src': "'self' 'unsafe-inline'"
  }
}
{% endhighlight %}

**More information**

* More information on the `contentSecurityPolicy` option is available in the [addon readme](https://github.com/rwjblue/ember-cli-content-security-policy).
* More information on the Content Security Policy can be found on [content-security-policy.com](http://content-security-policy.com/).


### npm package management with sudo

Installing packages such as bower with sudo powers can lead to permissions
issues and ultimately to problems installing dependencies.

For example

{% highlight bash %}
Uncaught Error: Could not find module ember/resolver loader/loader.js:42
{% endhighlight %}

can be caused by installing bower with sudo. See https://gist.github.com/isaacs/579814 for a collection of various solutions.

### Installing from behind a proxy

If you're behind a proxy, you might not be able to install because `ember-cli` &mdash; or some of its dependencies &mdash; tries to `git clone` a `git://` url. (In this scenario, only `http://` urls will work).

You'll probably get an error like this:

{% highlight bash %}
npm ERR! git clone git://github.com/jgable/esprima.git Cloning into bare repository '/home/<username>/.npm/_git-remotes/git-github-com-jgable-esprima-git-d221af32'...
npm ERR! git clone git://github.com/jgable/esprima.git 
npm ERR! git clone git://github.com/jgable/esprima.git fatal: unable to connect to github.com:
npm ERR! git clone git://github.com/jgable/esprima.git github.com[0: 192.30.252.129]: errno=Connection timed out
npm ERR! Error: Command failed: fatal: unable to connect to github.com:
npm ERR! github.com[0: 192.30.252.129]: errno=Connection timed out
{% endhighlight %}

This is not a `ember-cli` issue _per se_, but here's a workaround. You can configure `git` to make the translation:

```bash
git config --global url."https://".insteadOf git://
```

### Usage with SublimeText 3

If you are using SublimeText 3 with `ember-cli`, by default it will try to index all files in your `tmp` directory for its GoToAnything functionality.  This will cause your computer to come to a screeching halt @ 90%+ CPU usage.  Simply remove these directories from the folders ST3 watches:

`Sublime Text -> Preferences -> Settings -User`

{% highlight javascript %}
// folder_exclude_patterns and file_exclude_patterns control which files
// are listed in folders on the side bar. These can also be set on a per-
// project basis.
"folder_exclude_patterns": [".svn", ".git", ".hg", "CVS", "tmp/*"]
{% endhighlight %}

### Using canary build instead of release

In bower.json instead of a version number use:

    "ember": "components/ember#canary",

And, following `dependencies` add `resolutions`:

    "resolutions": {
      "ember": "canary"
    }

This can also be applied to Ember Data:

    "ember-data": "components/ember-data#canary",

And, adding to `resolutions`:

    "resolutions": {
      "ember-data": "canary"
    }


Wipe your vendor directory clean then run `bower install`.


### Removing default ember-cli libraries

* To use ember-cli without Ember Data

`npm rm ember-data --save-dev`

* To use ember-cli without ic-ajax

`npm rm ember-cli-ic-ajax --save-dev`


### Solving performance issues on windows

Build times on windows are longer than on linux or mac os. Much of that penalty is not because of node or ember-cli, but because of things monitoring your filesystem. If you can (selectively!) disable your virus scanner and the Search Index Host, you will see a substantial speedup. Here's how:

#### Disable Windows Search Index for temporary files

* Go to your **control panel** (Windows 8: `Win+X`, choose "control panel")
* Look for **Indexing Options** (Screenshot says "Indizierungsoptionen")
* Select the location that will most likely contain your project. Usually in **User** (Screenshot: "Benutzer")
* Click **Change** or "Edit" (Screenshot: "Ändern")
* This brings up a directory tree with checkboxes. Navigate to your project dir and **remove the checkbox for /tmp** or anywhere else you'd like.
* Click **OK**

![Partially Disable Search Index on Windows 8]({{ site.url }}/assets/images/common-issues/search-index.jpg)

#### Disable Windows Defender for temporary files

Windows defender will be active by default on any Windows 8 machine. On Windows 7 (or earlier) you might have Windows Security Essentials installed, which works pretty similar.

While you can exclude more than just the temporary files, this would also render a virus scanner pretty useless. Excluding temporary files won't make you any less safe. Everything that ends up there would have been in `/app` or `/vendor` before.

* Hit your Windows Key, then start typing "defen" which should bring up "Defender as first result". Start it.
* In Windows Defender, Choose the Settings Tab, Then the "excluded files and directories" Line. (screenshot says "Ausgeschlossene Dateien und Sp...")
* Click "Browse" (first button on the right, screenshot says "Durchsuchen")
* Navigate to your project's tmp dir.
* Click OK
* Click "Add" (Second button, screenshot says "Hinzufügen")
* Click "Save changes" (Left button at the bottom, screenshot says "Änderungen speichern")
![Exclude Temp Files from Windows Defender]({{ site.url }}/assets/images/common-issues/win-defender-dir.jpg)

