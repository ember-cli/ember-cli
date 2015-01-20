---
layout: post
title: "Common Issues"
permalink: commonissues
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-03-common-issues.md"
---

### Content security policy

Ember CLI comes bundled with the [ember-cli-content-security-policy](https://github.com/rwjblue/ember-cli-content-security-policy) addon which enables the [Content Security Policy](http://content-security-policy.com/) in modern browsers when running the development server.

The default header sent by the addon sends a policy where only content from `'self'` is allowed. This means that by default, the browser will restrict your app from loading assets and data outside of `localhost:4200` or doing any inline style or script modifications. If your app does any of these, you'll see a lot of these errors:

{% highlight bash %}
Refused to execute inline script because it violates the following Content Security Policy directive: ...
{% endhighlight %}

You can get rid of these errors by modifing the CSP for your app. This is described in the [addon readme](https://github.com/rwjblue/ember-cli-content-security-policy).

#### Unsafe-Eval (CSP)

Some platforms that run on open web technology (ex. FirefoxOS) enforce strict CSP restrictions for apps. One of the more common restrictions is the Unsafe-Eval restriction, disallowing use of the eval() function or the eval operator. Since Ember CLI currently uses eval() for part of it's integration with ES6 modules, this can be a problem. 

To disable evals, add the `wrapInEval: false` flag to your `Brocfile.js`, for example:

{% highlight javascript linenos %}
// Brocfile.js
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
...
var app = new EmberApp({
  wrapInEval: false
});
...
module.exports = app.toTree();
{% endhighlight %}

### npm package management with sudo

Installing packages such as bower with sudo powers can lead to permissions
issues and ultimately to problems installing dependencies.

For example

{% highlight bash %}
Uncaught Error: Could not find module ember/resolver loader/loader.js:42
{% endhighlight %}

can be caused by installing bower with sudo. See [https://gist.github.com/isaacs/579814](https://gist.github.com/isaacs/579814) for a collection of various solutions.

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

{% highlight bash %}
git config --global url."https://".insteadOf git://
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


Wipe your vendor directory clean then run `ember install`.


### Removing default ember-cli libraries

* To use ember-cli without Ember Data

`npm rm ember-data --save-dev`

* To use ember-cli without ic-ajax

`npm rm ember-cli-ic-ajax --save-dev`

* To reinstall latest Ember Data version

`ember install:npm ember-data`

### Solving performance issues on windows

Build times on windows are longer than on linux or mac os. Much of that penalty is not because of node or ember-cli, but because of things monitoring your filesystem. If you can (selectively!) disable your virus scanner and the Search Index Host, you will see a substantial speedup. Here's how:

#### Disable Windows Search Index for temporary files

* Go to your **control panel** (Windows 8: `Win+X`, choose "control panel")
* Look for **Indexing Options** (Use the search bar)
* Select the location that will most likely contain your project. Usually in **User**
* Click **Modify**
* This brings up a directory tree with checkboxes. Navigate to your project directory and **uncheck the checkbox for /tmp** or anywhere else you'd like.
* Click **OK**

![Partially Disable Search Index on Windows 8]({{ site.url }}/assets/images/common-issues/search-index.png)

#### Disable Windows Defender for temporary files

Windows defender will be active by default on any Windows 8 machine. On Windows 7 (or earlier) you might have Windows Security Essentials installed, which works pretty similar.

While you can exclude more than just the temporary files, this would also render a virus scanner pretty useless. Excluding temporary files won't make you any less safe. Everything that ends up there would have been in `/app` or `/vendor` before.

* Hit your Windows Key, then start typing "defen" which should bring up "Defender as first result". Start it.
* In Windows Defender, choose the **Settings** tab, then click on **Excluded files and locations** on the left.
* Click **Browse**
* Navigate to your project's **tmp** directory.
* Click **OK**
* Click **Add**
* Click **Save changes**

![Exclude Temp Files from Windows Defender]({{ site.url }}/assets/images/common-issues/win-defender.png)

### Symlinks on Windows

Many Broccoli plugins and Ember CLI addons can use symlinks to speedup the build process. When working on the Windows platform there are some caveats involved in making sure Ember CLI and other plugins can use symlinks. If symlinks are not available plugins should fall back to copying files. However the speed benefits of symlinking are substantial, so it is worth the effort to make sure Ember CLI can take advantage of them.

In order to create symlinks the account running Ember CLI must have the `SeCreateSymbolicLinkPrivilege`. Users in the Administrators group have this permission already. However if UAC (User Access Control) is enabled users in the Administrators group must run their shell using `Run As Administrator`. This is because UAC strips away certain permissions from the Administrators group, including `SeCreateSymbolicLinkPrivilege`.

![Run As Administrator]({{ site.url }}/assets/images/common-issues/run-as-admin.png)

If the user account is not part of the Administrators group you will need to add the `SeCreateSymbolicLinkPrivilege` in order to allow the creation of symlinks. To do this open the `Local Security Policy` by typing Local Security Policy in the Run Box.

Under `Local Policies` -> `User Rights Assignment` find the `Create symbolic links` policy and double click it to add a new user or group. Once you add your user or group has been added your user should be able to create symlinks. Keep in mind if your user is part of the Administrators group and UAC is enabled you will still need to start your shell using `Run as Administrator`.

![Enabling Symlinks]({{ site.url }}/assets/images/common-issues/enabling-symlinks.png)

### Usage with Vagrant

[Vagrant](http://vagrantup.com) is a system for automatically creating and setting up development environments that run in a virtual machine (VM). 

Running your ember-cli development environment from inside of a Vagrant VM will require some additional configuration and will carry a few caveats. 

#### Ports

In order to access your ember-cli application from your desktop's web browser, you'll have to open some forwarded ports into your VM. The default ports that ember-cli uses are `4200` and `35729` for its internal web server and livereload, respectively:

{% highlight ruby %}
Vagrant.configure("2") do |config|
  # ... 
  config.vm.network "forwarded_port", guest: 4200, host: 4200
  config.vm.network "forwarded_port", guest: 35729, host: 35729
end
{% endhighlight %}

#### Watched Files

The way Vagrant syncs folders between your desktop and the VM will break the default mechanism ember-cli uses to watch files and cause issues when updates are subsequently compiled. To restore this functionality, you'll have to make two changes: 

1. Fall back to polling when invoking the serve command: `ember serve --watcher polling`. 

2. Use [nfs for synced folders](https://docs.vagrantup.com/v2/synced-folders/nfs.html). 

#### VM Setup

When setting up your VM, install ember-cli dependencies as you normally would. If you've already run `ember install` in your project's folder from your host machine, you'll have to delete the `node_modules` folder and re-install those dependencies from the VM. This is particularly necessary if you have node dependencies that use native libraries (e.g., [broccoli-sass](#sass), which uses the libsass C library).

#### Provider 

The two most common Vagrant providers, VirtualBox and VMware Fusion, will both work. However, VMware Fusion is substantially faster and will use less battery life if you're on a laptop. As of now, VirtualBox will use 100% of a single CPU core to poll for file system changes inside of the VM. 