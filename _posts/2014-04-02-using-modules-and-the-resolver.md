---
layout: post
title: "Using Modules & the Resolver"
permalink: using-modules
category: user-guide
github: "https://github.com/ember-cli/ember-cli/edit/gh-pages/_posts/2014-04-02-using-modules-and-the-resolver.md"
---

The Ember Resolver is the mechanism responsible for looking up code in your
application and converting its naming conventions into the actual classes,
functions, and templates that Ember needs to resolve its dependencies, for example, what template to render for a given route. For an introduction to the Ember Resolver, and a basic example of how it actually works, see [this video](https://www.youtube.com/watch?v=OY0PzrltMYc#t=51) by [Robert Jackson](https://www.twitter.com/@rwjblue).

In the past, Ember's Default Resolver worked by putting everything into a global namespace, so you will come across the following pattern:

{% highlight javascript linenos %}
App.IndexRoute = Ember.Route.extend({
  model: function() {
    return ['red', 'yellow', 'blue'];
  }
});
{% endhighlight %}

Today, Ember CLI uses a [newer version of the
Resolver](https://github.com/stefanpenner/ember-resolver) based on ES6
semantics. This means that you can build your apps using syntax from future
JavaScript versions, but output AMD modules that can be used by existing
JavaScript libraries today.

For example, this route definition in `app/routes/index.js` would result in a
module called `your-app/routes/index`. Using the resolver, when Ember looks up
the index route, it will find this module and use the object that it exports.

{% highlight javascript linenos %}
// app/routes/index.js
import Ember from "ember";

export default Ember.Route.extend({
  model: function() {
    return ['red', 'yellow', 'blue'];
  }
});

{% endhighlight %}

You can also require modules directly with the following syntax:

{% highlight javascript linenos %}
import FooMixin from "./mixins/foo";
{% endhighlight %}

You can reference a module by using either a relative or absolute path.
If you would like to reference a module using absolute begin
the path with the app name defined in `package.json`:

{% highlight javascript linenos %}
import FooMixin from "appname/mixins/foo";
{% endhighlight %}


Similarly, you can give any name to the variable into which you import a module
when doing so manually; see how the module `mixins/foo` is assigned to variable
`FooMixin` in the example above.


### Using Ember or Ember Data

To use `Ember` or `DS` (for Ember Data) in your modules you must import them:

{% highlight javascript linenos %}
import Ember from "ember";
import DS from "ember-data";
{% endhighlight %}


### Using Pods

One of the enhancements that the new Resolver brings is that it will first look for Pods before the traditional project structure.


### Module Directory Naming Structure

Directory           | Purpose
--------------------|
`app/adapters/`     | Adapters with the convention `adapter-name.js`.
`app/components/`   | Components with the convention `component-name.js`. Components must have a dash in their name. So `blog-post` is an acceptable name, but `post` is not.
`app/helpers/`      | Helpers with the convention `helper-name.js`. Helpers must have a dash in their name. Remember that you must register your helpers by exporting `Ember.Helper.helper`.
`app/initializers/` | Initializers with the convention `initializer-name.js`. Initializers are loaded automatically.
`app/mixins/`       | Mixins with the convention `mixin-name.js`.
`app/models/`       | Models with the convention `model-name.js`.
`app/routes/`       | Routes with the convention `route-name.js`. Child routes are defined in sub-directories, `parent/child.js`. To provide a custom implementation for generated routes (equivalent to `App.Route` when using globals), use `app/routes/basic.js`.
`app/serializers/`  | Serializers for your models or adapter, where `model-name.js` or `adapter-name.js`.
`app/transforms/`   | Transforms for custom Ember Data attributes, where `attribute-name.js` is the new attribute.
`app/utils/`        | Utility modules with the convention `utility-name.js`.

All modules in the `app` directory can be loaded by the resolver but typically
classes such as `mixins` and `utils` should be loaded manually with an import statement.

For more information, see [Naming Conventions](#naming-conventions).

### Resolving Handlebars helpers
Custom Handlebars helpers are one of the ways that you can use the same HTML multiple
times in your web application. Registering your custom helper allows it to
be invoked from any of your Handlebars templates. Custom helpers are located
under `app/helpers`. If your custom helper contains a dash(`upper-case`,
`reverse-word`, etc.), it will be found and loaded automatically by the resolver.

{% highlight javascript linenos %}
// app/helpers/upper-case.js
import Ember from "ember";

export function upperCase(args, options) {
  return args[0].toUpperCase();
});

export default Ember.Helper.helper(upperCase);
{% endhighlight %}

In `some-template.hbs`:

{% highlight html %}
{% raw %}
{{upper-case "foo"}}
{% endraw %}
{% endhighlight %}

Limiting automatically-loaded helpers to those that contain dashes is an explicit
decision made by Ember. It helps disambiguate properties from helpers, and helps
mitigate the performance hit of helper resolution for all bindings. The other
loading option is to define only the function used by the helper and to load it
explicitly:

{% highlight javascript linenos %}
// app/helpers/trim.js
export default function(args, options) {
  return args[0].trim();
};

// app.js
import Ember from "ember";
import trimHelper from './helpers/trim';

Ember.Helper.helper('trim', trimHelper);
{% endhighlight %}

In `some-template.hbs`:

{% highlight html %}
{% raw %}
{{trim "     foo"}}
{% endraw %}
{% endhighlight %}

In this example the helper is loaded explicitly. It's the first
argument to `helper` which allows the renderer to find it.
The file name (`trim.js`) and the name of the variable it's been imported
into (`trimHelper`) could have been anything.

A common pattern with helpers is to define a helper to use your views
(e.g. for a custom text field view, `MyTextField` a helper `my-text-field`
to use it). It is advised to leverage Components instead.

Do this:

{% highlight javascript linenos %}
// Given... app/components/my-text-field.js
import Ember from "ember";

export default Ember.TextField.extend({
  // some custom behaviour...
});
{% endhighlight %}

###	Using global variables or external scripts

If you want to use external libraries that write to a global namespace (e.g.
[moment.js](http://momentjs.com/)), you need to add those to the `predef`
section of your project's `.jshintrc` file and set its value to true. If you use the lib in tests, you need
to add it to your `tests/.jshintrc` file, too.
