!function(e, t) {
  if ("function" == typeof define && define.amd) {
    define("hello-world", [], t);
  } else {
    throw new Error("No amd loader found");
  }
}(this, function() {
  return function helloWorld() {
    return "Hello World";
  }
});
