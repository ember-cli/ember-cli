---
layout: default
title: "Using With Ember Data"
permalink: ember-data.html
---

The current beta Ember Data is now included with Ember App Kit.

Ember Data has recently undergone a major reboot, drastically simplifying it and
making it easier to use with the Ember resolver. Here's some tips for using it
within Ember App Kit.

### Models

Models are critical in any dynamic web application. Ember Data makes making
models extremely easy.

For example, we can create a todo model like so:

{% highlight js %}
// models/todo.js
var Todo = DS.Model.extend({
  title: DS.attr('string'),
  isCompleted: DS.attr('boolean')
});

export default Todo;
{% endhighlight %}

> Please note that filenames should be all lowercase - this is used by the
*Resolver* automatically.

### Adapters & Serializers

Ember Data makes heavy use of *per-type* adapters and serializers. These objects
can be resolved like any other.

Adapters can be placed at `/app/adapters/type.js`:

{% highlight js %}
// adapters/post.js
export default DS.RESTAdapter.extend({
});
{% endhighlight %}

And its serializer can be placed in `/app/serializers/type.js`:

{% highlight js %}
// serializers/post.js
export default DS.RESTSerializer.extend({
});
{% endhighlight %}

Application-level (default) adapters and serializers should be named
`adapters/application.js` and `serializers/application.js`, respectively.
