/*!
 * SizeBar 0.1.0 - Raphael plugin
 * 拖动条
 * Powered by www.renfufei.com
 */
(function(Raphael) {
	// 需要的参数: paper,x,y,长度,高度； 以及values[各个子段的权值,color];
	Raphael.sizebar = function(param) {
		// 初始默认值
		// 采用继承机制
		param = param || {};
		param = _extends(param, {
			paper : null,		// 画布
			x : 0,
			y : 0,
			width : 400,
			height : 10,
			data : [], // 各个数据
			weight : 1,  // 总权值
			value : 1,
			minvalue : 1,
			maxvalue : 20,
			paperwidth : 400,
			paperheight : 400,
			size : 300,
			size2 : 32,
			csize : 15,
			csize2 : 40,
			padding : 5,
			radius : 3,
			linewidth : 1,
			clinew : 1, //线宽度
			backrect : null, // 背景rect
			cursors : null, // 可拖动的小块, 集合
			frontrect : null, // 前景rect, 在这个 rect 内部拖动
			initcallchange : false, //是否触发初始回调
			onchange : function(value) {}// 回调函数, 值改变时触发
		});
		//
		//
		//
		return new SizeBar(param);
	};
	// 构造函数
	function SizeBar(param) {
		//
		this._extends(param);
		//
		this.init();
		// 处理水平
		this.processRender();
		// 触发change完成事件
		this.initcallchange && this.onchange && this.onchange(this.val());
	};
	
	// 初始化操作
	SizeBar.prototype.init = function (){
		// 处理初始值
		this.val(this.value);
		//
		this.setData(this.data);
		//
		var csize31 = this.csize/3;
		var csize32 = 2 * this.csize/3;
		this.minx = Math.round(this.x - csize31);
		this.maxx = Math.round(this.x + this.size - csize32);
		
		this.miny = Math.round(this.y - csize32);
		this.maxy = Math.round(this.y + this.size - csize32);
	};
	
	//
	// 初始化Data
	SizeBar.prototype.setData = function (data){
		//
		if(!data || !data.length){
			return this;
		}
		// 处理
		this.data = data;
		//
		var weight = 0;
		for(var i=0; i < data.length; i++){
			var d = data[i];
			weight += d.value;
		}
		//
		this.weight = weight;
	};
	
	
	// 渲染
	SizeBar.prototype.processRender = function (){
		// 用在匿名函数内
		var that = this;
		//
		this.drawRect();
		this.drawCursor();
	};
	//
	SizeBar.prototype.drawRect =  function (){
		var that = this;
		var paper = that.paper;
		//
		var bx = that.x;
		var by = that.y;
		
		var bw = that.width;
		var bh = that.height;
		var weight = that.weight;
		
		
		// 画多个矩形
		
		// 遍历 data
		that.barSet = paper.set();
		that.textSet = paper.set();
		var dw = 0;
		//
		//
		var data = that.data || [];
		for(var i=0; i < data.length; i++){
			var d = data[i];
			var value = d.value || 1;
			var color = d.color || Raphael.getColor();
			var info = d.info || "";
			var id = d.id || "";
			//
			var rw = (value / weight) * bw;
			var rh = bh;
			var rx = bx + dw;
			var ry = by;
			//
			var rect = paper.rect(rx, ry, rw, rh);
			rect.attr({
				stroke : color
				, fill : color
				, r : 0
			});
			rect._id = id;
			that.barSet.push(rect);
			
			
			// 文字
			var tx = rx + rw /2;
			var ty = ry - 10;
			var radio = (value / weight) * 100;
			var text = info + " " + radio.toFixed(0) + "%";
			//
			var textEl = paper.text(tx, ty, text);
			that.textSet.push(textEl);
			//
			// 累加
			dw += rw;
		}
		
		//
		that.textSet.attr({"text-anchor": "middle"}); // 改变集合内所有 circle 的 fill 特性
		
		
		// 画顶层矩形
		that.frontrect = paper.rect(bx, by, bw, bh);
		that.frontrect.attr({
			stroke : "#fff"
			,fill : "#6fdeee" //"180-#fff-#000",// 设置颜色
			,"stroke-width" : that.linewidth
			, opacity : 0 // 透明
		});
		//
		that.frontrect.toFront();
	
		var style = that.frontrect.node.style;
		style.unselectable = "on";
		style.MozUserSelect = "none";
		style.WebkitUserSelect = "none";
		
			//
		// 拖动事件
		that.frontrect.drag(function(dx, dy, _x, _y) {
			that.docOnMove(dx, dy, _x, _y);
			return false;
		}, function(_x, _y) {
			that.bOnTheMove = true;
			var dd = _x - that.x;
			that.setB(dd);
			return false;
		}, function() {
			that.bOnTheMove = false;
			return false;
		});
	};
	// 绘制滑块
	SizeBar.prototype.drawCursor =  function (){
		var that = this;
		var paper = that.paper;
		//
		var bh = that.height;
		// 画多个滑块
		
		// 遍历
		that.cursorSet = paper.set();
		//
		var barSet = that.barSet || [];
		for(var i=1; i < barSet.length; i++){ // 从1 开始,0的不画
			var b = barSet[i];
			var color = "#ccc";
			var id = b._id || "";
			//
			var bbox = b.getBBox();
			var bx = bbox.x;
			var by = bbox.y;
			//
			var cw = bh + 4;
			var ch = bh + 4;
			var cx = bx - cw/2;
			var cy = by - 2;
			//
			var cursor = paper.rect(cx, cy, cw, ch);
			cursor.attr({
				stroke : "#666"
				, fill : color
				,opacity : 0.7
				, r : 3
				,"stroke-width" : 1
			});
			cursor._id = id;
			that.cursorSet.push(cursor);
			//
			//
			var cc = cursor.clone().attr({
                stroke: "#fff",
                opacity: 1,
                "stroke-width": 1
           });
           // 加到 
			that.cursorSet.push(cc);
		}
		//
		// 修正 value
		
		
		
		// 可拖动的小块
		that.cursors = that.paper.set();
		that.cursors.push(
			that.paper.rect(cx, cy, cw, ch, that.radius)
				.attr({
					stroke : "#000",
					opacity : .5,
					"stroke-width" : that.linewidth
				})
			);
		that.cursors.push(that.cursors[0].clone().attr({
			stroke : "#80c4ee",
			opacity : 1,
			"stroke-width" : that.clinew
		}));
	};
	
	// 移动处理
	SizeBar.prototype.docOnMove = function(dx, dy, _x, _y) {
		if (this.bOnTheMove) {
			//
			var dd = _x - this.x;
			//
			this.setB(dd);
		}
	};
	// 设置 Bar条
	SizeBar.prototype.setB = function(_dd) {
		// 修正
		// 回调
		var ratio = this.getRatio(_dd);//// 比例
		var v = this.minvalue + Math.round( (this.maxvalue - this.minvalue) * ratio);
		//
		var dd = _dd - this.size2/2;
		//
		// 判断超出边界
		var attrdd = {};
			dd < this.minx && ( dd = this.minx);
			dd > this.maxx && ( dd = this.maxx);
			attrdd = {x : dd };
		
		// 移动进度条的显示位置
		this.cursors.attr(attrdd);
		this.val(v);
		this.onchange && this.onchange(this.val());
	};
	SizeBar.prototype.getRatio = function(_dd) {
		
			_dd < this.miny && ( _dd = this.miny);
			_dd > this.maxy && ( _dd = this.maxy);
			// 回调
			var ratio = (_dd - this.miny) / (this.maxy - this.miny); // 比例
		
		//
		return ratio;
	};
	SizeBar.prototype.refreshCursor = function() {
		//
		// 修正 value
		var v = this.size * (this.value / (this.maxvalue - this.minvalue));
		
		var cx = Math.round(this.x - this.csize*4/3);
		//var cy = this.y - this.padding;
		var cy = Math.round(this.y - this.csize*4/3);
		//
		
		// 判断
		var attrdd = {};
		
			cx = cx + v;
			attrdd = {x : cx };
		
		// 移动进度条的显示位置
		this.cursors && this.cursors.attr(attrdd);
		//
	}
	// 获取/设置 value 值; (value值, quiet安静模式不触发事件)
	SizeBar.prototype.val = function(value, quiet) {
		if (0 === arguments.length) {//
			// 不传入参数, 则get返回当前值
			return this.value;
		}
		// 判断是数字 ....判断最大最小值
		if (value > this.maxvalue) {
			value = this.maxvalue;
		}
		if (value < this.minvalue) {
			value = this.minvalue;
		}
		// set设置
		this.value = value;
		// 处理cursors
		this.refreshCursor();
		//
		if(!quiet){
			this.onchange && this.onchange(value);
		}
		return this;
	};
	
	// 增加 value 值; (value值, quiet安静模式不触发事件)
	SizeBar.prototype.add = function(value, quiet) {
		//
		value = value || 1;
		var v = this.val();
		this.val(v + value);
		return this;
	};
	// 增加 1; (value值, quiet安静模式不触发事件)
	SizeBar.prototype.up = function(value, quiet) {
		//
		return this.add(1,quiet);
	};
	// 减小1; (quiet安静模式不触发事件)
	SizeBar.prototype.down = function(value, quiet) {
		//
		return this.add(-1,quiet);
	};
	//
	SizeBar.prototype._extends = _extends;
	// 继承. 工具方法
	function _extends(obj1, obj2) {
		//
		if (!obj1) {
			return false;
		}
		obj2 = obj2 || this;
		if(obj2 === window){
			obj2 = {};
		}
		for (var name in obj1 ) {
			if(obj1.hasOwnProperty(name)){
				var v = obj1[name];
				obj2[name] = v;
			}
		}
		//
		return obj2;
	};

})(window.Raphael);
