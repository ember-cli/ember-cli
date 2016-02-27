(function() {
  function helloWorld() {
    return "Hello World";
  }
  if (typeof define === "function" && define.amd) {
    define([], function () { return helloWorld; });
  } else {
    throw new Error("No amd loader found");
  }
})();
