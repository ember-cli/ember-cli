window.EmberENV = (function(EmberENV, extra) {
  for (var key in extra) {
    EmberENV[key] = extra[key];
  }

  return EmberENV;
})(window.EmberENV || {}, {{EMBER_ENV}});

var runningTests = false;

{{content-for 'vendor-prefix'}}
