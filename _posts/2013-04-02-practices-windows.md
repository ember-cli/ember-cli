---
layout: post
title: "Windows"
category: user-guide
permalink: windows
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-02-practices-windows.md"
---

Without any configuration build times on Windows are longer than on Linux or Mac OS X. 

* Much of that penalty is not because of node or ember-cli, but because of Windows services monitoring your filesystem. See the section below for how to disable those.
* Additional performance can be gained by using an elevated prompt, which can be achieved by starting PowerShell or CMD 'as Administrator'. If you do not have administrative rights on your machine, see the [section on symlinks below to enable additional performance gains](/user-guide/#symlinks-on-windows).

### Configuring eager file monitoring services.

[Microsoft wrote a configuration tool as well as an Ember Addon](http://www.felixrieseberg.com/improved-ember-cli-performance-with-windows/) to automatically configure Windows to optimize build performance. The automatic configuration instructs Windows Search and Windows Defender to ignore Ember Cli's `tmp/` directory.

Depending on your project context either install the `ember-cli-windows-addon` as a `devDependency` in your Ember project or install `ember-cli-windows` globally as detailed below.

**Note:** There are other services known to eagerly hit the filesystem during Ember builds. Examples are 3rd party virus scanners like McAfee, Norton etc. `ember-cli-windows` doesn't currently configure those so you have to e.g. look in Task Manager for them during builds and configure them to skip the `tmp/` directory of your Ember projects yourself.

#### Ember Addon

The addon has the benefit of being shippable with your project, meaning that other developers on the project do not need to install anything to use the automatic configuration. To install the addon, run the following in the root of your project directory:

{% highlight bash %}
npm install --save-dev ember-cli-windows-addon
{% endhighlight %}

Then, to start the automatic configuration, run:

{% highlight bash %}
ember windows
{% endhighlight %}

#### Node Cli Tool

The automatic configuration tool can also be installed directly, making it available in PowerShell & cmd. To install, run:

{% highlight bash %}
npm install ember-cli-windows -g
{% endhighlight %}

Once the tool is installed, you can run it in any Ember Cli project directory.

{% highlight bash %}
ember-cli-windows
{% endhighlight %}

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
