window.EmberENV = (function(EmberENV, extra) {
  for (var key in extra) {
    EmberENV[key] = extra[key];
  }

  return EmberENV;
})(window.EmberENV || {}, {{EMBER_ENV}});

// used to determine if the application should be booted immediately when `app-name.js` is evaluated
// when `runningTests` the `app-name.js` file will **not** import the applications `app/app.js` and
// call `Application.create(...)` on it. Additionally, applications can opt-out of this behavior by
// setting `autoRun` to `false` in their `ember-cli-build.js`
//
// The default `test-support.js` file will set this to `true` when it runs (so that Application.create()
// is not ran when running tests).
var runningTests = false;

{{content-for 'vendor-prefix'}}
