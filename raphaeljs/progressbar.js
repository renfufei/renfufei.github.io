/*!
 * ProgressBar 0.1.0 - Raphael plugin
 * 进度条
 * Powered by www.renfufei.com
 */
(function(Raphael) {
	//
	var fi = 1.6180339887; 
	// 函数
	Raphael.progressbar = function(param) {
		// 初始默认值
		// 采用继承机制
		param = param || {};
		param = _extends(param, {
			raphael : null,		// 画布
			value : 1,
			minvalue : 1,
			maxvalue : 20,
			fixsize : {top : 0 , left : 0},
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
			vertical : 1,// 是否垂直方向
			color : "#6fdeee",
			backrect : null, // 背景rect
			cursors : null, // 可拖动的小块, 集合
			frontrect : null, // 前景rect, 在这个 rect 内部拖动
			onchange : function(value) {}// 回调函数, 值改变时触发
		});
		//
		return new ProgressBar(param);
	};
	// 构造函数
	function ProgressBar(param) {
		//
		this._extends(param);
		//
		this.init();
		//
		if(!this.vertical){
			// 处理水平
			this.processHorizontal();
		} else {
			// 处理垂直
			this.processVertical();
		}
		// 触发change完成事件
		this.onchange && this.onchange(this.val());
	};
	
	// 初始化操作
	ProgressBar.prototype.init = function (){
		// 处理初始值
		this.val(this.value);
		//
		var raphael = this.getRaphael();
	};
	
	// 水平
	ProgressBar.prototype.processVertical = function (){
		// 用在匿名函数内
		var that = this;
		//
		drawRect(that);
		drawCursor(that);
		//
		var csize31 = this.csize/3;
		var csize32 = 2 * this.csize/3;
		this.minx = Math.round(this.x - csize31);
		this.maxx = Math.round(this.x + this.size - csize32);
		
		this.miny = Math.round(this.y - csize32);
		this.maxy = Math.round(this.y + this.size - csize32);
		// 设置颜色
		this.setColor(this.color);

	};
		//
		function drawRect(that){
			var h = that.size2;
			//
			var bx = that.x;
			var by = that.y;
			
			var bw = that.size;
			var bh = that.size2;
			if(that.vertical){
				bw = that.size2;
			    bh = that.size;
			}
			//
			that.backrect = that.raphael.rect(bx, by, bw, bh).attr({
				stroke : "#fff",
				fill : "180-#fff-#000",
				"stroke-width" : that.linewidth
			});
			//
			that.frontrect = that.backrect.clone().attr({
				stroke : "#000",
				fill : "#000",
				opacity : 0,
				"stroke-width" : that.linewidth
			});
	
			var style = that.frontrect.node.style;
			style.unselectable = "on";
			style.MozUserSelect = "none";
			style.WebkitUserSelect = "none";
			//
			// 拖动事件
			that.frontrect.drag(function(dx, dy, _x, _y) {
				that.docOnMove(dx, dy, _x, _y);
			}, function(_x, _y) {
				that.bOnTheMove = true;
				var dd = _x - that.x;
				if(that.vertical){
					dd = _y - that.y;
				}
				that.setB(dd);
			}, function() {
				that.bOnTheMove = false;
			});
		}
		//
		function drawCursor(that){
			//
			// 修正 value
			var v = that.size * (that.value / (that.maxvalue - that.minvalue));
			
			var cx = that.x - that.padding;
			var cy = that.y - that.padding;
			var cw = that.size2/2;
			var ch = that.size2 + 2* that.padding;
			
			if(that.vertical){
				cy = cy + v;
				var cw = that.size2 + 2* that.padding;
				var ch = that.size2/2;
			} else {
				cx = cx + v;
			}
			
			
			// 可拖动的小块
			that.cursors = that.raphael.set();
			that.cursors.push(
				that.raphael.rect(cx, cy, cw, ch, that.radius)
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
	
	
	//
	ProgressBar.prototype.getRaphael = function (){
		// 先不处理
		if(!this.raphael){
			//
			if(this.element){
				this.raphael = Raphael(this.element, this.paperwidth, this.paperheight);
			} else {
				this.raphael = Raphael(this.x, this.y, this.paperwidth, this.paperheight);
			}
		}
		return this.raphael;
	};
	// 水平
	ProgressBar.prototype.processHorizontal = function (){
		// 先不处理
		this.processVertical();
	};
	// 移动处理
	ProgressBar.prototype.docOnMove = function(dx, dy, _x, _y) {
		if (this.bOnTheMove) {
			//
			var dd = _x - this.x;
			if(this.vertical){
				dd = _y - this.y;
			}
			//
			this.setB(dd);
		}
	};
	// 设置 Bar条
	ProgressBar.prototype.setB = function(_dd) {
		// 修正
		_dd = _dd - (this.vertical ? this.fixsize.top : this.fixsize.left);
		// 回调
		var ratio = this.getRatio(_dd);//// 比例
		var v = this.minvalue + Math.round( (this.maxvalue - this.minvalue) * ratio);
		//
		var dd = _dd - this.size2/2;
		//
		// 判断超出边界
		var attrdd = {};
		if(this.vertical){
			dd < this.miny && ( dd = this.miny);
			dd > this.maxy && ( dd = this.maxy);
			attrdd = {y : dd };
		} else {
			dd < this.minx && ( dd = this.minx);
			dd > this.maxx && ( dd = this.maxx);
			attrdd = {x : dd };
		}
		// 移动进度条的显示位置
		this.cursors.attr(attrdd);
		this.val(v);
		this.onchange && this.onchange(this.val());
	};
	ProgressBar.prototype.getRatio = function(_dd) {
		if(!this.vertical){
			_dd < this.minx && ( _dd = this.minx);
			_dd > this.maxx && ( _dd = this.maxx);
			// 回调
			var ratio = (_dd - this.minx) / (this.maxx - this.minx); // 比例
		} else {
			_dd < this.miny && ( _dd = this.miny);
			_dd > this.maxy && ( _dd = this.maxy);
			// 回调
			var ratio = (_dd - this.miny) / (this.maxy - this.miny); // 比例
		}
		//
		return ratio;
	};
	// 获取/设置颜色
	ProgressBar.prototype.setColor = function(_color) {
		//
		this.backrect.attr({
			fill : _color
		});
		//
		return this;
	};
	ProgressBar.prototype.refreshCursor = function() {
		//
		// 修正 value
		var v = this.size * (this.value / (this.maxvalue - this.minvalue));
		
		var cx = Math.round(this.x - this.csize*4/3);
		//var cy = this.y - this.padding;
		var cy = Math.round(this.y - this.csize*4/3);
		//
		
		// 判断
		var attrdd = {};
		if(this.vertical){
			cy = cy + v;
			attrdd = {y : cy };
		} else {
			cx = cx + v;
			attrdd = {x : cx };
		}
		// 移动进度条的显示位置
		this.cursors && this.cursors.attr(attrdd);
		//
	}
	// 获取/设置 value 值
	ProgressBar.prototype.val = function(value) {
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
		this.onchange && this.onchange(value);
		return this;
	};
	//
	ProgressBar.prototype._extends = _extends;
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
