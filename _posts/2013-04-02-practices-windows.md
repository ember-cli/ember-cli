---
layout: post
title: "Windows"
permalink: windows
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-03-practices-windows.md"
---

### Windows

#### Improve and Optimize Build Performance

Build times on Windows are longer than on Linux or Mac OS X. Much of that penalty is not because of node or ember-cli, but because of Windows services monitoring your filesystem. [Microsoft wrote a configuration tool as well as an Ember Addon](http://www.felixrieseberg.com/improved-ember-cli-performance-with-windows/) to automatically configure Windows to optimize build performance. The automatic configuration instructs Windows Search and Windows Defender to ignore Ember Cli's `tmp` directory.

*Remember to always open up PowerShell/CMD with elevated privileges ("run as Administrator").

##### Ember Addon

The addon has the benefit of being shippable with your project, meaning that other developers on the project do not need to install anything to use the automatic configuration. To install the addon, run the following in the root of your project directory:

{% highlight bash %}
npm install --save-dev ember-cli-windows-addon
{% endhighlight %}

Then, to start the automatic configuration, run:

{% highlight bash %}
ember windows
{% endhighlight %}

##### Node Cli Tool

The automatic configuration tool can also be installed directly, making it available in PowerShell & CMD. To install, run:

{% highlight bash %}
npm install ember-cli-windows -g
{% endhighlight %}

Once the tool is installed, you can run it in any Ember Cli project directory.

{% highlight bash %}
ember-cli-windows
{% endhighlight %}

Additional performance can be gained by using an elevated prompt, which can be achieved by starting PowerShell or CMD 'as Administrator'. If you do not have administrative rights on your machine, see the [section on symlinks below for information on how to enable additional performance gains](#symlinks-on-windows).

#### Issues With npm: EEXISTS, Path too Long, etc

There were always two major issues with running Node.js on Windows: First and foremost, the operating system maintains a maximum length for path names, which clashes with Node's traditional way of nesting modules in node_modules. The second issue was a bit more subtle: The npm installer had a set of steps it executed for each package and it would immediately start executing them as soon as it decided to act on a package, resulting in hard-to-debug race conditions.

Npm@3 is a nearly complete rewrite of npm, fixing both issues. Windows users of Ember Cli might want to make the switch to npm@3 early, to benefit from its flat module installation (solving any issues involving long path names) as well as its multi-stage installer. 

The new version is currently still in beta - and while performing extremely well so far, you might still run into issues. To easily up- and downgrade between versions, use [Microsoft's npm-windows-upgrade tool](github.com/felixrieseberg/npm-windows-upgrade), which automates the upgrade and also allows easy downgrades to older versions.
