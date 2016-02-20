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

/*
jQuery listeners to be instantiated after base.html template load.
Registering clicks on the menus and handling css changes that
govern the expanding menu actions.
*/


goldstone.setBaseTemplateListeners = function() {

    // tooltips for side-menu bar icons
    // trigger: 'hover' will dismiss when mousing-out
    $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover'
    });

    // when clicking the 'expand' arrow
    $('.menu-toggle').click(function() {

        // close alert menu
        $('.tab-content').removeClass('open');

        // expand/contract side menu
        $('.sidebar').toggleClass('expand-menu');

        // flip direction of expand icon
        $(this).find('.expand').toggleClass('open');

        // toggle menu slide-out for content and footer
        $('.content').toggleClass('open');
        $('.footer').toggleClass('open');
    });

    // icon / username top-right menu functionality 
    $('.user-control').click(function() {
        $('.menu-wrapper').slideToggle('fast');
    });
    $('.user-control').mouseleave(function() {
        $('.menu-wrapper').slideUp('fast');
    });

    // listener for alert divs visible in side alerts menu
    $('.remove-btn').click(function() {
        $(this).parent().remove();
    });

    $('.tab-links li').click(function() {

        // for tabs inside side alerts menu
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

    // listeners for sidebar menu icon visual classes
    $('.btn-grp').on('click', 'li', function() {

        // don't change current tab highlighting when
        // clicking alert or expand buttons
        if ($(this).hasClass('menu-toggle')) {
            return;
        }
        if ($(this).hasClass('alerts-tab')) {
            $('.tab-content').toggleClass('open');
            $('.tab-content').find('.tab').show();
            return;
        }

        // otherwise add icon styling
        $('.btn-grp li').removeClass('active active-page');
        $(this).addClass('active active-page');
    });

};
