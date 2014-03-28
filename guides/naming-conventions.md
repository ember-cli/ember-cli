---
layout: default
title: "Naming Conventions"
permalink: naming-conventions.html
---
### Naming Conventions
When using Ember App Kit its important to keep in mind that the Resolver changes some of the naming conventions you would typically use out of the box with Ember, Ember Data and Handlebars. In this section we review some of these naming conventions.

### Module Examples

##### Adapters

An adapter the traditional Ember way:

{% highlight js %}
App.ApplicationAdapter = DS.RESTAdapter.extend({ ... });
{% endhighlight %}

Would be declared like so in EAK:

{% highlight js %}
// app/adapters/application.js
export default DS.RESTAdapter.extend({ ... });
{% endhighlight %}

##### Components

{% highlight js %}
// app/components/time-input.js
export default Ember.TextField.extend({ ... });
{% endhighlight %}

##### Controllers

{% highlight js %}
// app/controllers/stop-watch.js
export default Ember.ObjectController.extend({ ... });
{% endhighlight %}

And if it's a route controller, we can declare nested/child controllers like such: `app/controllers/test/index.js`.

##### Helpers

{% highlight js %}
// app/helpers/format-time.js
export default Ember.Handlebars.makeBoundHelper( function() { ... } );
{% endhighlight %}

##### Models

{% highlight js %}
// app/models/observation.js
export default DS.Model.extend({ ... });
{% endhighlight %}

##### Routes

{% highlight js %}
// app/routes/timer.js
export default Ember.Route.extend({ ... });
{% endhighlight %}

Nested routes as such: `app/routes/timer/index.js` or `app/routes/timer/record.js`.

##### Serializers

A custom serializer for our model..

{% highlight js %}
// app/serializers/observation.js
export default DS.RESTSerializer.extend({ ... });
{% endhighlight %}

##### Transforms

Or a customer attribute for our model..

{% highlight js %}
// app/transforms/time.js
export default DS.Transforms.extend({ ... });
{% endhighlight %}

##### Views

{% highlight js %}
// app/index.hbs
{% raw %}{{view 'stop-watch'}}{% endraw %}

// app/views/stop-watch.js
export default Ember.View.extend({ ... });
{% endhighlight %}

And views, which can be referenced in sub-directories, but have no inheritance.

{% highlight js %}
// app/index.hbs
{% raw %}{{view 'inputs/time-input'}}{% endraw %}

// app/views/inputs/time-input.js
export default Ember.TextField.extend({ ... });
{% endhighlight %}

### Filenames

It is important to keep in mind that the Resolver uses filenames to create the associations correctly. This helps you by not having to namespace everything yourself. But there a couple of things you should know.

##### Overview
- Dashes
  - file names
  - folder names
  - html tags/ember components
  - CSS classes
  - URLs
- camelCase
  - JavaScript
  - JSON

##### All filenames should be lowercased

{% highlight sh %}
// models/user.js
export default Ember.Model.extend();
{% endhighlight %}

##### Dasherized file and folder names are recommended

You may want to name your files according to their function, this is easily accomplished:

{% highlight sh %}
// models/user-model.js
export default Ember.Model.extend();
{% endhighlight %}


##### Nested directories

If you prefer to nest your files to better manage your application, you can easily do so.

{% highlight sh %}
// controller/posts/new.js -> controller:posts/new
export default Ember.Controller.extend();
{% endhighlight %}

You cannot use paths containing slashes in your templates because Handlebars will translate them back to dots. Simply create an alias like this:

{% highlight sh %}
// controller/posts.js
export default Ember.Controller.extend({
    needs: ['posts/details'],
    postsDetails: Ember.computed.alias('controllers.posts/details')
});
{% raw %}
// templates/posts.hbs
// because {{controllers.posts/details.count}} does not work
{{postsDetails.count}}
{% endraw %}
{% endhighlight %}

If your filename has an underscore in it, we can reference it using the following technique:

{% highlight sh %}
// controller/posts/comment-thread.js -> controller:posts/comment-thread
export default Ember.Controller.extend();
{% endhighlight %}

### Example: Views and Templates

Let's say we were using Ember out of the box with the following view:

{% highlight sh %}
App.UserView = Ember.View.extend({});
{% endhighlight %}

We could easily embed this view into a container/parent using the Handlebars view helper:

{% highlight sh %}
{% raw %}
{{ view App.UserView }}
{% endraw %}
{% endhighlight %}

This is great. However, Ember App Kit customizes the default Ember Resolver to help alleviate the issue of namespacing your objects (views, controllers, models, etc.) manually. The above example, as such, will not work in an EAK project.

In EAK our view would be declared like so:

{% highlight sh %}
// app/views/user.js
export default Ember.View.extend({});
{% endhighlight %}

We can then embed our view using the following convention:

{% highlight sh %}
{% raw %}
{{view 'user'}}
{% endraw %}
{% endhighlight %}

> Please note that we did not namespace UserView. The resolver takes care of this for you. For more information about the default Ember resolver, check out the source [here](https://github.com/emberjs/ember.js/blob/master/packages/ember-application/lib/system/resolver.js).
