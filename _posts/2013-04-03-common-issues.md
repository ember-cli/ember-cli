---
layout: post
title: "Common Issues"
permalink: commonissues
category: user-guide
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


Wipe your vendor directory clean then run `npm install && bower install`.


### Removing default ember-cli libraries

* To use ember-cli without Ember Data

`npm rm ember-data --save-dev`

* To use ember-cli without ic-ajax

`npm rm ember-cli-ic-ajax --save-dev`

* To reinstall latest Ember Data version

`npm update ember-data`

### Symlinks on Windows

Many Broccoli plugins and Ember CLI addons can use symlinks to speedup the build process. When working on the Windows platform there are some caveats involved in making sure Ember CLI and other plugins can use symlinks. If symlinks are not available plugins should fall back to copying files. However the speed benefits of symlinking are substantial, so it is worth the effort to make sure Ember CLI can take advantage of them.

In order to create symlinks the account running Ember CLI must have the `SeCreateSymbolicLinkPrivilege`. Users in the Administrators group have this permission already. However if UAC (User Access Control) is enabled users in the Administrators group must run their shell using `Run As Administrator`. This is because UAC strips away certain permissions from the Administrators group, including `SeCreateSymbolicLinkPrivilege`.

![Run As Administrator]({{ site.url }}/assets/images/common-issues/run-as-admin.png)

If the user account is not part of the Administrators group you will need to add the `SeCreateSymbolicLinkPrivilege` in order to allow the creation of symlinks. To do this open the `Local Security Policy` by typing Local Security Policy in the Run Box.

Under `Local Policies` -> `User Rights Assignment` find the `Create symbolic links` policy and double click it to add a new user or group. Once you add your user or group has been added your user should be able to create symlinks. Keep in mind if your user is part of the Administrators group and UAC is enabled you will still need to start your shell using `Run as Administrator`.

![Enabling Symlinks]({{ site.url }}/assets/images/common-issues/enabling-symlinks.png)

### PhantomJS on Windows

When running tests on Windows via PhantomJS the following error can occur:

	events.js:72
	throw er; // Unhandled 'error' event
	^
	Error: spawn ENOENT
	at errnoException (child_process.js:988:11)
	at Process.ChildProcess._handle.onexit (child_process.js:779:34)

In order to fix this ensure the following is added to your `PATH`:

`C:\Users\USER_NAME\AppData\Roaming\npm\node_modules\phantomjs\lib\phantom`

### Cygwin on Windows

When running ember cli command within cygwin the following error can occur:

net.js:156
    this._handle.open(options.fd);
                 ^
Error: EINVAL, invalid argument
    at new Socket (net.js:156:18)
    at process.stdin (node.js:664:19)

Try to launch cygwin using the following command:
C:\cygwin\bin\bash.exe --login -i -c "cd /cygdrive/c/Users/username/; exec bash"

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

The way Vagrant syncs directories between your desktop and the VM will break the default mechanism ember-cli uses to watch files and cause issues when updates are subsequently compiled. To restore this functionality, you'll have to make two changes:

1. Fall back to polling when invoking the serve command: `ember serve --watcher polling`.

2. Use [nfs for synced folders](https://docs.vagrantup.com/v2/synced-folders/nfs.html).

#### VM Setup

When setting up your VM, install ember-cli dependencies as you normally would. If you've already run `ember install` in your project's directory from your host machine, you'll have to delete the `node_modules` directory and re-install those dependencies from the VM. This is particularly necessary if you have node dependencies that use native libraries (e.g., [broccoli-sass](#sass), which uses the libsass C library).

#### Provider

The two most common Vagrant providers, VirtualBox and VMware Fusion, will both work. However, VMware Fusion is substantially faster and will use less battery life if you're on a laptop. As of now, VirtualBox will use 100% of a single CPU core to poll for file system changes inside of the VM.

### Broken Glob npm package issue

The glob package is required by many of ember-cli packages, however there is a version mismatch between various includes which currently is an issue.

{% highlight bash %}
undefined is not a function
TypeError: undefined is not a function
    at rimraf (/home/username/emberApp/node_modules/ember-cli/node_modules/broccoli-caching-writer/node_modules/rimraf/rimraf.js:57:13)
    at lib$rsvp$node$$tryApply (/home/username/emberApp/node_modules/ember-cli/node_modules/broccoli-caching-writer/node_modules/rsvp/dist/rsvp.js:1467:11)
    at lib$rsvp$node$$handleValueInput (/home/username/emberApp/node_modules/ember-cli/node_modules/broccoli-caching-writer/node_modules/rsvp/dist/rsvp.js:1567:20)
    at fn (/home/username/emberApp/node_modules/ember-cli/node_modules/broccoli-caching-writer/node_modules/rsvp/dist/rsvp.js:1555:18)
    at /home/username/emberApp/node_modules/ember-cli/node_modules/broccoli-caching-writer/index.js:100:14
    at lib$rsvp$$internal$$tryCatch (/home/username/emberApp/node_modules/ember-cli/node_modules/promise-map-series/node_modules/rsvp/dist/rsvp.js:489:16)
    at lib$rsvp$$internal$$invokeCallback (/home/username/emberApp/node_modules/ember-cli/node_modules/promise-map-series/node_modules/rsvp/dist/rsvp.js:501:17)
    at lib$rsvp$$internal$$publish (/home/username/emberApp/node_modules/ember-cli/node_modules/promise-map-series/node_modules/rsvp/dist/rsvp.js:472:11)
    at lib$rsvp$asap$$flush (/home/username/emberApp/node_modules/ember-cli/node_modules/promise-map-series/node_modules/rsvp/dist/rsvp.js:1290:9)
    at process._tickCallback (node.js:355:11)
{% endhighlight %}

To fix the issue there are two solutions:

- Update to ember-cli@0.2.0
- Lock rimraf@2.2.8 and glob@4.0.5

#### Locking package versions
Adding dependency versions into your package.json fixes the dependency issue:
{% highlight javascript %}
"dependencies": {
  "glob": "4.0.5",
  "rimraf": "2.2.8"
},
"bundledDependencies": [
  "glob",
  "rimraf"
]
...
{% endhighlight %}

Clear out old packages and reinstall them with the following:
{% highlight bash %}
rm -rf node_modules; npm cache clear; npm install;
{% endhighlight %}
