---
layout: post
title: "Using Modules & the Resolver"
permalink: using-modules
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2014-04-02-using-modules.md"
---

Rather than use AMD (Require.js) or CommonJS (Browserify) modules, apps built
using Ember CLI use ES6 modules through the
[ES6 module transpiler](https://github.com/square/es6-module-transpiler). This
means that you can build your apps using syntax from future JavaScript versions,
but output AMD modules that can be used by existing JavaScript libraries today.

If you've built Ember.js apps before, you're probably used to stuffing
everything into a global namespace, following naming conventions so the app can
automatically resolve its dependencies: `App.FooRoute` would know
to render `App.FooView` by default. Using the custom resolver, Ember CLI
applications have similar abilities, but using ES6 modules instead of a global
namespace.

For example, this route definition in `app/routes/index.js`:

{% highlight javascript linenos %}
var IndexRoute = Ember.Route.extend({
  model: function() {
    return ['red', 'yellow', 'blue'];
  }
});

export default IndexRoute;
{% endhighlight %}

Would result in a module called `routes/index`. Using the resolver, when Ember
looks up the index route, it will find this module and use the object that it
exports.

You can also export directly, i.e., without having to declare a variable:

{% highlight javascript linenos %}
export default Ember.Route.extend({
  model: function() {
    return ['red', 'yellow', 'blue'];
  }
});
{% endhighlight %}

Of course, while automatic resolving is awesome, you can always manually
require dependencies with the following syntax:

{% highlight javascript linenos %}
import FooModel from "./models/foo-model";
{% endhighlight %}

Which will load the `default` export (aliased as `FooModel`) from
`./models/foo-model.js`.

Relative paths can become confusing when referencing a file from within a nested directory structure. In this case, you can also use absolute paths that start with the package name specified in your `package.json`:

{% highlight javascript linenos %}
import FooModel from "appname/models/foo-model";
{% endhighlight %}

Note, that the name of the variable used in the exported module doesn't have any
influence on the resolver. It's the filename that is used to resolve modules.
Similarly, you can give any name to the variable into which you import a module
when doing so manually; see how the module `foo-model` is assigned to variable
`FooModel` in the example above.

Only the `default` export is supported at the moment.

### Module Directory Naming Structure

`app/adapters/`

Adapters with the convention `adapter-name.js`.

`app/components/`

Components with the convention `component-name.js`. Remember, components are dasherized.

`app/controllers/`

Controllers with the convention `controller-name.js`. Child controllers are defined in sub-directories, `parent/child.js`.

`app/helpers/`

Helpers with the convention `helper-name.js`. Remember that you must register your helpers by exporting `makeBoundHelper` or calling `registerBoundHelper` explicitly.

`app/initializers/`

Initializers with the convention `initializer-name.js`. Initializers are loaded automatically.

`app/mixins/`

Mixins with the convention `mixin-name.js`.

`app/models/`

Models with the convention `model-name.js`.

`app/routes/`

Routes with the convention `route-name.js`. Child routes are defined in sub-directories, `parent/child.js`.

`app/serializers/`

Serializers for your models or adapter, where `model-name.js` or `adapter-name.js`.

`app/transforms/`

Transforms for custom Ember Data attributes, where `attribute-name.js` is the new attribute.

`app/utils`

Utility modules with the convention `utility-name.js`.

`app/views/`

Views with the convention `view-name.js`. Sub-directories can be used for organization.

All modules in the `app` folder can be loaded by the resolver but typically
classes such as `mixins` and `utils` should be loaded manually with an import statement.
For more information, see [Naming Conventions](#naming-conventions).

### Resolving from template helpers

Ember has several template helpers that are used to easily resolve and render
views and their contexts within a template. The resolver works with these
helpers, too:

`{% raw %}{{partial "foo"}}{% endraw %}` will render the template within `templates/foo.hbs`

`{% raw %}{{view "foo"}}{% endraw %}` will render the view within `views/foo.js`

`{% raw %}{{render "foo" "bar"}}{% endraw %}` will render the view within `views/foo.js` using the
controller within `controllers/bar.js`

### Resolving Handlebars helpers

Ember automatically loads files under `app/helpers` if they contain a dash:

{% highlight javascript linenos %}
// app/helpers/upper-case.js
export default Ember.Handlebars.makeBoundHelper(function(value, options) {
  return value.toUpperCase();
});
{% endhighlight %}

Handlebars helpers will only be found automatically by the resolver if their
name contains a dash (`reverse-word`, `translate-text`, etc.) This is the
result of a choice that was made in Ember, to help both disambiguate properties
from helpers, and to mitigate the performance hit of helper resolution for all
bindings. The other option is to define only the function used by the helper
and then load it explicitly, like so:

In `app/helpers/example.js`:

{% highlight javascript linenos %}
export default function(value, options) {
  return value.toUpperCase();
};
{% endhighlight %}

In `app.js`:

{% highlight javascript linenos %}
import exampleHelper from './helpers/example';
Ember.Handlebars.registerBoundHelper('example', exampleHelper);
{% endhighlight %}

In `some-template.hbs`:

{% highlight html %}
{% raw %}
{{example "foo"}}
{% endraw %}
{% endhighlight %}

In this example, because the helper is loaded explicitly, it's the first
argument to `registerBoundHelper` which makes the Handlebars renderer find it.
The file name (`example.js`) and the name of the variable it's been imported
into (`exampleHelper`) could have been anything.


###	Using global variables or external scripts

If you want to use external libraries that write to a global namespace (e.g.
[moment.js](http://momentjs.com/)), you need to add those to the `predef`
section of your project's `.jshintrc` file. If you use the lib in tests, need
to add it to your `tests/.jshintrc` file, too.

### Module import validation

To prevent errors in import statements from reaching production, this project
uses [grunt-es6-import-validate](https://github.com/sproutsocial/grunt-es6-import-validate).
This task parses each module files export and import statements and verifies
that what is being imported is actually exported by the referenced module.

If you are referencing a vendor module that is defined outside of the app folder
you may have to add it to the whitelist in `tasks/options/validate-imports.js`.
