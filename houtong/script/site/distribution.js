// 使用闭包
(function() {
	//
	//window.onload = pageInit;
	$(pageInit);
	//
	var debug = window["debug"] || function (){};
	// 
	var __config = {
		_note_info : "默认配置信息,这堆配置信息,可以通过后台配置来覆盖",
		width_dept : 200, // 宽
		height_dept : 140,
		padding_dept : 25,
		radius_dept : 10,
		margin_parent : 45, // 间距
		margin_partner : 30,
		downposition : null,
		prevposition : null,
		offset : {x: 0, y:0},
		dist_height : 200, // 正态分布图的高度
		dist_width : 600,
		showDistributionImage : showDistributionImage,
		//
		direction : 1, //拓扑方向. 0为从左到右, 1为从上到下
		zoom_num : 10, // 缩放倍数,小数. 数字越小则距离屏幕前的你越近,显示越大
		expand_level : 3, // 展开级别,展开全部,则设置为100即可
		expand_all : 0,	  // 展开所有
		min_paper_width : 800,
		min_paper_height : 600,
		left_paper : 200, // 最左上角的 paper
		top_paper : 50,
		line_color : "#3333ff", // 连线的颜色
		//
		orginfo_json_url : 'api/orginfo2.json'
	};
	//
	var global = {
		svg : null
		,paper : null
		, sbar : null
		, data : null
		, config : __config
		, currentCacheDept : null
	};
	window.global = global;


	// 绘制正态分布图
	function drawDistribution(paper){
		//
		paper = paper || global.paper;
		// 清空旧有的元素
		paper.clear();
		//
		var expand_level = global.config.expand_level;
		
		// 1. 遍历,计算整体大小,调用另一个递归方法来计算
		// 绘制曲线
		//
		paper.distributionPath(global.config);
		
		// 
		refreshPaperZoom();
		// 4. 绑定事件
		
		// 5. 绘制复选框等其他按钮
		//
		return null;
	};
	//
	// 自适应 paper 大小
	function fitPaperSize(paper, tree_with_xy, expand_level){
		// 设置paper的大小
		var spanX = tree_with_xy.spanX + global.config.left_paper * 2.5;
		var spanY = tree_with_xy.spanY + global.config.top_paper * 2.5;
		
		var width = global.config.min_paper_width;
		var height = global.config.min_paper_height;
		// 比对最小限制
		if(spanX > width){
			width = spanX;
		}
		if(spanY > height){
			height = spanY;
		}
		paper.setSize(width, height);
	};
	
	
	
	
	// 显示部门信息
	function showDistributionImage(){
		//
		var paper = global.paper;
		//
		//
		// 这是设置基础形状,需要进行封装
		drawDistribution(paper);
		//
		// 6. 重置一些值
    	global.config.prevposition=null;
    	global.config.downposition=null;
    	global.config.offset = {x: 0, y:0};
	};
	//
	
    // 刷新paper的zoom
    function refreshPaperZoom(){
		//
		var paper = global.paper;
		var zoomNum = global.config.zoom_num;
		//
		var width = paper.width;
		var height = paper.height;
		//
		var nw = width * zoomNum /10;
		var nh = height * zoomNum / 10;
		//
		var x = global.config.offset.x || 0;
		var y = global.config.offset.y || 0;
		//
		var fit = false;
		//
		paper.setViewBox(x, y,nw, nh, fit);
		//
		$(".transient").remove();
    };
	//
	function currentCacheDept(node){
		if(node){
			global.currentCacheDept = node;
		}
		return global.currentCacheDept;
	};
	
	function refreshDeptTree(){
		showDistributionImage();
		
	};
	
	// 加载 Raphael
	function loadRaphael(holderid) {
		//
		var holder = document.getElementById(holderid);
		//
		newPaper(holder);
		
		// 然后就完了。
		// 等着触发事件. 然后绘制相应的图形
	};
	//
	function newPaper(holder){
		//
		var $holder = $(holder);
		//
		var _width = $holder.width();
		var _height = $holder.height();
		//
		if(_width > global.config.min_paper_width){
			global.config.min_paper_width = _width;
		}
		if(_height > global.config.min_paper_height){
			global.config.min_paper_height = _height;
		}
		
		
		var width = global.config.min_paper_width;
		var height = global.config.min_paper_height;
		// paper 画纸。
		var paper = new Raphael(holder, width, height);
		// 持有
		global.paper = paper;
		global.svg = paper ? paper.canvas : null;
	};
	// 
	

	// 将svg保存为png
	function saveSVGToPNG(imgId) {
		//
		var canvas = document.getElementById("tempcanvas");

		var img = document.getElementById(imgId);
		//
		//load a svg snippet in the canvas
		var svg = global.svg;
		if(svg){
			// 修改了源码,将文本重复问题解决
			canvg(canvas, svg.outerHTML);
		}
		//
		//
		var image = new Image();
		image.src = canvas.toDataURL("image/png");
		
		//将canvas转成图片
		var imgSrc = image.src;//canvas.toDataURL("image/png");
		img.src = "";
		img.src = imgSrc;
		return imgSrc;
	};


	//
	function bindEvents() {
		//
		var $holder = $("#holder");
		//
		var $export_image = $("#btn_export_image");
		var $btn_direction_toggle = $("#btn_direction_toggle");
		var $checkbox_expand_all = $("#checkbox_expand_all");
		var $btn_fullscreen = $("#btn_fullscreen");
		var $savedimg_anchor = $("#savedimg_anchor");
		var $popup_saveimage_area = $("#popup_saveimage_area");
		var $btn_close_popup = $("#btn_close_popup");
		var $savefile = $("#savefile"); // 用来
		//
		$export_image.click(function() {
			//
			var imgSrc = saveSVGToPNG("savedimg") ;
			var dir = global.config.direction ?  "纵向" : "横向" ;
			var fileName = "产品特效图_" + dir + "_"+ new Date().getTime();
			//
			$popup_saveimage_area.removeClass("hide");
			//
			$savedimg_anchor.attr("href", imgSrc);
			$savedimg_anchor.attr("download", "" + fileName + ".png");
		});
		
		//
        $btn_fullscreen.click(function () {
            if ($.util.supportsFullScreen) {
                if ($.util.isFullScreen()) {
                    $.util.cancelFullScreen();
                } else {
                    $.util.requestFullScreen("#holder");
                }
            } else {
                $.easyui.messager.show("当前浏览器不支持全屏 API，请更换至最新的 Chrome/Firefox/Safari 浏览器或通过 F11 快捷键进行操作。");
            }
        });
		//
		
		// 闭包内的函数
		function hidePopUp(){
			$popup_saveimage_area.addClass("hide");
		};
		//
		$btn_close_popup.click(function(){
			hidePopUp();
		});
		
		// 监听键盘按键
		$(document).keyup(function (e) {
			//
			var WHICH_ESC = 27;
			var WHICH_UP = 38;
			var WHICH_DOWN = 40;
			//
			var which = e.which;
			
			// 监听ESC键
	        if (which === WHICH_ESC) {
	            /** 这里编写当ESC时的处理逻辑！ */
	           hidePopUp();
	           return stopEvent(e);
	        }
	    });
	    
        
	}; // end of bindEvents
	
	//
	function getorginfo_tree(){
		var $orginfo_tree = $('#orginfo_tree');
		//
		return $orginfo_tree;
	};
	//
	function currentTree(){
		var $orginfo_tree = getorginfo_tree();
		return $orginfo_tree.jstree();
	};

	// 请参考: http://www.jstree.com/api/#/?q=.jstree%20Event
	function loadJsTree() {
		//
		var config_core_data = {
			'url' : function(node) {
				// 指定 AJAX_JSON的地址
				return global.config.orginfo_json_url;
			},
			'data' : function(node) {
				return {
					'id' : node.orgid// 转换,      自定义ID, node.orgid
					,
					'text' : node.name +"(" + (node.empnum||0) + ")"	// 转换
				};
			}
		};
		var config = {
			'core' : {
				'data' : config_core_data
			}
		};
		//
		//$.jstree.defaults.core.themes.variant = "large";
		//
		var $orginfo_tree = $('#orginfo_tree');
		var $current_org_name = $('#current_org_name');
		// 绑定选择事件; select_node.jstree
		$orginfo_tree.on('select_node.jstree', function(e, data) {
			//
			var node = data.node;
			//
			var text = node.text || "";
			//
			if(text.indexOf("(") > 0){
				var ind = text.indexOf("(");
				text = text.substr(0, ind);
			}
			$current_org_name.text(text); 
			// 
			showDistributionImage();
		});
		
		// 绑定选择事件
		$orginfo_tree.on('changed.jstree', function(e, data) {
			//
			var action = data.action;
			if("ready" == action){
				var root = data.instance.get_node(data.selected[0]);
				
				var node = root || {};
				//
				var text = node.text;
			if(text.indexOf("(") > 0){
				var ind = text.indexOf("(");
				text = text.substr(0, ind);
			}
				$current_org_name.text(text); 
				// 
				showDistributionImage();
			}
		});
		//
		try{
			var tree = $orginfo_tree.jstree(config);
		} catch(ex){
			alert("请部署到Web服务器中访问"); // 捕获不到,杯具
		}

	};

	// 初始化页面JS调用
	function pageInit() {
		var holderid = "holder";
		//
		try{
			// 加载 Raphael
			loadRaphael(holderid);
			// 
		} catch(ex){
			debug(ex);
		}
		try{
			// 加载 Tree
			loadJsTree();
		} catch(ex){
			debug(ex);
		}
		// 绑定各种自定义事件
		bindEvents();
	};

})();

//////////////////////////////////////////////////////////////////////////////////////
///////// 工具函数
//////////////////////////////////////////////////////////////////////////////////////

// 调试
function debug(obj) {
	if (undefined === obj ) {
		return;
	}
	// 只适用于具有console的浏览器
	if (window["console"] && window["console"]["dir"]) {
		window["console"]["dir"](obj);
		if(arguments.length > 1){
			var params = Array.prototype.slice.call(arguments, 1);
			for(var i=0; i < params.length; i++){
				window["console"]["dir"](params[i]);
			}
		}
	}
};

// 停止事件.
function stopEvent(e){
	if(!e){
		return;
	}
	if(e.stopPropagation){
		e.stopPropagation();
	}
	if(e.preventDefault){
		e.preventDefault();
	}
	//
	return false;
};



// 获取宽高
function wh(id){
	if(!id){
		return {};
	}
	return {
		w : $("#"+id).width(),
		h : $("#"+id).height()
	};
};

// 算高度的函数
function getDistHeight(data){
	//
	var h =  0;
	var len = data.length
	for(var i =0; i < len; i++){
		//
		var d = data[i];
		var v = d.value;
		// TODO 怎么算?
		var dis = len - Math.abs(len/2 -i);
		//
		h += Math.floor(dis) * v * 25 / len;
		//
	}
	//
	h = Math.round(h);
	h = Math.abs(h);
	h += 100;
	if(h < 100){
		h = 100;
	}
	if(h > 500){
		h = 500;
	}
	return h;
};

//
function getData(){
	// 有则直接返回
	var data = global.data;
	if(data){
		return data;
	}
	// 实际上需要到后台去请求
	data = [
		{
			id : "excellence"
			, info : "卓越"
			, color : "#6fdeee"
			, value : 1
		}
		,
		{
			id : "good"
			, info : "优秀"
			, color : "#0f0e6e"
			, value : 2
		}
		,
		{
			id : "well"
			, info : "良好"
			, color : "#ef0e6e"
			, value : 8
		}
		,
		{
			id : "ok"
			, info : "合格"
			, color : "#efde6e"
			, value : 2
		}
		,
		{
			id : "bad"
			, info : "待改进"
			, color : "#0f3e6e"
			, value : 1
		}
	];
	//
	global.data = data;
	//
	return data;
};




// 扩展 Raphael.fn, 成为插件
// (父节点, 子节点, direction, 线条色, 线条内部填充色)
Raphael.fn.distributionPath = function(config) {
	
	var paper = this;
    
    // 绘制或更新底部的拖动标尺
	loadSizeBar();
	
	var height = getDistHeight(getData());
	var width = config.dist_width || 500;
	var left_paper = config.left_paper;
	var top_paper = config.top_paper;
	var min_paper_height = config.min_paper_height;
	//
	var xs = left_paper;
	var xe = xs + width;
	//var ys = top_paper;
	//var ye = ys + height;
	
    // 画一条横线
    // 这条线固定,不与  height 挂钩 
    var yLine = 3* top_paper + height;
    //
    yLine = min_paper_height - 150;
    //
    paper.path(["M", left_paper - 10, yLine, "L", xe + 10, yLine]).attr({stroke: "#000" || Raphael.getColor(), "stroke-width": 2, "stroke-linecap": "round"});
    //
    
    //
    var pps = generatePoints();
    // 画曲线
    for(var i=0; i < pps.length; i++){
    	//
    	var ps = pps[i];
    	//
    	var color = "hsb(.6, .75, .75)";
        var c = paper.path(ps).attr({stroke: color || Raphael.getColor(), "stroke-width": 4, "stroke-linecap": "round"});
    }
    // 画竖线
    var lls = generateLines();
    var color = "#111" || Raphael.getColor();
    // 
    for(var i=0; i < lls.length; i++){
    	//
    	var ll = lls[i];
    	//
    	//var color = "#333";
        var c = paper.path(ll).attr({stroke: color || Raphael.getColor(), "stroke-width": 3, "stroke-linecap": "round"});
    }
    
    
	// 这个应该接收2个参数, xx 与 width; 方便偏移
    // 算比例
    function fnDistrinbution(i, sum){
    	//
    	var PI = Math.PI;
    	var res = Math.sin(PI*i/sum);
    	//
    	res = (res * res).toFixed(3);
    	//
    	return res;
    };
    // {width : 宽, height : "总的高度", i : "第几个点", sum 总的点数}
    function calDist(width, height, i, sum){
    	// 计算
    	//
    	var x1 = width * i / sum + left_paper;
    	var x2 = width * (i+1) / sum + left_paper;
    	//
    	// 根据X计算y
    	var y1 = height * fnDistrinbution(i, sum) + top_paper/2;
    	var y2 = height * fnDistrinbution(i+1, sum) + top_paper/2;
    	//
    	// 2 个关键点
    	var pk1 = {x: x1, y : yLine - y1};
    	var pk2 = {x: x2, y : yLine - y2};
    	
    	var p1 = ["M", pk1.x, pk1.y];
		//
		var p2 = ["S", pk1.x, pk1.y, pk2.x, pk2.y];
		//
    	var distP = [p1, p2];
    	//
    	return distP;
    };
    //
    function generatePoints(){
    	//
    	var points = [];
    	//
    	var sum = 100;
		
    	for(var i = 0; i < sum; i++){
    		//
    		var pn = calDist(width, height, i, sum);
    		//
    		points.push(pn);
    	}
    	//
    	return points;
    };
    //
    // {width : 宽, height : "总的高度", i : "第几个点", sum 总的点数}
    function calLine(width, height, i, sum){
    	
    	//
    	// 计算
    	//
    	var x1 = width * i / sum + left_paper;
    	var x2 = width * (i+1) / sum + left_paper;
    	//
    	// 根据X计算y
    	var y1 = height * fnDistrinbution(i, sum) + top_paper/2;
    	var y2 = height * fnDistrinbution(i+1, sum) + top_paper/2;
    	
    	//
    	// 2 个关键点
    	//
    	var pk1 = {x: x1, y : yLine - y1};
    	var pk2 = {x: x1, y : yLine};
    	//
    	
    	// 计算
    	//
    	var p1 = ["M", pk1.x, pk1.y ,
		    "L", pk2.x, pk2.y
		    ];
		//
    	//
    	return p1;
    };
    //
    function generateLines(){
    	
    	var lines = [];
    	//
    	var sum = getData().length;
		
    	for(var i = 0; i <= sum; i++){
    		//
    		var ll = calLine(width, height, i, sum);
    		// 
    		//
    		lines.push(ll);
    	}
    	//
    	return lines;
    };
    
    // 创建进度条
	function loadSizeBar() {
		//
		var data = getData();
        //
        var param = {
            	x : 180
            	, y : config.min_paper_height - 100
            	, width : 620
            	, height : 10
            	, data : data
            	, value : 10
            	, left_paper : config.left_paper
            	, paper : paper
            	, onchange : function(ndata){
            		// 回调函数
            		if(!ndata){
            			return;
            		}
            		// 算高度,刷新
            		var h = getDistHeight(data) || config.dist_height;
            		config.dist_height = h;
            		// 刷新
            		config.showDistributionImage();
          		}
        };
        var sbar = Raphael.sizebar(param);
	};
};
