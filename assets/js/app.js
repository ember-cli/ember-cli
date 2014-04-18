(function() {
  $('body').scrollspy({ target: '.sidebar' });

  $('.sidebar').affix({
    offset: {
      top: $('.sidebar').offset().top - 20
    }
  });
})();
