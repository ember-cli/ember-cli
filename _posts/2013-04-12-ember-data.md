---
layout: post
title: "Using With Ember Data"
permalink: ember-data
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-12-ember-data.md"
---

The current beta Ember Data is included with Ember CLI.

Ember Data has recently undergone a major reboot, drastically simplifying it and
making it easier to use with the Ember resolver. Here's some tips for using it
within Ember CLI.

### Models

Models are critical in any dynamic web application. Ember Data makes making
models extremely easy.

For example, we can create a todo model like so:

{% highlight javascript linenos %}
// models/todo.js
export default DS.Model.extend({
  title: DS.attr('string'),
  isCompleted: DS.attr('boolean'),
  notes: DS.hasMany('note')
});

// models/note.js
export default DS.Model.extend({
  name: DS.attr('string'),
  todo: DS.belongsTo('todo')
});

{% endhighlight %}

Note, that filenames should be all lowercase - this is used by the
*Resolver* automatically.

### Adapters & Serializers

Ember Data makes heavy use of *per-type* adapters and serializers. These objects
can be resolved like any other.

Adapters can be placed at `/app/adapters/type.js`:

{% highlight javascript linenos %}
// adapters/post.js
export default DS.RESTAdapter.extend({});
{% endhighlight %}

And its serializer can be placed in `/app/serializers/type.js`:

{% highlight javascript linenos %}
// serializers/post.js
export default DS.RESTSerializer.extend({});
{% endhighlight %}

Application-level (default) adapters and serializers should be named
`adapters/application.js` and `serializers/application.js`, respectively.
