API Stub
========

The stub allows you to implement express routes to fake API calls.
Simply add API routes in the routes.js file. The benefit of an API
stub is that you can use the REST adapter from the get go. It's a
way to use fixtures without having to use the fixture adapter.

As development progresses, the API stub becomes a functioning spec
for the real backend. Once you have a separate development API
server running, then switch from the stub to the proxy pass through.

To configure which API method to use edit **package.json**.

* Set the **APIMethod** to 'stub' to use these express stub routes. 

* Set the method to 'proxy' and define the **proxyURL** to pass all API requests to the proxy URL.

Default Example
---------------- 

1. Create the following models:

		app/models/post.js

		```
		var attr = DS.attr,
		    hasMany = DS.hasMany,
		    belongsTo = DS.belongsTo;

		var Post = DS.Model.extend({
		  title: attr(),
		  comments: hasMany('comment'),
		  user: attr(),
		});

		export default Post;
		```

		app/models/comment.js

		```
		var attr = DS.attr,
		    hasMany = DS.hasMany,
		    belongsTo = DS.belongsTo;

		var Comment = DS.Model.extend({
		  body: attr()
		});

		export default Comment;
		```

2. Setup the REST adapter for the application:

		app/adapters/application.js

		```
		var ApplicationAdapter = DS.RESTAdapter.extend({
			namespace: 'api'
		});

		export default ApplicationAdapter;
		```

3. Tell the Index router to query for a post:

		app/routes/index.js

		```
		var IndexRoute = Ember.Route.extend({
		  model: function() {
		    return this.store.find('post', 1);
		  }
		});

		export default IndexRoute;
		```


4. Expose the model properties in the index.hbs template

		app/templates/index.hbs

		```
		<h2>{{title}}</h2>
		<p>{{body}}</p>
		<section class="comments">
			<ul>
			{{#each comment in comments}}
			  <li>
			    <div>{{comment.body}}</div>
			  </li>
			{{/each}}
			</ul>
		</section>
		```

When Ember Data queries the store for the post, it will make an API call to
http://localhost:8000/api/posts/1, to which the express server will respond with
some mock data:

```
{
  "post": {
    "id": 1,
    "title": "Rails is omakase",
    "comments": ["1", "2"],
    "user" : "dhh"
  },

  "comments": [{
    "id": "1",
    "body": "Rails is unagi"
  }, {
    "id": "2",
    "body": "Omakase O_o"
  }]
}
```