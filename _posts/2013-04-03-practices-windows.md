---
layout: post
title: "Windows"
permalink: windows
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-03-practices-windows.md"
---

### Windows

Build times on Windows are longer than on Linux or Mac OS X. Much of that penalty is not because of node or ember-cli, but because of Windows services monitoring your filesystem. [Microsoft wrote a configuration tool as well as an Ember Addon](http://www.felixrieseberg.com/improved-ember-cli-performance-with-windows/) to automatically configure Windows to optimize build performance. The automatic configuration instructs Windows Search and Windows Defender to ignore Ember Cli's `tmp` directory.

*Remember to always open the terminal with admin privileges

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

Additional performance can be gained by using an elevated prompt, which can be achieved by starting PowerShell or CMD 'as Administrator'. If you do not have administrative rights on your machine, see the [section on symlinks below for information on how to enable additional performance gains](#symlinks-on-windows).
