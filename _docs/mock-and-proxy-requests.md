---
layout: docs
title: "Mock and proxy requests"
permalink: /docs/mock-and-proxy-requests/
hidden: "true"
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-10-mock-and-proxy-requests.md"
---

Ember CLI allows you to either mock responses or proxy requests to a proxy server.

### Mock API Responses

Ember-CLI comes with basic setup for HTTPServer using [express](http://expressjs.com/).
This simple example will help you how to get started with `express`.
`Note:This example does not use ember-data library. `

Suppose when user visits`/songs` client makes a `GET` request to the server for `fav/songs`.
Your server is not ready yet and you want to test this new route. You can easily add an route to `express` to test this new route.
`Note:/songs is a route defined on ember while /fav/songs is a route defined on express.`

To test it this is the first step as in ember everything starts with router.
`app/router.js`

{% highlight javascript linenos %}
Router.map(function() {
  this.route('songs');
{% endhighlight %}

Next step could be to define a route on express which will respond with Mock data when appropriate request is made.
`server/routes/songs.js`

{% highlight javascript linenos %}
module.exports = function(app) {
  app.get('/fav/songs', function(req, res) {
  res.json( [{"name":"Foo"},{"name":"Bar"}] );
  });
};
{% endhighlight %}

`app/adapters/RESTadapter.js`

{% highlight javascript linenos %}
import ajax from 'ic-ajax';

var Adapter = Ember.Object.extend( {} );

Adapter.reopenClass( {
  get: function( url ) {
    return ajax( { url: url, type: 'GET' } );
  }
} );
{% endhighlight %}

`app/routes/songs.js`

{% highlight javascript linenos %}
import Adapter from 'app/adapters/RESTadapter';

export default Ember.Route.extend( {
  model: function() {
    return Adapter.get( '/fav/songs' );
  }
{% endhighlight %}

`ember build` and then `ember server`. And now if you visit `/songs` you should see server response with appropriate json.

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
