$(document).ready(function(){
	if($('[data-toggle="tooltip"]').length){
		$('[data-toggle="tooltip"]').tooltip();
	}

			$('.menu-toggle').click(function(){
				$('.tab-content').removeClass('open');
				if($('.sidebar').hasClass('expand-menu')){
					$('.sidebar').removeClass('expand-menu');
				}
				else{
					$('.sidebar').addClass('expand-menu');
				}
				//$('body').find('.sidebar').toggleClass('expand-menu');
				$(this).find('.expand').toggleClass('open');

				if($('.content').hasClass('open2')){
					$('.content').removeClass('open2');
					$('.footer').removeClass('open2');
				}

				if($(window).width() < 767){
							$('.content').toggleClass('open');
							$('.footer').toggleClass('open');
						}
						else{
							if($('.content').hasClass('open')){
					$('.content').removeClass('open');
					$('.footer').removeClass('open');
				}
				else{
					$('.content').addClass('open');
					$('.footer').addClass('open');
				}
						}
			});

			$('.user-control').click(function(){
				$('.menu-wrapper').slideToggle('fast');
			});

			$('.user-control').mouseleave(function(){
				$('.menu-wrapper').slideUp('fast');
			});

			$('.remove-btn').click(function(){
				$(this).parent().remove();
			});

			if($('.btn-grp').length){
				var ind;
				$('.btn-grp li').click(function(){
					if($(this).hasClass('active')){
						$(this).removeClass('active');
					$('.tab-content .tab').hide();
					$('.tab-content').removeClass('open');

					}
					else if($(this).siblings().hasClass('active')){
						$('.btn-grp li').removeClass('active');
					$('.tab-content .tab').hide();
					$('.tab-content').removeClass('open');
						if(!($(this).hasClass('menu-toggle')) && !($(this).hasClass('active-page'))){

						$(this).addClass('active');
						if($(this).hasClass('active')){
							$('.content').addClass('open2');
							$('.footer').addClass('open2');
						}
						else{
							$('.content').removeClass('open2');
							$('.footer').removeClass('open2');
						}
						ind = $(this).index() - 1;
						$('.tab-content').addClass('open');
						$('.tab-content').find('.tab').eq(ind).show(200);
					}
					}
					else{
						$('body').find('.sidebar').addClass('open');
					if($('body').find('.sidebar').hasClass('expand-menu') && !($(this).hasClass('menu-toggle'))){
						if($(window).width() < 767){
							$('body').find('.sidebar').removeClass('expand-menu');
						}
					}
					if(!($(this).hasClass('menu-toggle')) && !($(this).hasClass('active-page'))){

						$(this).addClass('active');
						if($(this).hasClass('active')){
							$('.content').addClass('open2');
							$('.footer').addClass('open2');
						}
						else{
							$('.content').removeClass('open2');
							$('.footer').removeClass('open2');
						}
						ind = $(this).index() - 1;
						$('.tab-content').addClass('open');
						$('.tab-content').find('.tab').eq(ind).show(200);
					}
					}
				});

				$('.tab-links li').click(function(){
					if(!($(this).hasClass('active'))){
						$(this).siblings().removeClass('active');
					$(this).parents('.subtab').children('.sub-tab-content').find('.tabs').hide();
					// $('.sub-tab-content .tabs').hide();
					$(this).addClass('active');
					ind = $(this).index();
					$(this).parents('.subtab').find('.tabs').eq(ind).show();
					}

				});

				$('.active-page').click(function(){
					if($('.content').hasClass('open2')){
						$('.content').removeClass('open2');
						$('.footer').removeClass('open2');
					}
					else if($('.content').hasClass('open')){
						$('.content').removeClass('open');
						$('.footer').removeClass('open');
					}
					if($('.tab-content').hasClass('open')){
						$('.tab-content').removeClass('open');
					}
				});
			}
			$('.setting-btn').click(function(){
				$('.modal').fadeIn();
			});
			$('.close-btn').click(function(){
				$('.modal').fadeOut();
			});
});
