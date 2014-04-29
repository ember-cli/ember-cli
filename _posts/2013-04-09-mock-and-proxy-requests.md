---
layout: post
title: "Mock and proxy requests"
permalink: mock-and-proxy-requests
hidden: "true"
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-09-mock-and-proxy-requests.md"
---

Ember CLI allows you to either mock responses or proxy requests to a proxy server.

### Mock API Responses

If you want to mock respones have a further look in the
[api-stub/README](https://github.com/stefanpenner/ember-cli/tree/master/api-stub),
which gives a detailed example on how to stub API calls. Basically you define the
mocked responses in `api-stub/routes.js`:

{% highlight javascript linenos %}
module.exports = function(server) {
  server.namespace('/api', function() {
    server.get('/posts', function(req, res) {
      res.send({ post: { body: "hello mocking world" } });
    });
  });
};
{% endhighlight %}

So, if you have a route setup like this, the mocked response is served:

{% highlight javascript linenos %}
export default Ember.Route.extend({
  model: function() {
    return ic.ajax('/api/posts');
  },

  afterModel: function(model) {
    // model.post.body === "hello mocking world"
  }
});
{% endhighlight %}

To serve the mocked responses, specify the `APIMethod` property in the `package.json`
to be `stub`:

{% highlight json %}
 {
   "APIMethod": "stub"
 }
{% endhighlight %}

Next time you start the server with `ember server`, it will use the mocked responses.

Note: For changes to routes.js, you'll need to restart the express server using `grunt server`
or add `route.js` to your watch task in grunt.

### Proxy API Requests

Ember CLI also allows you to forward requests to a proxy server. Set the following
properties in your `package.json`:

{% highlight json %}
{
  "APIMethod": "proxy",
  "proxyURL": "http://apiserver.dev:3000",
  "proxyPath": "/api"
}
{% endhighlight %}

This proxies all requests for a URL starting with `proxyPath` to the proxy server.
`proxyPath` defaults to `/api` when the option is not set.

So the request made in the `model` hook is forwarded to
`http://apiserver.dev:3000/api/posts`:

{% highlight javascript lineos %}
export default Ember.Route.extend({
  model: function() {
    return ic.ajax('/api/posts');
  }
});
{% endhighlight %}
