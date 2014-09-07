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

To use ember-cli without Ember Data remove the dependency from package.json
(the same applies for ic-ajax)

  `npm rm ember-cli-ember-data --save-dev`


### Models

Models are critical in any dynamic web application. Ember Data makes making
models extremely easy.

For example, we can create a todo model like so:

{% highlight javascript linenos %}
// models/todo.js
import DS from "ember-data";

export default DS.Model.extend({
  title: DS.attr('string'),
  isCompleted: DS.attr('boolean'),
  quickNotes: DS.hasMany('quick-note')
});

// models/quick-note.js
import DS from "ember-data";

export default DS.Model.extend({
  name: DS.attr('string'),
  todo: DS.belongsTo('todo')
});

{% endhighlight %}

Note, that filenames should be all lowercase and dasherized - this is used by the
*Resolver* automatically.

### Adapters & Serializers

Ember Data makes heavy use of *per-type* adapters and serializers. These objects
can be resolved like any other.

Adapters can be placed at `/app/adapters/type.js`:

{% highlight javascript linenos %}
// adapters/post.js
import DS from "ember-data";

export default DS.RESTAdapter.extend({});
{% endhighlight %}

And its serializer can be placed in `/app/serializers/type.js`:

{% highlight javascript linenos %}
// serializers/post.js
import DS from "ember-data";

export default DS.RESTSerializer.extend({});
{% endhighlight %}

Application-level (default) adapters and serializers should be named
`adapters/application.js` and `serializers/application.js`, respectively.

### FixtureAdapter

Because ember-cli models aren't attached to the global namespace, you can't
create fixture data like you normally would. Instead, you can use
`reopenClass` to attach fixture data to your model definitions.

First, create a fixture adapter, either for a single model or your entire
application:

{% highlight javascript linenos %}
// adapters/application.js
import DS from "ember-data";

export default DS.FixtureAdapter.extend({});
{% endhighlight %}

Then add your fixture data within your model definitions:

{% highlight javascript linenos %}
// models/author.js
import DS from "ember-data";

var author = DS.Model.extend({
  firstName: DS.attr('string'),
  lastName: DS.attr('string')
});

author.reopenClass({
  FIXTURES: [
    {id: 1, firstName: 'Bugs', lastName: 'Bunny'},
    {id: 2, firstName: 'Wile E.', lastName: 'Coyote'}
  ]
});

export default author;
{% endhighlight %}
