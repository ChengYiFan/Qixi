$(function(){
	Qixi();
});

/**
*七夕主题
*@type{Object}
*/
var Qixi = function(){
	var confi = {
		////////////
		//参数设置//
		////////////

		//是否维持缩放比
		keepZoomRadio:false,

		//设置容器尺寸，否则默认全屏，如果设置需要输入具体的PX值
		layer:{
			"width":"100%",
			"height":"100%",
			"left":"0",
			"top":"0"
		},

		//音乐配置
		audio:{
			enable:true,//是否开启音乐
			playURL:"http://www.imooc.com/upload/media/happy.wav",//正常播放地址
			cycleURL:"http://www.imooc.com/upload/media/circulation.wav"//正常循环播放地址
		},
		//时间设置(时间单位毫秒)
		setTime:{
			walkToThird:6000,//走第一段路，1/3屏幕宽度所用时间，走完后背景动
			walkToMiddle:6500,//走第二段路，1/2屏幕宽度所用时间，走到商店
			walkToEnd:6500,//走第三段路，走到桥

			walkToBridge:2000,//上桥
			bridgeWalk:2000,//桥上走到中间

			walkToShop:1500,//进商店时间
			walkOutShop:1500,//出商店时间

			openDoorTime:800,//开门时间
			shutDoorTime:500,//关门时间

			waitRatate:850,//男女等待转身时间
			waitFlower:800//模拟取花等待时间
		},
		//雪花图路径
		snowflakeURI:[
			"images/snowflake/snowflake1.png",
			"images/snowflake/snowflake2.png",
			"images/snowflake/snowflake3.png",
			"images/snowflake/snowflake4.png",
			"images/snowflake/snowflake5.png",
			"images/snowflake/snowflake6.png"
		]
	};//confi end

	var instanceX;
	var container = $("#content");
	container.css(confi.layer);
	var visualWidth=container.width();var visualHeight=container.height();
	//根据类名获取走路的坐标数据
	var getValue=function(className){
		var $elem=$(""+className+"");
		if($elem.length)
			return{height:$elem.height(),top:$elem.position().top}
	};
	//路的Y轴
	var pathY = function(){var data=getValue(".a_background_middle");return data.top + data.height / 2;}();
	//桥的Y轴
	var bridgeY=function(){var data=getValue(".c_background_middle");return data.top;}();
	var animationEnd=(function(){var explorer=navigator.userAgent;if(~explorer.indexOf("WebKit")){return"webkitAnimationEnd"}return"animationend"})();

	if(confi.audio.enable){
		var audio1=Hmlt5Audio(confi.audio.playURL);
		audio1.end(function(){Hmlt5Audio(confi.audio.cycleURL,true)});
	}

	var swipe=Swipe(container);//初始化滑动对象
	//swipe.scrollTo(visualWidth*2,8000);
	function scrollTo(time,proportionX){
		var distX=visualWidth*proportionX;swipe.scrollTo(distX,time);
	}


	var boy=BoyWalk();//初始化小男孩对象
	//小男孩走路控制
	boy.walkTo(confi.setTime.walkToThird,0.6).then(function(){
		scrollTo(confi.setTime.walkToMiddle,1);
		return boy.walkTo(confi.setTime.walkToMiddle,0.5);
	}).then(function(){
		bird.fly();
	}).then(function(){
		boy.stopWalk();
		return BoyToShop(boy);
	}).then(function(){
		girl.setOffset();
		scrollTo(confi.setTime.walkToEnd,2);
		return boy.walkTo(confi.setTime.walkToEnd,0.15)
	}).then(function(){
		return boy.walkTo(confi.setTime.walkTobridge,0.25,(bridgeY-girl.getHeight())/visualHeight)
	}).then(function(){
		var proportionX=(girl.getOffset().left-boy.getWidth()-instanceX+girl.getWidth()/5)/visualWidth;
		return boy.walkTo(confi.setTime.bridgeWalk,proportionX)
	}).then(function(){
		boy.resetOriginal();
		setTimeout(function(){
			girl.rotate();
			boy.rotate(function(){
				logo.run();
				snowflake()
			}
		)},confi.setTime.waitRotate)
	});
	

	/**
	*
	*小男孩部分代码封装
	*/
	function BoyWalk(){
		var $boy=$("#boy");
		var boyWidth=$boy.width();
		var boyHeight=$boy.height();
		//alert(pathY);
		// 修正小男孩的正确位置
        // 路的中间位置减去小孩的高度，25是一个修正值
		$boy.css({top:pathY-boyHeight+25});
		function pauseWalk(){
			$boy.addClass("pauseWalk");
		}
		function restoreWalk(){
			$boy.removeClass("pauseWalk");
		}
		function slowWalk(){
			$boy.addClass("slowWalk");
		}
		//开始走路，给出left的坐标值，同时给出变化的时间就让人物动了
		function stratRun(options,runTime){
			var dfdPlay=$.Deferred();
			restoreWalk();
			$boy.transition(options,runTime,"linear",function(){dfdPlay.resolve()});
			return dfdPlay;
		}
		function walkRun(time,dist,disY){
			time=time||3000;slowWalk();
			var d1=stratRun({"left":dist+"px","top":disY?disY:undefined},time);
			return d1;
		}
		function walkToShop(doorObj,runTime){
			var defer=$.Deferred();
			var doorObj=$(".door");
			var offsetDoor=doorObj.offset();
			var doorOffsetLeft=offsetDoor.left;
			var offsetBoy=$boy.offset();
			var boyOffetLeft=offsetBoy.left;
			instanceX=(doorOffsetLeft+doorObj.width()/2)-(boyOffetLeft+$boy.width()/2);
			var walkPlay=stratRun({transform:"translateX("+instanceX+"px),scale(0.3,0.3)",opacity:0.1},runTime);
			walkPlay.done(function(){
				$boy.css({opacity:0});
				defer.resolve()
			});
			return defer;
		}
		function walkOutShop(runTime){
			var defer=$.Deferred();
			restoreWalk();
			var walkPlay=stratRun({transform:"translate("+instanceX+"px,0px),scale(1,1)",opacity:1},runTime);
			walkPlay.done(function(){defer.resolve()});
			return defer
		}
		//计算距离
		function calculateDist(direction,proportion){
			return(direction=="x"?visualWidth:visualHeight)*proportion
		}
		return{
			walkTo:function(time,proportionX,proportionY){
				var distX=calculateDist("x",proportionX);
				var distY=calculateDist("y",proportionY);
				return walkRun(time,distX,distY);
			},
			stopWalk:function(){
				pauseWalk();
			},
			resetOriginal:function(){
				this.stopWalk();
				$boy.removeClass("slowWalk slowFlolerWalk").addClass("boyOriginal")
			},
			toShop:function(){return walkToShop.apply(null,arguments)},
			outShop:function(){return walkOutShop.apply(null,arguments)},
			rotate:function(callback){
				restoreWalk();
				$boy.addClass("boy-rotate");
				if(callback){
					$boy.on(animationEnd,function(){
						callback();
						$(this).off()
					})
				}
			},
			getWidth:function(){
				return $boy.width()
			},
			getDistance:function(){return $boy.offset().left},
			talkFlower:function(){$boy.addClass("slowFlolerWalk")}
		}; 
	}//function BoyWalk() end

	var BoyToShop=function(boyObj){
		var defer=$.Deferred();
		var $door=$(".door");
		var doorLeft=$(".door-left");
		var doorRight=$(".door-right");
		function doorAction(left,right,time){
			var defer=$.Deferred();
			var count = 2;
			//等待开门完成
			var complete=function(){
				if(count==1){defer.resolve();return}
				count--
			};
			doorLeft.transition({"left":left},time,complete);
			doorRight.transition({"left":right},time,complete);
			return defer;
		}
		function openDoor(time){
			return doorAction("-50%","100%",time);
		}
		function shutDoor(time){
			return doorAction("0%","50%",time);
		}
		function talkFlower(){
			var defer=$.Deferred();
			boyObj.talkFlower();
			setTimeout(function(){defer.resolve()},confi.setTime.waitFlower);
				return defer;
		}
		var lamp={
			elem:$(".b_background"),
			bright:function(){this.elem.addClass("lamp-bright")},
			dark:function(){this.elem.removeClass("lamp-bright")}
		};
		var waitOpen=openDoor(confi.setTime.openDoorTime);
		waitOpen.then(function(){
			lamp.bright();
			return boyObj.toShop($door,confi.setTime.walkToShop)
		}).then(function(){
				return talkFlower()
		}).then(function(){
				return boyObj.outShop(confi.setTime.walkOutShop)
		}).then(function(){
				shutDoor(confi.setTime.shutDoorTime);
				lamp.dark();
				defer.resolve();
		});
		return defer;
	};//BoyToShop end;

	var girl={
		elem:$(".girl"),getHeight:function(){return this.elem.height()},
		rotate:function(){this.elem.addClass("girl-rotate")},
		setOffset:function(){this.elem.css({left:visualWidth/2,top:bridgeY-this.getHeight()})},
		getOffset:function(){return this.elem.offset()},
		getWidth:function(){return this.elem.width()}
	};
	var bird={
		elem:$(".bird"),
		fly:function(){
			this.elem.addClass("birdFly");
			this.elem.transition({right:visualWidth},15000,"linear")
		}
	};
	var logo={
		elem:$(".logo"),
		run:function(){
			this.elem.addClass("logolightSpeedIn").on(animationEnd,function(){$(this).addClass("logoshake").off()})
		}
	};
	
	function snowflake(){
		var $flakeContainer=$("#snowflake");
		function getImagesName(){
			return confi.snowflakeURI[[Math.floor(Math.random()*6)]]
		}
		function createSnowBox(){
			var url=getImagesName();
			return $('<div class="snowbox" />').css({
				"width":41,"height":41,"position":"absolute",
				"backgroundSize":"cover","zIndex":100000,"top":"-41px","backgroundImage":"url("+url+")"
			}).addClass("snowRoll")
		}
		setInterval(function(){
			var startPositionLeft=Math.random()*visualWidth-100,startOpacity=1;
			endPositionTop=visualHeight-40,endPositionLeft=startPositionLeft-100+Math.random()*500,
			duration=visualHeight*10+Math.random()*5000;
			var randomStart=Math.random();
			randomStart=randomStart<0.5?startOpacity:randomStart;
			var $flake=createSnowBox();
			$flake.css({left:startPositionLeft,opacity:randomStart});
			$flakeContainer.append($flake);
			$flake.transition({top:endPositionTop,left:endPositionLeft,opacity:0.7},duration,"ease-out",function(){$(this).remove()})
		},200)
	}
	function Hmlt5Audio(url,isloop){
		var audio=new Audio(url);
		audio.autoplay=true;
		audio.loop=isloop||false;
		audio.play();
		return{
			end:function(callback){
				audio.addEventListener("ended",function(){callback()},false);
			}
		};
	}
};//七夕主题 end

/**
*1.页面布局
*2.页面之间的卷滚切换效果
*/
function Swipe(container,options){
	// 获取第一个子节点
	var element=container.find(":first");
	//滑动对象
	var swipe = {};
	// li页面数量
	var slides = element.find(">");
	// 获取容器尺寸
    var width = container.width();
    var height = container.height();
    // 设置ul页面总宽度
    element.css({
        width  : (slides.length * width) + 'px',
        height : height + 'px'
    });
	// 设置每一个页面li的宽度
	$.each(slides, function(index) {
		var slide = slides.eq(index); //获取到每一个li元素    
		slide.css({
			width:width+'px',
			height:height+'px'
		});
	});


	var isComplete=false;
	var timer;
	var callbacks={};
	container[0].addEventListener("transitionend",function(){isComplete=true},false);
	function monitorOffet(element){
		timer=setTimeout(function(){
			if(isComplete){
				clearInterval(timer);
				return
			}
			callbacks.move(element.offset().left);
			monitorOffet(element)},500)
	}
	swipe.watch=function(eventName,callback){
		callbacks[eventName]=callback
	};

	//页面之间的卷滚切换效果,在speed的时间内，移动X的位置
	swipe.scrollTo=function(x,speed){
		element.css({"transition-timing-function":"linear","transition-duration":speed+"ms","transform":"translate3d(-"+x+"px,0px,0px)"});//设置页面X轴移动
		return this;
	}
	return swipe;
}//functiobn Swipe() end