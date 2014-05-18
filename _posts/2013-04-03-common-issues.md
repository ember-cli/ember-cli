---
layout: post
title: "Common Issues"
permalink: commonissues
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-03-common-issues.md"
---

### npm package manangement with sudo

Installing packages such as bower with sudo powers can lead to permissions
issues and ultimately to problems installing dependencies.

For example

{% highlight bash %}
Uncaught Error: Could not find module ember/resolver loader/loader.js:42
{% endhighlight %}

can be caused by installing bower with sudo. See [#354](https://github.com/stefanpenner/ember-cli/issues/354) for details.


### Usage with SublimeText 3

If you are using SublimeText 3 with `ember-cli`, by default it will try to index all files in your `tmp` directory for its GoToAnything functionality.  This will cause your computer to come to a screeching halt @ 90%+ CPU usage.  Simply remove these directories from the folders ST3 watches:

`Sublime Text -> Preferences -> Settings -User`

{% highlight javascript %}
// folder_exclude_patterns and file_exclude_patterns control which files
// are listed in folders on the side bar. These can also be set on a per-
// project basis.
"folder_exclude_patterns": [".svn", ".git", ".hg", "CVS", "tmp/class-*", "tmp/es_*", "tmp/jshinter*", "tmp/replace_*", "tmp/static_compiler*", "tmp/template_compiler*", "tmp/tree_merger*", "tmp/coffee_script*", "tmp/concat-tmp*", "tmp/export_tree*", "tmp/sass_compiler*"]
{% endhighlight %}
