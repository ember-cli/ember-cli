---
layout: post
title: "Naming Conventions"
permalink: naming-conventions
category: user-guide
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2014-04-01-naming-conventions.md"
---

When using Ember CLI it's important to keep in mind that the Resolver changes
some of the naming conventions you would typically use out of the box with Ember,
Ember Data and Handlebars. In this section we review some of these naming conventions.

### Module Examples

##### Adapters

{% highlight javascript linenos %}
// app/adapters/application.js
import Ember from "ember";
import DS from "ember-data";

export default DS.RESTAdapter.extend({});
{% endhighlight %}

##### Components

{% highlight javascript linenos %}
// app/components/time-input.js
import Ember from "ember";

export default Ember.TextField.extend({});
{% endhighlight %}

##### Controllers

{% highlight javascript linenos %}
// app/controllers/stop-watch.js
import Ember from "ember";

export default Ember.Controller.extend({});
{% endhighlight %}

And if it's a nested controller, we can declare nested/child controllers
like such: `app/controllers/posts/index.js`.

##### Helpers

{% highlight javascript linenos %}
// app/helpers/format-time.js
import Ember from "ember";

export default Ember.Handlebars.makeBoundHelper(function(){});
{% endhighlight %}

##### Initializers

{% highlight javascript linenos %}
// app/initializers/observation.js
export default {
  name: 'observation',
  initialize: function() {
    // code
  }
};
{% endhighlight %}

Note: `initializers` are loaded automatically.

##### Mixins

{% highlight javascript linenos %}
// app/mixins/evented.js
import Ember from "ember";

export default Ember.Mixin.create({});
{% endhighlight %}

##### Models

{% highlight javascript linenos %}
// app/models/observation.js
import DS from "ember-data";

export default DS.Model.extend({});
{% endhighlight %}

##### Routes

{% highlight javascript linenos %}
// app/routes/timer.js
import Ember from "ember";

export default Ember.Route.extend({});
{% endhighlight %}

Nested routes as such: `app/routes/timer/index.js` or `app/routes/timer/record.js`.

##### Serializers

{% highlight javascript linenos %}
// app/serializers/observation.js
import DS from "ember-data";

export default DS.RESTSerializer.extend({});
{% endhighlight %}

##### Transforms

{% highlight javascript linenos %}
// app/transforms/time.js
import DS from "ember-data";

export default DS.Transform.extend({});
{% endhighlight %}

##### Utilities

{% highlight javascript linenos %}
// app/utils/my-ajax.js
export default function myAjax() {};
{% endhighlight %}

##### Views

{% highlight html %}
<!-- app/index.hbs -->
{% raw %}{{view 'stop-watch'}}{% endraw %}
{% endhighlight %}

{% highlight javascript linenos %}
// app/views/stop-watch.js
import Ember from "ember";

export default Ember.View.extend({});
{% endhighlight %}

And views, which can be referenced in sub-directories, but have no inheritance.

{% highlight html %}
<!-- app/index.hbs -->
{% raw %}{{view 'inputs/time-input'}}{% endraw %}
{% endhighlight %}

{% highlight javascript linenos %}
// app/views/inputs/time-input.js
import Ember from "ember";

export default Ember.TextField.extend({});
{% endhighlight %}

### Filenames

It is important to keep in mind that the Resolver uses filenames to create
the associations correctly. This helps you by not having to namespace everything
yourself. But there are a couple of things you should know.

##### Overview

- Dashes
  - file names
  - directory names
  - html tags/ember components
  - CSS classes
  - URLs
- camelCase
  - JavaScript
  - JSON

##### All filenames should be lowercased

{% highlight javascript linenos %}
// models/user.js
import Ember from "ember";
export default Ember.Model.extend();
{% endhighlight %}

##### Dasherized file and directory names are required

{% highlight javascript %}
// controllers/sign-up.js
import Ember from "ember";
export default Ember.Controller.extend();
{% endhighlight %}

##### Nested directories

If you prefer to nest your files to better manage your application, you can easily do so.

{% highlight javascript linenos %}
// controllers/posts/new.js results in a controller named "controllers.posts/new"
import Ember from "ember";
export default Ember.Controller.extend();
{% endhighlight %}

You cannot use paths containing slashes in your templates because Handlebars will translate
them back to dots. Simply create an alias like this:

{% highlight javascript linenos %}
// controllers/posts.js
import Ember from "ember";
export default Ember.Controller.extend({
  needs: ['posts/details'],
  postsDetails: Ember.computed.alias('controllers.posts/details')
});
{% endhighlight %}

{% highlight html %}
{% raw %}
<!-- templates/posts.hbs -->
<!-- because {{controllers.posts/details.count}} does not work -->
{{postsDetails.count}}
{% endraw %}
{% endhighlight %}

### Views and Templates

Let's say we were using Ember out of the box with the following view:

{% highlight javascript %}
import Ember from "ember";
App.UserView = Ember.View.extend({});
{% endhighlight %}

We could easily embed this view into a container/parent using the Handlebars view helper:

{% highlight html %}
{% raw %}
{{view App.UserView}}
{% endraw %}
{% endhighlight %}

This is great. However, Ember CLI customizes the default Ember Resolver to help alleviate
the issue of namespacing your objects (views, controllers, models, etc.) manually.
The above example, as such, will not work in an Ember CLI project.

In Ember CLI our view would be declared like so:

{% highlight javascript linenos %}
// app/views/user.js
import Ember from "ember";
export default Ember.View.extend({});
{% endhighlight %}

We can then embed our view using the following convention:

{% highlight html %}
{% raw %}
{{view "user"}}
{% endraw %}
{% endhighlight %}

Note, that we did not namespace `UserView`. The resolver takes care of this for you.
For more information about the default Ember resolver, check out the source [here](https://github.com/emberjs/ember.js/blob/master/packages/ember-application/lib/system/resolver.js).

### Tests

Test filenames should be suffixed with `-test.js` in order to run.

#### Pod structure

As your app gets bigger, a feature-driven structure may be better. Splitting your application by functionality/resource would give you more power and control to scale and maintain it. As a default, if the file is not found on the POD structure, the Resolver will look it up within the normal structure.

In this case, you should name the file as its functionality. Given a resource `Users`, the directory structure would be:

- `app/users/controller.js`
- `app/users/route.js`
- `app/users/template.hbs`

Rather than hold your resource directories on the root of your app you can define a POD path using the attribute `podModulePrefix` within your environment configs. The POD path should use the following format: `{appname}/{poddir}`.

{% highlight javascript linenos %}
// config/environment.js
module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'my-new-app',
    // namespaced directory where resolver will look for your resource files
    podModulePrefix: 'my-new-app/pods',
    environment: environment,
    baseURL: '/',
    locationType: 'auto'
    //...
  };
  
  return ENV;
};
{% endhighlight %}

Then your directory structure would be:

- `app/pods/users/controller.js`
- `app/pods/users/route.js`
- `app/pods/users/template.hbs`
