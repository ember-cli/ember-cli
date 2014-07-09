(function() {
  $('body').scrollspy({ target: '.sidebar' });

  $('.sidebar').affix({
    offset: {
      top: $('.sidebar').offset().top - 20
    }
  });

  $('h1, h2, h3, h4, h5, h6').each(function() {
    $(this).wrapInner('<a href="#' + this.id + '"></a>');
  });

  FastClick.attach(document.body);
})();
