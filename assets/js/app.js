(function() {
  $('body').scrollspy({ target: '.sidebar' });

  $('.sidebar').affix({
    offset: {
      top: $('.sidebar').offset().top - 20
    }
  });

  FastClick.attach(document.body);


(function() {
 
$(window).scroll(function () {
  if ( $(this).scrollTop() > $(this).height() ) {
    $('#sidenav').show();
   } else if ( $(this).scrollTop() <= $(this).height() ) {
    $('#sidenav').hide();
  }
});


$(function() {
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1500);
        return false;
      }
    }
  });
});
})();

var sheight = $('#showcase').css('height');

$('#swap').height(sheight);
$('.guide-content').css('min-height',sheight);

})();
