$(document).ready(function() {
    if ($('[data-toggle="tooltip"]').length) {
        $('[data-toggle="tooltip"]').tooltip();
    }

    $('.menu-toggle').click(function() {
        $('.tab-content').removeClass('open');
        if ($('.sidebar').hasClass('expand-menu')) {
            $('.sidebar').removeClass('expand-menu');
        } else {
            $('.sidebar').addClass('expand-menu');
        }
        $(this).find('.expand').toggleClass('open');

        if ($('.content').hasClass('open2')) {
            $('.content').removeClass('open2');
            $('.footer').removeClass('open2');
        }

        if ($(window).width() < 767) {
            $('.content').toggleClass('open');
            $('.footer').toggleClass('open');
        } else {
            if ($('.content').hasClass('open')) {
                $('.content').removeClass('open');
                $('.footer').removeClass('open');
            } else {
                $('.content').addClass('open');
                $('.footer').addClass('open');
            }
        }
    });

    $('.user-control').click(function() {
        $('.menu-wrapper').slideToggle();
    });

    $('.user-control').mouseleave(function() {
        $('.menu-wrapper').slideUp();
    });

    $('.remove-btn').click(function() {
        $(this).parent().remove();
    });

    if ($('.btn-grp').length) {
        var ind;
        $('.btn-grp li').click(function() {
            ind = $(this).index() - 1;
            console.log(ind);

            if ($(window).width() < 767) {
                $('body').find('.sidebar').removeClass('expand-menu');
            }
            if (!$(this).hasClass('menu-toggle')) {
                if ($(this).hasClass('active')) {
                    $('.btn-grp li').removeClass('active');
                    $('.tab-content').find('.tab').hide();
                    $('.tab-content').removeClass('open');
                    $(this).removeClass('active');
                    $('.tab-content').removeClass('open');
                    $('.tab-content').find('.tab').eq(ind).hide();


                } else {
                    $('.btn-grp li').removeClass('active');
                    $('.tab-content').find('.tab').hide();
                    $('.tab-content').removeClass('open');
                    $(this).addClass('active');

                    if(ind === 0) {
                        setTimeout(function() {
                            $('.tab-content').addClass('open');
                            $('.tab-content').find('.tab').eq(ind).show();
                        }, 20);
                    }


                }
            }

        });

        $('.tab-links li').click(function() {
            if ($(this).text() == 'Unread') {
                $('.active').removeClass('active');
                $(this).addClass('active');
                $(this).parent().next().show();
            } else {
                $('.active').removeClass('active');
                $(this).addClass('active');
                $(this).parent().next().hide();
            }


        });

        $('.active-page').click(function() {
            if ($('.content').hasClass('open2')) {
                $('.content').removeClass('open2');
                $('.footer').removeClass('open2');
            } else if ($('.content').hasClass('open')) {
                $('.content').removeClass('open');
                $('.footer').removeClass('open');
            }
            if ($('.tab-content').hasClass('open')) {
                $('.tab-content').removeClass('open');
            }
        });
    }
    $('.setting-btn').click(function() {
        $('.modal').fadeIn();
    });
    $('.close-btn').click(function() {
        $('.modal').fadeOut();
    });
});
