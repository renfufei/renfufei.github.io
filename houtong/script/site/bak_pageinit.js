function debug(obj) {
	if (!obj) {
		return;
	}
	//
	if (window["console"] && window["console"]["dir"]) {
		window["console"]["dir"](obj);
		// 只适用于具有console的浏览器
	}
};

// 使用闭包
(function() {

	//
	var default_config = {
		_note_info : "默认配置信息",
		default_width : 900,
		default_height : 480,
		orginfo_json_url : 'api/orginfo.json'
	};
	//
	var svg = null;

	// 扩展 fn, 成为插件
	Raphael.fn.connection = function(obj1, obj2, line, bg) {
		if (obj1.line && obj1.from && obj1.to) {
			line = obj1;
			obj1 = line.from;
			obj2 = line.to;
		}
		var bb1 = obj1.getBBox(), bb2 = obj2.getBBox(), p = [{
			x : bb1.x + bb1.width / 2,
			y : bb1.y - 1
		}, {
			x : bb1.x + bb1.width / 2,
			y : bb1.y + bb1.height + 1
		}, {
			x : bb1.x - 1,
			y : bb1.y + bb1.height / 2
		}, {
			x : bb1.x + bb1.width + 1,
			y : bb1.y + bb1.height / 2
		}, {
			x : bb2.x + bb2.width / 2,
			y : bb2.y - 1
		}, {
			x : bb2.x + bb2.width / 2,
			y : bb2.y + bb2.height + 1
		}, {
			x : bb2.x - 1,
			y : bb2.y + bb2.height / 2
		}, {
			x : bb2.x + bb2.width + 1,
			y : bb2.y + bb2.height / 2
		}], d = {}, dis = [];
		for (var i = 0; i < 4; i++) {
			for (var j = 4; j < 8; j++) {
				var dx = Math.abs(p[i].x - p[j].x), dy = Math.abs(p[i].y - p[j].y);
				if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
					dis.push(dx + dy);
					d[dis[dis.length - 1]] = [i, j];
				}
			}
		}
		if (dis.length == 0) {
			var res = [0, 4];
		} else {
			res = d[Math.min.apply(Math, dis)];
		}
		var x1 = p[res[0]].x, y1 = p[res[0]].y, x4 = p[res[1]].x, y4 = p[res[1]].y;
		dx = Math.max(Math.abs(x1 - x4) / 2, 10);
		dy = Math.max(Math.abs(y1 - y4) / 2, 10);
		var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3), y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3), x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3), y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
		var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
		if (line && line.line) {
			line.bg && line.bg.attr({
				path : path
			});
			line.line.attr({
				path : path
			});
		} else {
			var color = typeof line == "string" ? line : "#000";
			return {
				bg : bg && bg.split && this.path(path).attr({
					stroke : bg.split("|")[0],
					fill : "none",
					"stroke-width" : bg.split("|")[1] || 3
				}),
				line : this.path(path).attr({
					stroke : color,
					fill : "none"
				}),
				from : obj1,
				to : obj2
			};
		}
	};

	//var el;
	function loadRaphael() {
		var dragger = function() {
			this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
			this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
			this.animate({
				"fill-opacity" : .2
			}, 500);
		};
		var move = function(dx, dy) {
			var att = this.type == "rect" ? {
				x : this.ox + dx,
				y : this.oy + dy
			} : {
				cx : this.ox + dx,
				cy : this.oy + dy
			};
			this.attr(att);
			for (var i = connections.length; i--; ) {
				r.connection(connections[i]);
			}
			r.safari();
		};
		var up = function() {
			this.animate({
				"fill-opacity" : 0
			}, 500);
		};
		// 创建一个 画布
		var r = Raphael("holder", default_config.default_width, default_config.default_height);
		var connections = [];

		// 这是设置基础形状,需要进行封装
		var shapes = [r.ellipse(190, 100, 30, 20), r.rect(290, 80, 60, 40, 10), r.rect(290, 180, 60, 40, 2), r.ellipse(450, 100, 20, 20)];
		for (var i = 0, ii = shapes.length; i < ii; i++) {
			var color = Raphael.getColor();
			shapes[i].attr({
				fill : color,
				stroke : color,
				"fill-opacity" : 0,
				"stroke-width" : 2,
				cursor : "move"
			});
			// 添加拖动事件
			//shapes[i].drag(move, dragger, up);
		}
		// 这是设置连线,需要进行封装
		connections.push(r.connection(shapes[0], shapes[1], "#aaa"));
		connections.push(r.connection(shapes[1], shapes[2], "#aaa", "#aaa|5"));
		connections.push(r.connection(shapes[1], shapes[3], "#000", "#aaa"));
		// 这只是暴露个变量,方便调试
		svg = r ? r.canvas : null;
		window["r"] = r;
	};

	// 将svg保存为png
	function saveSVGToPNG(imgId) {
		//
		var canvas = document.getElementById("tempcanvas");

		var img = document.getElementById(imgId);
		//
		//load a svg snippet in the canvas
		svg && canvg(canvas, svg.outerHTML);
		//
		var imgSrc = canvas.toDataURL("image/png");
		//将canvas转成图片
		img.src = imgSrc;
		return imgSrc;
	};

	//
	function bindEvents() {
		//
		var $export_image = $("#btn_export_image");
		var $savedimg_anchor = $("#savedimg_anchor");
		var $popup_saveimage_area = $("#popup_saveimage_area");
		var $btn_close_popup = $("#btn_close_popup");
		var $savefile = $("#savefile"); // 用来
		//
		$export_image.click(function() {
			//
			var imgSrc = saveSVGToPNG("savedimg") ;
			var fileName = "产品特效图_" + new Date().getTime();
			//
			$popup_saveimage_area.removeClass("hide");
			//
			$savedimg_anchor.attr("href", imgSrc);
			$savedimg_anchor.attr("download", "" + fileName + ".png");
			
		});
		$btn_close_popup.click(function(){
			//
			$popup_saveimage_area.addClass("hide");
		});
	};

	//
	function loadJsTree() {
		//
		var config_core_data = {
			'url' : function(node) {
				// 指定 AJAX_JSON的地址
				return default_config.orginfo_json_url;
			},
			'data' : function(node) {
				return {
					'id' : node.orgid// 转换,      自定义ID, node.orgid
					,
					'text' : node.name	// 转换
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
		// 绑定选择事件
		$orginfo_tree.on('changed.jstree', function(e, data) {
			var i, j, r = [];
			for ( i = 0, j = data.selected.length; i < j; i++) {
				r.push(data.instance.get_node(data.selected[i]).text);
			}
			$current_org_name.text(r.join(', ')); // 先这样吧
		})
		//
		try{
			$orginfo_tree.jstree(config);
		} catch(ex){
			alert("请部署到Web服务器中访问"); // 捕获不到,杯具
		}

	};

	// 初始化页面JS调用
	function pageInit() {
		// 加载 Raphael
		loadRaphael();
		// 加载 Tree
		loadJsTree();
		// 绑定各种自定义事件
		bindEvents();
	};
	//window.onload = pageInit;
	$(pageInit);

})();
