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
			left_paper : 0,
			data : [], // 各个数据
			weight : 1,  // 总权值
			barSet : null,
			textSet : null,
			opacityCSet : null,
			cursorSet : null,
			currentDataChange : 0,
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
			frontrect : null, // 前景rect, 在这个 rect 内部拖动
			initcallchange : false, //是否触发初始回调
			onchange : function(value) {}// 回调函数, 值改变时触发
		});
		//
		return new SizeBar(param);
	};
	// 构造函数
	function SizeBar(param) {
		//
		this._extends(param);
		//
		this.init();
		// 处理显示
		this.processRender();
		// 触发change完成事件
		this.initcallchange && this.onchange && this.onchange(this.data);
	};
	//
	SizeBar.prototype._extends = _extends;
	// 初始化操作
	SizeBar.prototype.init = function (){
		// 处理初始值
		this.setData(this.data);
	};
	
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
			// 矩形条
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
			var radio = Math.round((value / weight) * 100); // 这个还有点问题,加起来不到100
			var text = info + " " + radio.toFixed(0) + "%";
			//
			var textEl = paper.text(tx, ty, text);
			that.textSet.push(textEl);
			// 
			var tstyle = textEl.node.style;
			tstyle.unselectable = "on";
			tstyle.MozUserSelect = "none";
			tstyle.WebkitUserSelect = "none";
			//
			// 累加
			dw += rw;
		}
		//
		that.textSet.attr({"text-anchor": "middle"}); // 改变集合内所有   fill 特性
		
		// 画顶层矩形
		that.frontrect = paper.rect(bx, by, bw, bh);
		that.frontrect.attr({
			stroke : "#fff"
			,fill : "#6fdeee" //"180-#fff-#000",// 设置颜色
			,"stroke-width" : that.linewidth
			, opacity : 0 // 透明
		});
		//
		//that.frontrect.toFront();
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
		that.opacityCSet = paper.set(); //
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
				stroke : "#222"
				, fill : color
				, opacity : 0.1
				, r : 3
				, "stroke-width" : 1
			});
			cursor._id = id;
			that.cursorSet.push(cursor);
			//
			//
			var cc = cursor.clone().attr({ // 透明滑块,用来拖加拖动事件
                stroke : "#888",
                opacity: 1,
                "stroke-width": 1
        	});
			cc._id = id;
        	// 加到 
			that.opacityCSet.push(cc);
			// 使用闭包绑定事件
			bindCCEvent(that, cc);
			
		} // end for
		
	};
	
	// 移动处理
	// {dx: 从按下拖动时到此时的x值改变; dy: y改变; _x: }
	SizeBar.prototype.ccOnMove = function(cc, dx, dy, _x, _y) {
		if (this.ccOnMoving) {
			//
			var nx = _x -  this.x - this.left_paper/2 + this.height;
			
			// 判断超出边界
			if(nx < this.x){
				nx = this.x;
			}
			var maxX = this.x + this.width;
			if(nx > maxX){
				nx = maxX;
			}
			// TODO 边界还需要处理前后范围
			//
			this.setCursor(cc, nx);
			// 边动边改
			this.processDataChange(cc, dx, nx); 
		
		} else {
			//
		}
	};
	
	//
	SizeBar.prototype.processDataChange = function(cc, dx, nx) {
		// cc, cursor, rect, text, data
		//
		var change = (dx/this.width) * this.weight;
		change = Math.round(change);
		if(change == 0){
			//return;
		}
		// 移除上次的影响
		change = change - this.currentDataChange;
		if(change == 0){
			return;
		}
		//
		var id = cc._id;
		var barSet = this.barSet;
		var targetBar = searchById(barSet, id, "_id");
		var targetBarIndex = searchIndexById(barSet, id, "_id");
		
		// 左边的
		var prevBar = barSet[targetBarIndex-1];
		
		//
		var targetData = searchById(this.data, id, "id");
		var targetDataIndex = searchIndexById(this.data, id, "id");
		var prevData = this.data[targetDataIndex-1];
		
		//
		prevData && (prevData.value = prevData.value + change);
		targetData && (targetData.value = targetData.value - change);
		
		//
		this.currentDataChange += change;
		this.onchange && this.onchange(this.data);
	};
	
	
	// 设置 Bar条 的位置
	SizeBar.prototype.setCursor = function(cc, nx) {
		// 移动进度条的显示位置
		cc.attr({
			x : nx
		});
		//
		var id = cc._id;
		var cursor = searchById(this.cursorSet, id , "_id");
		cursor && cursor.attr({ x : nx});
	};
	
	//
	function bindCCEvent(that, cc){
		// 事件
		cc.drag(function(dx, dy, _x, _y,e) {
			// onmove
			that.ccOnMove(cc, dx, dy, _x, _y);
			return stopEvent(e);
		}, function(e_x, e_y, e) { //onstart
			that.ccOnMoving = true;
			that.currentDataChange = 0;
			//
			return stopEvent(e);
		}, function(e) { // onend
			that.ccOnMoving = false;
			// 放开以后,刷新
			return stopEvent(e);
		});
	};
	//
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
	
	// 根据ID取得set中的值
	function searchById(set, id, idKey){
		var result = _searchElementAndIndexById(set, id, idKey);
		return result.element;
	};
	function searchIndexById(set, id, idKey){
		var result = _searchElementAndIndexById(set, id, idKey);
		return result.index;
	};
	function _searchElementAndIndexById(set, id, idKey){
		//
		var result = {
				index : -1,
				element : null
		};
		if(!set || !id){
			return result;
		}
		if(!idKey){
			idKey = "id";
		}
		//
		for(var i=0; i< set.length; i++){
			var el = set[i];
			var _id = el[idKey];
			if(_id == id){
				result.index = i;
				result.element = el;
				break;
			}
		}
		//
		return result;
	};

})(window.Raphael);
