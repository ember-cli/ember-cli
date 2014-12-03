---
layout: docs
title: "Testing"
permalink: /docs/testing/
github: "https://github.com/stefanpenner/ember-cli/blob/gh-pages/_posts/2013-04-11-testing.md"
---

### Running existing tests

Running your Tests is as easy as one of these two commands:

{% highlight bash %}
ember test            # will run your test-suite in your current shell once
ember test --server   # will run your tests on every file-change
{% endhighlight %}


Alternatively you can run the tests in your regular browser using the QUnit interface. Run `ember server` and navigate to `http://localhost:4200/tests`. In this case, the tests will run in your default environment, usually 'development'.

### Writing a Test

* ember-testing
* helpers
* unit/acceptance

The default tests in Ember CLI use the [QUnit](http://qunitjs.com/) library.
The included tests demonstrate how to write both unit tests and
acceptance/integration tests using the new [ember-testing package](http://ianpetzer.wordpress.com/2013/06/14/getting-started-with-integration-testing-ember-js-using-ember-testing-and-qunit-rails/).

Test filenames should be suffixed with `-test.js` in order to run.

If you are using Pods to organize your application, be sure to add your `podModulePrefix` to the [test resolver](https://github.com/stefanpenner/ember-app-kit/blob/master/tests/helpers/resolver.js) namespace.

If you have manually set the locationType in your environment.js to `hash` or `none` you need to update your `tests/index.html` to have absolute paths (`/assets/vendor.css` and `/testem.js` vs the default relative paths).

### CI Mode with Testem

`ember test` will run your tests with `Testem` on CI mode. You can
pass any option to `Testem` using a configuration file.

If you are capturing output from the `Testem` xunit reporter, use `ember test --silent` to silence unwanted output such as the ember-cli version.

By default, your integration tests will run on [PhantomJS](http://phantomjs.org/).  You can install via [npm](https://www.npmjs.org/):

{% highlight bash %}
npm install -g phantomjs
{% endhighlight %}

**We plan to make your test runner pluggable, so you can use your favorite runner.**

#### Using ember-qunit for integration tests

All Ember Apps come with built-in [ember test helpers](http://emberjs.com/guides/testing/test-helpers/),
which are useful for writing integration tests.
In order to use them, you will need to import `tests/helpers/start-app.js`, which injects the required helpers.

Be sure to use the injected `module` function to invoke `setup` and `teardown`.

{% highlight javascript linenos %}
import Ember from "ember";
import { test } from 'ember-qunit';
import startApp from '../helpers/start-app';
var App;

module('An Integration test', {
  setup: function() {
    App = startApp();
  },
  teardown: function() {
    Ember.run(App, App.destroy);
  }
});

test("Page contents", function() {
  expect(2);
  visit('/foos').then(function() {
    equal(find('.foos-list').length, 1, "Page contains list of models");
    equal(find('.foos-list .foo-item').length, 5, "List contains expected number of models");
  });
});
{% endhighlight %}

#### Using ember-qunit for unit tests

An Ember CLI-generated project comes pre-loaded with
[ember-qunit](https://github.com/rpflorence/ember-qunit) which includes
[several helpers](http://emberjs.com/guides/testing/unit-test-helpers/#toc_unit-testing-helpers)
to make your unit-testing life easier, i.e.:

* moduleFor
* moduleForModel
* moduleForComponent

##### moduleFor(fullName, description, callbacks, delegate)

The generic resolver that will load what you specify. The usage closely follows QUnit's own `module` function.
Its use can be seen within the supplied [index-test.js](https://github.com/stefanpenner/ember-app-kit/blob/master/tests/unit/routes/index-test.js):

{% highlight javascript linenos %}
import { test, moduleFor } from 'ember-qunit';

moduleFor('route:index', "Unit - IndexRoute", {
  // only neccessary if you want to load other items into the runtime
  // needs: ['controller:index']
  setup: function () {},
  teardown: function () {}
});

test("it exists", function(){
  ok(this.subject());
});
{% endhighlight %}

`fullname`

The resolver friendly name of the object you are testing.

`description`

The description that will group all subsequent tests under. Defaults to the `fullname`.

`callbacks`

You are able to supply custom setup, teardown, & subject functionality by passing them
into the callbacks parameter. If other objects should be loaded into Ember.js, specify the objects
through the `needs` property.

`delegate`

To manually modify the container & the testing context, supply a function as the delegate
matching this signature `delegate(container, testing_context)`.

`this.subject()` calls the factory for the object specified by the fullname and will return an instance of the object.

##### moduleForModel(name, description, callbacks)

Extends the generic `moduleFor` with custom loading for testing models:

{% highlight javascript linenos %}
import DS from 'ember-data';
import Ember from 'ember';
import { test, moduleForModel } from 'ember-qunit';

moduleForModel('post', 'Post Model', {
  needs: ['model:comment']
});

test('Post is a valid ember-data Model', function () {
  var store = this.store();
  var post = this.subject({title: 'A title for a post', user: 'bob'});
  ok(post);
  ok(post instanceof DS.Model);
  
  // set a relationship
  Ember.run(function() {
    post.set('comment', store.createRecord('comment', {}))
  });
  
  ok(post.get('comment'));
  ok(post.get('comment') instanceof DS.Model);
});
{% endhighlight %}

`name`

The name of the model you are testing. It is necessary to only supply the name,
not the resolver path to the object(`model:post` => `post`).

`description`

The description that will group all subsequent tests under. Defaults to the `name`.

`callbacks`

You are able to supply custom setup, teardown, & subject functionality by passing them
into the callbacks parameter. If other objects should be loaded into Ember.js, specify
the objects through the `needs` property.

Note: If the model you are testing has relationships to any other model, those must
be specified through the `needs` property.

`this.store()` retrieves the `DS.Store`.

`this.subject()` calls the factory for the `DS.Model` specified by the fullname and
will return an instance of the object.

##### moduleForComponent(name, description, callbacks)

Extends the generic `moduleFor` with custom loading for testing components:

{% highlight javascript linenos %}
import Ember from "ember";
import { test, moduleForComponent } from 'ember-qunit';

moduleForComponent('pretty-color');

test('changing colors', function(){
  var component = this.subject();

  Ember.run(function(){
    component.set('name','red');
  });

  // first call to $() renders the component.
  equal(this.$().attr('style'), 'color: red;');

  Ember.run(function(){
    component.set('name', 'green');
  });

  equal(this.$().attr('style'), 'color: green;');
});
{% endhighlight %}

`name`

The name of the component you are testing. It is necessary to only supply the name,
not the resolver path to the object(`component:pretty-color` => `pretty-color`).

`description`

The description that will group all subsequent tests under. Defaults to the `name`.

`callbacks`

You are able to supply custom setup, teardown, & subject functionality
by passing them into the callbacks parameter. If other objects should be loaded into Ember.js,
specify the objects through the `needs` property.

`this.subject()` calls the factory for the `Ember.Component` specified by the fullname and
will return an instance of the object.

The first call `this.$()` will render out the component. So if you want to test styling,
you must access the component via jQuery.

### Writing your own test helpers

Ember testing provides that ability to register your own test helpers.  In order to use
these with ember-cli they must be registered before `startApp` is defined.

Depending on your approach, you may want to define one helper per file or a group of helpers in one file.

#### Single helper per file

{% highlight javascript linenos %}
// helpers/routes-to.js
export default Ember.Test.registerAsyncHelper('routesTo', function (app, url, route_name) {
  visit(url);
  andThen(function () {
    equal(currentRouteName(), route_name, 'Expected ' + route_name + ', got: ' + currentRouteName());
  });
});
{% endhighlight %}

This can then be used in start-app.js, like this

{% highlight javascript linenos %}
// helpers/start-app.js
import routesTo from './routes-to';

export default function startApp(attrs) {
//...
{% endhighlight %}

#### Group of helpers in one file

An alternative approach is to create a bunch of helpers wrapped in a self calling function, like this

{% highlight javascript linenos %}
// helpers/custom-helpers.js
var customHelpers = function() {
  Ember.Test.registerHelper('myGreatHelper', function (app) {
    //do awesome test stuff
  });

  Ember.Test.registerAsyncHelper('myGreatAsyncHelper', function (app) {
    //do awesome test stuff
  });
}();

export default customHelpers;
{% endhighlight %}

which can be used in `start-app.js`

{% highlight javascript linenos %}
// helpers/start-app.js
import customHelpers from './custom-helpers';

export default function startApp(attrs) {
//...
{% endhighlight %}

Once your helpers are defined, you'll want to ensure that they are listing in the .jshintrc file within the test directory.

{% highlight javascript linenos %}
// /tests/.jshintrc
{
  "predef": [
    "document",
    //...
    "myGreatHelper",
    "myGreatAsyncHelper"
{% endhighlight %}
