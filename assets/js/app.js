(function() {
  $('body').scrollspy({ target: '.sidebar' });
  
  FastClick.attach(document.body);

  (function() {
   
    $(function() {
      $('#switch').click(function() {
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
          var target = $(this.hash);
          target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
          if (target.length) {
            $('html,body').animate({
              scrollTop: target.offset().top
            }, 750);
            return false;
          }
        }
      });
    });

  })();

  var sheight = $('#showcase').css('height');

  $('#swap').height(sheight);
  $('.guide-content').css('min-height',sheight);

  $('.sidebar').affix({
    offset: {
      top: $('.sidebar').offset().top
    }
  });

})();
