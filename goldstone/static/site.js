/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

$(document).ready(function() {

    // trigger: 'hover' will dismiss when mousing-out
    $('[data-toggle="tooltip"]').tooltip({trigger: 'hover'});

    $('.menu-toggle').click(function() {
        $('.tab-content').removeClass('open');
        if ($('.sidebar').hasClass('expand-menu')) {
            $('.sidebar').removeClass('expand-menu');
        } else {
            $('.sidebar').addClass('expand-menu');
        }
        $(this).find('.expand').toggleClass('open');

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

            if ($(window).width() < 767) {
                $('body').find('.sidebar').removeClass('expand-menu');
            }
            if (!$(this).hasClass('menu-toggle')) {
                if ($(this).hasClass('active')) {
                    $('.tab-content').find('.tab').hide();
                    $('.tab-content').removeClass('open');
                    $('.tab-content').removeClass('open');
                    $('.tab-content').find('.tab').eq(ind).hide();

                } else {
                    $('.btn-grp li').removeClass('active');
                    $('.tab-content').find('.tab').hide();
                    $('.tab-content').removeClass('open');
                    $(this).addClass('active');

                    if (ind === 0) {
                        $('.tab-content').addClass('open');
                        $('.tab-content').find('.tab').eq(ind).show();
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
    }
    $('.setting-btn').click(function() {
        $('.modal').fadeIn();
    });
    $('.close-btn').click(function() {
        $('.modal').fadeOut();
    });
});
