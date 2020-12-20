(function($) {

	"use strict";

	var cfg = {		
		defAnimation   : "fadeInUp",    // default css animation		
		scrollDuration : 800,           // smoothscroll duration
		statsDuration  : 4000           // stats animation duration
	},	
	$WIN = $(window);

	var ssPreloader = function() {

		$WIN.on('load', function() {	

			// force page scroll position to top at page refresh
			$('html, body').animate({ scrollTop: 0 }, 'normal');

	      // will first fade out the loading animation 
	    	$("#loader").fadeOut("slow", function(){

	        // will fade out the whole DIV that covers the website.
	        $("#preloader").delay(300).fadeOut("slow");

	      }); 
	  	});
	}; 

	var ssMenuOnScrolldown = function() {

		var menuTrigger = $('#header-menu-trigger');

		$WIN.on('scroll', function() {

			if ($WIN.scrollTop() > 150) {				
				menuTrigger.addClass('opaque');
			}
			else {				
				menuTrigger.removeClass('opaque');
			}

		}); 
	};

   var ssOffCanvas = function() {

	       var menuTrigger = $('#header-menu-trigger'),
	       nav             = $('#menu-nav-wrap'),
	       closeButton     = nav.find('.close-button'),
	       siteBody        = $('body'),
	       mainContents    = $('section, footer');

		// open-close menu by clicking on the menu icon
		menuTrigger.on('click', function(e){
			e.preventDefault();
			menuTrigger.toggleClass('is-clicked');
			siteBody.toggleClass('menu-is-open');
		});

		// close menu by clicking the close button
		closeButton.on('click', function(e){
			e.preventDefault();
			menuTrigger.trigger('click');	
		});

		/* close menu clicking outside the menu itself
		siteBody.on('click', function(e){		
			if( !$(e.target).is('#menu-nav-wrap, #header-menu-trigger, #header-menu-trigger span') ) {
				menuTrigger.removeClass('is-clicked');
				siteBody.removeClass('menu-is-open');
			}
		});
        */
   };

	var ssSmoothScroll = function() {

		$('.smoothscroll').on('click', function (e) {
			var target = this.hash,
			$target    = $(target);
	 	
		 	e.preventDefault();
		 	e.stopPropagation();	   	

	    	$('html, body').stop().animate({
	       	'scrollTop': $target.offset().top
	      }, cfg.scrollDuration, 'swing').promise().done(function () {

	      	// check if menu is open
	      	if ($('body').hasClass('menu-is-open')) {
					$('#header-menu-trigger').trigger('click');
				}

	      	window.location.hash = target;
	      });
	  	});

	};

	var ssAnimations = function() {

		if (!$("html").hasClass('no-cssanimations')) {
			$('.animate-this').waypoint({
				handler: function(direction) {

					var defAnimationEfx = cfg.defAnimation;

					if ( direction === 'down' && !$(this.element).hasClass('animated')) {
						$(this.element).addClass('item-animate');

						setTimeout(function() {
							$('body .animate-this.item-animate').each(function(ctr) {
								var el       = $(this),
								animationEfx = el.data('animate') || null;	

	                  	if (!animationEfx) {
			                 	animationEfx = defAnimationEfx;	                 	
			               }

			              	setTimeout( function () {
									el.addClass(animationEfx + ' animated');
									el.removeClass('item-animate');
								}, ctr * 50);

							});								
						}, 100);
					}

					// trigger once only
	       		this.destroy(); 
				}, 
				offset: '95%'
			}); 
		}

	};
	
	var ssIntroAnimation = function() {

		$WIN.on('load', function() {
		
	     	if (!$("html").hasClass('no-cssanimations')) {
	     		setTimeout(function(){
	    			$('.animate-intro').each(function(ctr) {
						var el = $(this),
	                   animationEfx = el.data('animate') || null;		                                      

	               if (!animationEfx) {
	                 	animationEfx = cfg.defAnimation;	                 	
	               }

	              	setTimeout( function () {
							el.addClass(animationEfx + ' animated');
						}, ctr * 300);
					});						
				}, 100);
	     	} 
		}); 

	};

	(function ssInit() {

		ssPreloader();
		ssMenuOnScrolldown();
		ssOffCanvas();
		ssSmoothScroll();
		ssAnimations();
		ssIntroAnimation();		

	})(); 
})(jQuery);

    function hover(description) {
        document.getElementById('content').innerHTML = description;
    }

    $(document).ready(function(){
      $(".desc").mouseenter(function() {
          $('#content').stop().show();
      });
      
      $(".desc, #content").mouseleave(function() {
        if(!$('#content').is(':hover')){
          var contH = 20;             
          $('#content').hide();
          $('#content').height(contH);
        };
      });
    });

var iconCh = document.getElementById("menus");
// iconchooser show/hide
var iconChbutton = document.getElementById("cp4");
iconChbutton.onclick = function(){
  iconCh.style.display = "block";
}

// Get the <span> element that closes the modal
var bspan = document.getElementById("bclose");

// When the user clicks on <span> (x), close the modal
bspan.onclick = function() { 
  iconCh.style.display = "none";
}

function resizeCanvas() {
    const outerCanvasContainer = $('.artb')[0];
    
    const ratio = canvas.getWidth() / canvas.getHeight();
    const containerWidth   = outerCanvasContainer.clientWidth;
    const containerHeight  = outerCanvasContainer.clientHeight;

    const scale = containerWidth / canvas.getWidth();
    const zoom  = canvas.getZoom() * scale;
    canvas.setDimensions({width: containerWidth, height: containerWidth / ratio});
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
}

$(window).resize(resizeCanvas);

var canvas = new fabric.Canvas('c', {
	preserveObjectStacking: true,
	selection: false,
    width: 500,
    height: 400
});

resizeCanvas();

var HideControls = {
            'tl':true,
            'tr':false,
            'bl':true,
            'br':true,
            'ml':true,
            'mt':true,
            'mr':true,
            'mb':true,
            'mtr':true
        };

function addDeleteBtn(x, y){
    $(".deleteBtn").remove(); 
    var btnLeft = x-10;
    var btnTop = y-10;
    var deleteBtn = '<img src="images/delete.png" class="deleteBtn" style="position:absolute;top:'+btnTop+'px;left:'+btnLeft+'px;cursor:pointer;width:20px;height:20px;"/>';
    $(".canvas-container").append(deleteBtn);
}

canvas.on('object:selected',function(e){
        addDeleteBtn(e.target.oCoords.tr.x, e.target.oCoords.tr.y);
});

canvas.on('mouse:down',function(e){
    if(!canvas.getActiveObject())
    {
        $(".deleteBtn").remove(); 
    }
});

canvas.on('object:modified',function(e){
    addDeleteBtn(e.target.oCoords.tr.x, e.target.oCoords.tr.y);
});

canvas.on('object:scaling',function(e){
    $(".deleteBtn").remove(); 
});
canvas.on('object:moving',function(e){
    $(".deleteBtn").remove(); 
});
canvas.on('object:rotating',function(e){
    $(".deleteBtn").remove(); 
});
$(document).on('click',".deleteBtn",function(){
    if(canvas.getActiveObject())
    {
        canvas.remove(canvas.getActiveObject());
        $(".deleteBtn").remove();
    }
});

$(document.body).on('change', '#bgrnd_col', function () {
canvas.backgroundColor = document.getElementById('bgrnd_col').value;
canvas.renderAll();
});

$(document).ready(function () {

    $(".iconimagelist").click(function () {
        display($(this));
    });
});

function display($this) {
    var source = $("i", $this).attr("id");
    var textObjecticons = new fabric.IText(source, { 
        fontSize:48,
        fontFamily: 'Font Awesome 5 Free',
        left:30, 
        top:70, 
        objectCaching: false,
        transparentCorners: false,
        fill: '#000',
        cornerColor: 'blue',
        stroke: '#000',
        strokeWidth: 0,
        strokeUniform: true,
        radius:7,
        borderRadius: '25px', 
        hasRotatingPoint: true,
        cornerStyle: 'circle'
        });
    canvas.add(textObjecticons);
    canvas.renderAll();
}

var dwn = document.getElementById('lnkDownload');
  dwn.onclick = function () {
    download(canvas, 'myimage.png');
  };

/* Canvas Donwload */
function download(canvas, filename) {
  var lnk = document.createElement('a'),e;
  lnk.download = filename;
  lnk.href = canvas.toDataURL("image/png;base64");
  
  if (document.createEvent) {
    e = document.createEvent("MouseEvents");
    e.initMouseEvent("click", true, true, window,
    0, 0, 0, 0, 0, false, false, false,
    false, 0, null);

    lnk.dispatchEvent(e);
  } else if (lnk.fireEvent) {
    lnk.fireEvent("onclick");
  }
}

var objectToSendBack;

canvas.on("selection:created", function(event){
  objectToSendBack = event.target;
});
canvas.on("selection:updated", function(event){
  objectToSendBack = event.target;
});

var sendSelectedObjectBack = function() {
  canvas.sendToBack(objectToSendBack);
}

$(document.body).on('change', '#font-control', function () {
	var activeObj7 = canvas.getActiveObject();
	var colVal7 = document.getElementById('font-control').value;
    activeObj7.set({fontFamily: colVal7});
canvas.renderAll();
});

$('#control_border').change(function() {
  var cur_value = parseInt($(this).val());
  var activeObj = canvas.getActiveObject();
  activeObj.set({
    strokeWidth: cur_value
  });
  canvas.renderAll();
});

$(document.body).on('change', '#cp3', function () {
	var activeObj1 = canvas.getActiveObject();
	var colVal = document.getElementById('cp3').value;
    activeObj1.set({fill: colVal});
canvas.renderAll();
});

$(document.body).on('change', '#cp3a', function () {
	var activeObj2 = canvas.getActiveObject();
	var colVal2 = document.getElementById('cp3a').value;
    activeObj2.set({stroke: colVal2});
canvas.renderAll();
});

document.getElementById('checkbox-bold').onclick = function () {

	 var activeObj4 = canvas.getActiveObject();      
      if ($('#checkbox-bold').is(':checked')) {

        activeObj4.set("fontWeight", "bold");
      }
      else {
        activeObj4.set("fontWeight", "");
      }
        canvas.renderAll();
    }

document.getElementById('checkbox-ital').onclick = function () {
      
      var activeObj5 = canvas.getActiveObject();
      if ($('#checkbox-ital').is(':checked')) {

        activeObj5.set("fontStyle", "italic");
      }
      else {
        activeObj5.set("fontStyle", "");
      }
        canvas.renderAll();
    }

 document.getElementById('checkbox-undr').onclick = function () {
      
      var activeObj6 = canvas.getActiveObject();
      if ($('#checkbox-undr').is(':checked')) {

        activeObj6.set("underline", true);
      }
      else {
        activeObj6.set("underline", false);
      }
        canvas.renderAll();
    }

 document.getElementById('checkbox-over').onclick = function () {
      
      var activeObj6 = canvas.getActiveObject();
      if ($('#checkbox-over').is(':checked')) {

        activeObj6.set("overline", true);
      }
      else {
        activeObj6.set("overline", false);
      }
        canvas.renderAll();
    }

 document.getElementById('checkbox-strk').onclick = function () {
      
      var activeObj6 = canvas.getActiveObject();
      if ($('#checkbox-strk').is(':checked')) {

        activeObj6.set("linethrough", true);
      }
      else {
        activeObj6.set("linethrough", false);
      }
        canvas.renderAll();
    }

document.getElementById('title-font-size').onchange = function() {
	var activeObj3 = canvas.getActiveObject();
	var colVal3 = document.getElementById('title-font-size').value;
    activeObj3.set({fontSize: colVal3});
canvas.renderAll();
}

document.getElementById('newtxt').onclick = function () {
    
    var txtbox = document.getElementById('title').value;
    var newtxt = new fabric.IText(txtbox, { 
	fontSize:24,
	fontFamily: 'Font Awesome 5 Free',
	left:150, 
	top:20, 
	objectCaching: false,
	transparentCorners: false,
	cornerColor: 'blue',
	radius:7, 
	borderRadius: '25px', 
	hasRotatingPoint: true,
	underline:false,
	cornerStyle: 'circle'
	}); 
canvas.add(newtxt)
canvas.renderAll();
}

document.getElementById('grid').onclick = function () {
var grid = 10;
      if ($('#checkbox-grid').is(':checked')) {
// create grid
for (var i = 0; i < (600 / grid); i++) {
   canvas.add(new fabric.Line([i * grid, 0, i * grid, 600], {
      stroke: '#ccc',
      selectable: false
   }));
   canvas.add(new fabric.Line([0, i * grid, 600, i * grid], {
      stroke: '#ccc',
      selectable: false
   }))
}

// snap to grid
canvas.on('object:moving', options => {
   options.target.set({
      left: Math.round(options.target.left / grid) * grid,
      top: Math.round(options.target.top / grid) * grid
   });
});

canvas.on('object:scaling', options => {
   var target = options.target,
      w = target.width * target.scaleX,
      h = target.height * target.scaleY,
      snap = { // Closest snapping points
         top: Math.round(target.top / grid) * grid,
         left: Math.round(target.left / grid) * grid,
         bottom: Math.round((target.top + h) / grid) * grid,
         right: Math.round((target.left + w) / grid) * grid
      },
      threshold = grid,
      dist = { // Distance from snapping points
         top: Math.abs(snap.top - target.top),
         left: Math.abs(snap.left - target.left),
         bottom: Math.abs(snap.bottom - target.top - h),
         right: Math.abs(snap.right - target.left - w)
      },
      attrs = {
         scaleX: target.scaleX,
         scaleY: target.scaleY,
         top: target.top,
         left: target.left
      };
   switch (target.__corner) {
      case 'tl':
         if (dist.left < dist.top && dist.left < threshold) {
            attrs.scaleX = (w - (snap.left - target.left)) / target.width;
            attrs.scaleY = (attrs.scaleX / target.scaleX) * target.scaleY;
            attrs.top = target.top + (h - target.height * attrs.scaleY);
            attrs.left = snap.left;
         } else if (dist.top < threshold) {
            attrs.scaleY = (h - (snap.top - target.top)) / target.height;
            attrs.scaleX = (attrs.scaleY / target.scaleY) * target.scaleX;
            attrs.left = attrs.left + (w - target.width * attrs.scaleX);
            attrs.top = snap.top;
         }
         break;
      case 'mt':
         if (dist.top < threshold) {
            attrs.scaleY = (h - (snap.top - target.top)) / target.height;
            attrs.top = snap.top;
         }
         break;
      case 'tr':
         if (dist.right < dist.top && dist.right < threshold) {
            attrs.scaleX = (snap.right - target.left) / target.width;
            attrs.scaleY = (attrs.scaleX / target.scaleX) * target.scaleY;
            attrs.top = target.top + (h - target.height * attrs.scaleY);
         } else if (dist.top < threshold) {
            attrs.scaleY = (h - (snap.top - target.top)) / target.height;
            attrs.scaleX = (attrs.scaleY / target.scaleY) * target.scaleX;
            attrs.top = snap.top;
         }
         break;
      case 'ml':
         if (dist.left < threshold) {
            attrs.scaleX = (w - (snap.left - target.left)) / target.width;
            attrs.left = snap.left;
         }
         break;
      case 'mr':
         if (dist.right < threshold) attrs.scaleX = (snap.right - target.left) / target.width;
         break;
      case 'bl':
         if (dist.left < dist.bottom && dist.left < threshold) {
            attrs.scaleX = (w - (snap.left - target.left)) / target.width;
            attrs.scaleY = (attrs.scaleX / target.scaleX) * target.scaleY;
            attrs.left = snap.left;
         } else if (dist.bottom < threshold) {
            attrs.scaleY = (snap.bottom - target.top) / target.height;
            attrs.scaleX = (attrs.scaleY / target.scaleY) * target.scaleX;
            attrs.left = attrs.left + (w - target.width * attrs.scaleX);
         }
         break;
      case 'mb':
         if (dist.bottom < threshold) attrs.scaleY = (snap.bottom - target.top) / target.height;
         break;
      case 'br':
         if (dist.right < dist.bottom && dist.right < threshold) {
            attrs.scaleX = (snap.right - target.left) / target.width;
            attrs.scaleY = (attrs.scaleX / target.scaleX) * target.scaleY;
         } else if (dist.bottom < threshold) {
            attrs.scaleY = (snap.bottom - target.top) / target.height;
            attrs.scaleX = (attrs.scaleY / target.scaleY) * target.scaleX;
         }
         break;
   }
   target.set(attrs);
});
      }
      else {
    canvas.remove(new fabric.Line([i * grid, 0, i * grid, 600], {
      stroke: '#ccc',
      selectable: false
   }));
   canvas.remove(new fabric.Line([0, i * grid, 600, i * grid], {
      stroke: '#ccc',
      selectable: false
   }))
      }
        canvas.renderAll();
}

$(document).ready(function () {

    $(".bimgimagelist").click(function () {
        bdisplay($(this));
    });
});

function bdisplay($this) {
    var bimgefill = $("img", $this).attr("id");
    canvas.setBackgroundImage(bimgefill);
    canvas.renderAll();
}

$(document).ready(function () {

    $(".logoimagelist").click(function () {
        gdisplay($(this));
    });
});

function gdisplay($this) {
    var source = $("img", $this).attr("src");
    fabric.loadSVGFromURL(source, function(myImg) {
    var logoimage = new fabric.Group(myImg, { 
		left:5, 
		top:50, 
		width: 200,
		height: 200,
		objectCaching: false,
		transparentCorners: false,
		cornerColor: 'blue',
		radius:7,
		borderRadius: '25px', 
		hasRotatingPoint: true,
		cornerStyle: 'circle'
    });
    console.log(source);
    canvas.add(logoimage);
    canvas.renderAll();
});
}

