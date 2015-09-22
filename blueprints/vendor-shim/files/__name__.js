(function() {
  function vendorModule() {
    'use strict';

    return { 'default': window['<%= name %>'] };
  }

  define('<%= name %>', [], vendorModule);
})();
