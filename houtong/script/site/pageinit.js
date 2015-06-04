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
		height_dept : 110,
		padding_dept : 12,
		radius_dept : 10,
		margin_parent : 45, // 间距
		margin_partner : 28,
		exp_radius : 8, // 展开按钮的半径大小
		downposition : null,
		prevposition : null,
		offset : {x: 0, y:0},
		//
		direction : 0, //拓扑方向. 0为从左到右, 1为从上到下
		zoom_num : 10, // 缩放倍数,小数. 数字越小则距离屏幕前的你越近,显示越大
		expand_level : 2, // 展开级别,展开全部,则设置为100即可
		expand_all : 0,	  // 展开所有
		show_mgr_title : 1, // 显示部门经理title
		show_mgr_name : 1, // 显示部门经理 name
		mgr_src : "./image/m_36.png",
		emp_src : "./image/e_36.png",
		mgr_emp_size : 18,
		min_paper_width : 800,
		min_paper_height : 600,
		left_paper : 100, // 最左上角的 paper
		top_paper : 50,
		line_color : "#3333ff", // 连线的颜色
		prevNodePositionInfo : {
			//展开某个节点时的位置信息
			enable : false
			, bbox : null
			, prevoffset : null
		}, 
		//
		orginfo_json_url : 'api/orginfo.json'
	};
	//
	var global = {
		svg : null
		,paper : null
		, pbar : null
		, config : __config
		, currentCacheDept : null
	};
	window.global = global;
	// 部门节点的属性模板
	var defaultDeptNode = {
			width : global.config.width_dept, // 宽
			height : global.config.height_dept, //高
			expand: 0,	// 是否强制展开, 记录在tree中比较合理
			hideNodeCount : 0, // 隐藏元素数量
			spanX  : 0, // 占用宽
			spanY : 0,  // 占用高
			x : 0,
			y : 0,
			expand_status : 0, // 1 是展开,显示 - 号，强制显示子节点; 0 是默认不确定， 2是收缩显示加号
			expand_level : 0,
			treenode : null  // 树节点
	};

	//
	// 根据node节点，绘制整棵树
	function drawDeptTree(paper, root){
		//
		if(!paper || !root){
			return null;
		}
		//
		var expand_level = global.config.expand_level;
		
		// 1. 遍历,计算整体大小,调用另一个递归方法来计算
		var tree_with_size = calcTreeSize(root, expand_level);
		
		// 2. 预定义大小,计算出结果
		var tree_with_xy = calcXY(tree_with_size, 0, 0, expand_level);
		
		// 3. 开始绘制
		fitPaperSize(paper, tree_with_xy, expand_level);
		var tree = drawTree(paper, tree_with_xy, expand_level);
		// 
		// refreshPaperZoom();
		
		// 校正位置
		moveRootToCenter(paper, tree_with_xy);
		
		// 3.1 校正点击加号展开时自身位置不改变的问题
		fixExpandNodePosition(paper, tree_with_xy);
		
		// 4. 绑定事件
		
		// 5. 绘制复选框等其他按钮
		//
		return tree;
	};
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
	// 校正位置
	function moveRootToCenter(paper, tree_with_xy){
		//
		var dxdy = calcDxDy(tree_with_xy);
		//
		dx = dxdy.dx;
		dy = dxdy.dy;
		//
		if(global.config.direction){
			//global.config.offset.y = dy;
		} else {
			//global.config.offset.x = dx;
		}
			global.config.offset.y = dy;
			global.config.offset.x = dx;
		//
		refreshPaperZoom();
		 
	};
	// 清空缓存的这个值.
	function clearExpandNodePosition(){
		if(global.config.prevNodePositionInfo){
			global.config.prevNodePositionInfo.enable = false; // 不启用
			global.config.prevNodePositionInfo.bbox = null; // 置空
			global.config.prevNodePositionInfo.prevoffset = null; // 置空
			global.config.prevNodePositionInfo.prevnode = null;
		}
	};
	// 设置展开节点的信息保存
	function setExpandNodePosition(rect){
		if(!rect){
			return;
		}
		clearExpandNodePosition();
		//
		var node = rect.datanode;
		var bbox = rect.getBBox();
		
		//
		var paper = global.paper;
		//
		//
		var config = global.config;
		//
		var prevRootXY = getPrevRootXY();
		var dxdy = calcDxDy(prevRootXY);
		// 克隆
		var offset = {
			x : config.offset.x
			, y : config.offset.y
		};
		//
		var prevNodePositionInfo = {
				enable : true // 启用
				,bbox : bbox  // 设值
				, prevoffset : offset	// 之前的offset
				, dxdy : dxdy
				, prevnode : node
			};
		//
		global.config.prevNodePositionInfo = prevNodePositionInfo;
	};
	function calcDxDy(tree_with_xy){
		//
		var rx = tree_with_xy.x;
		var ry = tree_with_xy.y;
		//
		var startX = startX || global.config.left_paper;
		var startY = startY || global.config.top_paper;
		//
		var spanX = tree_with_xy.spanX;
		var spanY = tree_with_xy.spanY;
		//
		var pW = global.config.min_paper_width;
		var pH = global.config.min_paper_height;
		//
		var dx =  rx - pW/2 + startX;
		var dy =  ry - pH/2 + startY;
		
		//
		// 在计算中心点偏移量时,就根据 direction 固定偏移少的那一边的x,y偏移
		if(global.config.direction){ // 根据方向决定
			dx = 0; // 强制不使用计算值
		} else {
			dy = 0;
		}
		//
		var dxdy = {
			dx: dx
			,dy: dy
		};
		return dxdy;
	};
	// 根据 root 获取相对偏移,修正
	function fixExpandNodePosition(paper, tree_with_xy){
		// 
		var config = global.config;
		var prevNodePositionInfo = config.prevNodePositionInfo;
		if(!prevNodePositionInfo || !prevNodePositionInfo.enable){
			savePrevRootXY(tree_with_xy);
			return; // 没有相应的信息,则不往下执行.
		}
		//
		var prevoffset = prevNodePositionInfo.prevoffset;
		var dxdy = prevNodePositionInfo.dxdy;
		
		//
		var _dx = dxdy.dx;
		var _dy = dxdy.dy;
		//
		var _ox = prevoffset.x;
		var _oy = prevoffset.y;
		// 取得点击加号以前的拖动偏移量
		var _x = _ox - _dx;
		var _y = _oy - _dy;
		
		config.offset.y += _y;
		config.offset.x += _x; 
		//
		config.prevNodePositionInfo = null;
		savePrevRootXY(tree_with_xy);
		refreshPaperZoom();
		
		return;
		
	};
	function getPrevRootXY(){
		return global.config.prevRootXY;
	};
	function savePrevRootXY(prevRoot){
		if(!prevRoot){
			return;
		}
		global.config.prevRootXY = prevRoot;
	};
	
	// 根据node节点，获取 shape. 这是绘制单个节点
	function drawDept(paper, node){
		//
		if(!node){
			return null;
		}
		//
		var w = node.width || global.config.width_dept;
		var h = node.height || global.config.height_dept;
		var r = global.config.radius_dept;
		var pad = global.config.padding_dept;
		var direction = global.config.direction;
		
		//
		var x_s = node.x || global.config.left_paper;
		var y_s = node.y || global.config.top_paper;
		var x_e = x_s + w;
		var y_e = y_s + h;
		
		// 1. 绘制矩形框
		var rect = paper.rect(x_s, y_s, w, h, r);
		//
		rect.dblclick(dbclickHandler);
		rect.datanode = node;
		
		// expand_level
		// expand_status
		// 1.1 绘制下方的展开状态图标
		// 没有子节点的情况
		var expand_status = node.expand_status;
		//
		var exp_circle = null;
		
		// 上下左右.
		var pDown = {
			x : x_s + w/2 +1,
			y : y_e + 8
		};
		var pRight = {
			x : x_e +  8,
			y : y_s + h / 2 
		};
		//
		if(0 == direction){// 判断横竖
			var exp_x = pDown.x;
			var exp_y = pDown.y;
		} else {
			var exp_x = pRight.x;
			var exp_y = pRight.y;
		}
		//exp_radius
		var exp_radius = global.config.exp_radius;
		var charExp = "";
		if(1 == expand_status){
			// 展开状态, -号
			charExp = "-";
		} else if(2 == expand_status){
			// 收缩状态, +号
			var charExp = "+";
		}
		//
		if(1 == expand_status || 2 == expand_status){
			// 绘制展开状态/收缩状态, +号
			var exp_circle = paper.circle(exp_x, exp_y, exp_radius);
			var exp_char = paper.text(exp_x, exp_y, charExp);
			//
			exp_circle.attr({
				"stroke-width": 2
			});
			exp_char.attr({
				"font-size": 18
			});
			unselect(exp_char);
		} else {
			// 不绘制. 0
		}
		//
		exp_circle && exp_circle.attr({
			fill : "#eee"
			,stroke : "#00e"
			,cursor : "pointer"
		});
		exp_char && exp_char.attr({
			stroke : "#00e"
			,cursor : "pointer"
		});
		// 绑定展开事件
		function exp_handler(e, data){
			// treenode
			var to_expand_status = 0;
			if(1 == expand_status){
				 // 变成关闭
				 to_expand_status = 2;
			} else {
				 to_expand_status = 1;
			}
			//
			setExpandNodePosition(rect);
			// 改变状态,刷新
			node.treenode &&( node.treenode.to_expand_status = to_expand_status);
			refreshDeptTree();
		}
		//
		exp_circle && exp_circle.click(exp_handler);
		exp_char && exp_char.click(exp_handler);
		
		
		var color = Raphael.getColor();
		rect.attr({
			fill : color,
			stroke : color,
			"fill-opacity" : 0.3,
			"stroke-width" : 2
		});
		// 设置字体
		var font = paper.getFont("Times", 800); //Times
		// 2. 绘制部门信息
		var text = node.text;
		var tx = x_s + pad;
		var ty = y_s + pad;
		if(text.length > 8){
			text = text.substr(0,8) + "\n" + text.substr(8);
			ty += pad;
		}
		var nameText = paper.text(tx, ty, text);
		//var nameText = paper.print(x_s + w/2, y_s + pad, text, font, 30);
		
		nameText.dblclick(dbclickHandler);
		nameText.datanode = node;
		nameText.attr({
			"font-family": "microsoft yahei",
			"font-weight": "bold",
			"text-anchor": "start",
			"font-size" : 16,
			cursor : "default"
		});
		unselect(nameText);
		
		// 3. 绘制部门经理
		//
		var show_mgr_title = global.config.show_mgr_title;
		var show_mgr_name = global.config.show_mgr_name;
		
		var original = node.original || {};
		//
		var linkman = original.linkman;
		var linktitle = original.linktitle;
		//
		var linkinfo = "";
		if(show_mgr_title && linktitle){
			linkinfo += linktitle ;
		}
		if(show_mgr_title && show_mgr_name && linktitle && linkman){
			linkinfo += "（" ;
		}
		if(show_mgr_name && linkman){
			linkinfo += linkman; 
		}
		if(show_mgr_title && show_mgr_name && linktitle && linkman){
			linkinfo += "）" ;
		}
		//
		var linkx = x_s + w/2;
		var linky = y_s + h/2 + pad/2;
		// 如果缩放比例太小,则不显示
		//
		if(global.config.zoom_num > 6){
			
			var linkText = paper.text(linkx, linky , linkinfo);
			linkText.dblclick(dbclickHandler);
			linkText.datanode = node;
			linkText.attr({
				"font-family":"microsoft yahei"
				, "font-size" : 14
				, "text-anchor" : "middle"
			});
			unselect(linkText);
		}
		
		// 4. 职位图标 
		var msrc = global.config.mgr_src;
		var mw = global.config.mgr_emp_size;
		var mh = global.config.mgr_emp_size;
		var mx = x_s + pad;
		var my = y_e - pad/2 - mh;
		var manEle = paper.image(msrc, mx, my, mw, mh);
		iconcursor(manEle);
		//
		var fsize= 14;
		var mnx = mx + pad + mw;
		var mny = my +  fsize - pad/2;
		var manText = paper.text(mnx, mny , "1").attr({
			"font-family":"microsoft yahei"
			, "font-size" : fsize
			, "text-anchor" : "middle"
			, "font-weight": "bold"
			, "color" : "white"
		});
		unselect(manText);
		//
		// 可能后期用来做模板
		var $tipDivTempMgr = $("#tip_holder_template_mgr");
		var $tipDivTempEmp = $("#tip_holder_template_emp");
		//
		var $tipMgr = null;
		var $tipEmp = null;
		//
		function cloneDiv($temp){
			var current = new Date().getTime();
			//
			var $tipDiv = $temp.clone();
			$tipDiv.attr("id", "tip_"+current);
			$tipDiv.addClass("transient");
			// 关闭事件
			var $close = $tipDiv.find(".close");
			//
			$close.click(function(){
				//$tipDiv.addClass("hide");
				//$tipDiv.remove();
				//$tipDiv = null;
				if($tipMgr){
					// 移除同一个作用域内的,即同一个部门的弹出窗
					$tipMgr.remove();
					$tipMgr = null;
				} ;
				if($tipEmp){
					// 移除同一个作用域内的,即同一个部门的弹出窗
					$tipEmp.remove();
					$tipEmp = null;
				}
				
			});
			//
			return $tipDiv;
		};
		
		//
		var needRemove = 0;
		var manTipsClick = function(x,y,z){
			//
			z = z + 10;
			y = y + 2;
			//
			if($tipMgr){
				//
				$tipMgr.remove();
				$tipMgr = null;
			} ;
			if($tipEmp){
				//
				$tipEmp.remove();
				$tipEmp = null;
			} else {
				$tipEmp = cloneDiv($tipDivTempEmp);
				//
				// 需要修改坐标
				$tipEmp.css({top : z +"px", left : y +"px"});
				$tipEmp.appendTo(document.body);
				$tipEmp.removeClass("hide");
			}
			//
		};
		manEle.click(manTipsClick);
		
		// 职员图标
		var iconPc = getIconPC();
		
		var esrc = global.config.emp_src;
		var ew = mw;
		var eh = mh;
		var ex = x_e - 2*pad - ew;
		var ey = my -2;
		var pcEle = paper.image(esrc, ex, ey, ew, eh);
		iconcursor(pcEle);
		
		//
		var fsize= 14;
		var enx = ex + pad/2 + ew;
		var eny = mny;
		var pcText = paper.text(enx, eny , "2").attr({
			"font-family":"microsoft yahei"
			, "font-size" : fsize
			, "text-anchor" : "middle"
			, "font-weight": "bold"
			, "color" : "white"
		});
		unselect(pcText);
		//
		var pcTipsClick = function(x,y,z){
			//
			z = z + 25;
			y = y - 35;
			//
			if($tipEmp){
				//
				$tipEmp.remove();
				$tipEmp = null;
			}; 
			if($tipMgr){
				//
				$tipMgr.remove();
				$tipMgr = null;
			} else {
				$tipMgr = cloneDiv($tipDivTempMgr);
				//
				// 需要修改坐标
				$tipMgr.css({top : z +"px", left : y +"px"});
				$tipMgr.appendTo(document.body);
				$tipMgr.removeClass("hide");
			}
		};
		pcEle.click(pcTipsClick);
		// 绘制展开/收缩按钮
		
		//
		node.rect = rect;
		node.nameText = nameText;
		//
		return node;
	};
	
	// 计算树的大小,完全包装为新对象
	function calcTreeSize(root, expand_level){
		if(!root){
			return null;
		}
		// 每次都是新对象
		var defNode = $.extend({} ,defaultDeptNode);
		// 克隆对象
		var tree_with_size = $.extend(defNode, root);
		//
		
		// treenode
		//
		tree_with_size.treenode = root; // 缓存tree对象
		tree_with_size.expand_level = expand_level;// 存储展开级别
		
		//
		// 遍历直接子节点,引用
		var children = root.children;
		//
		var tree = currentTree();
		//
		var subnodes = [];
		for (var i = 0; i < children.length;  i++) {
			var jsnode = tree.get_node(children[i]);
			//
			// 迭代遍历, 如果还有子元素,则遍历子元素
			// 没有,则不会进入循环
			var snode = calcTreeSize(jsnode, expand_level-1);
			//
			var to_expand = getExpandStatus(root);
			if(2 == to_expand){ // 必须先判断收缩状态
				// 不展开
				tree_with_size.expand_status = 2;// 1 是展开,显示 - 号，强制显示子节点; 0 是默认不确定， 2是收缩显示加号
				tree_with_size.hideNodeCount += 1;
			} else if(1 == to_expand || expand_level > 1){
				// 记录下子节点是否展开
				tree_with_size.expand_status = 1; // 1 是展开,显示 - 号，强制显示子节点; 0 是默认不确定， 2是收缩显示加号
				//
				subnodes.push(snode);
				snode.pnode = root;
			} else {
				tree_with_size.expand_status = 2;// 1 是展开,显示 - 号，强制显示子节点; 0 是默认不确定， 2是收缩显示加号
				tree_with_size.hideNodeCount += 1;
			}
		}
		//
		var subNodesSize = subnodes.length;
		var direction = global.config.direction;
		var marginp = global.config.margin_parent;
		var margins = global.config.margin_partner;
		//
		var spanX = 0;
		var spanY = 0;
		// 计算占用宽高
		for (var i = 0; i < subNodesSize;  i++) {
			var snode = subnodes[i];
			//
			spanX += snode.spanX;
			spanY += snode.spanY;
			//
			// 判断方向,计算与子节点的跨度
			if(0 == direction){
				spanY += marginp;
			} else {
				spanX += marginp;
			}
			//
			if(0 == i){
				continue;
			}
			// 判断方向,计算子节点之间的跨度
			if(0 == direction){
				spanX += margins;
			} else {
				spanY += margins;
			}
		}
		// 修正没有子节点的情况
		if(subNodesSize < 1){
			//
			spanX = tree_with_size.width;
			spanY = tree_with_size.height;
			
		}
		
		// 
		tree_with_size.jsnode = root;
		tree_with_size.subnodes = subnodes;
		tree_with_size.spanX = spanX;
		tree_with_size.spanY = spanY;
		//
		return tree_with_size;
	};
	function calcXY(tree_with_size, startX, startY, expand_level){
		if(!tree_with_size){
			return null;
		}
		//
		startX = startX || global.config.left_paper;
		startY = startY || global.config.top_paper;
		//
		var direction = global.config.direction;
		var defw = tree_with_size.width || global.config.width_dept;
		var defh = tree_with_size.height || global.config.height_dept;
		var marginp = global.config.margin_parent;
		var margins = global.config.margin_partner;
		
		//
		var sx = startX;
		var sy = startY;
		//
		if(direction){
			sx += defw + marginp;
		} else {
			sy += defh + marginp ;
		}
		// 迭代遍历, 如果还有子元素,则遍历子元素
		var subnodes = tree_with_size.subnodes;
		for (var i = 0; i < subnodes.length;  i++) {
			var node = subnodes[i];
			// 先计算节点, 再加下一个节点的值
			calcXY(node, sx, sy);
			// 修补
			// 算法要改变. 根据前一个元素累加, 因为不规则子树
			var spanX_sub = node.spanX;
			var spanY_sub = node.spanY;
			if(direction){
				sy += (spanY_sub + margins);
			} else {
				sx += (spanX_sub + margins);
			}
		}
		//
		// 设置自身的
		tree_with_size.x = startX;
		tree_with_size.y = startY;
		//
		var spanX = tree_with_size.spanX;
		var spanY = tree_with_size.spanY;
		// 根据跨度修正
		if(0 == direction){
			tree_with_size.x += spanX/2;
		} else {
			tree_with_size.y += spanY/2;
		}
		
		//
		return tree_with_size;
	};
	function drawTree(paper, tree_with_xy, expand_level){
		//
		//
		var curnode = drawDept(paper, tree_with_xy);
		//
		// 遍历,挨个绘制
		var subnodes = tree_with_xy.subnodes;
		for (var i = 0; i < subnodes.length;  i++) {
			var node = subnodes[i];
			// 迭代遍历, 如果还有子元素,则遍历子元素
			drawTree(paper, node);
		}
		//
		// 设置连线
		drawDeptConnectLine(paper, tree_with_xy);
		//
		return tree_with_xy;
	};
	//
	function drawDeptConnectLine(paper, pnode){
		//
		var config = global.config;
		
		var subnodes = pnode.subnodes;
		for (var i = 0; i < subnodes.length;  i++) {
			var snode = subnodes[i];
			// 迭代遍历, 如果还有子元素,则遍历子元素
			paper.connectDept(pnode.rect, snode.rect, config, config.line_color)
		}
	};
	
	//
	function dbclickHandler(e, x, y){
		//
		var datanode = this.datanode || {};
		var jsnode = datanode.jsnode;
		//
		var tree = getorginfo_tree().jstree();
		//
		var children = jsnode.children;
		
		//
		var pnode = datanode.pnode;
		if(pnode){
			//
			if(children && children.length){
				// 尝试显示自身为 root
				showDeptImage(jsnode);
				return;
			}
		}
		//
		var parent = tree.get_node(jsnode.parent);
		var subnodes = datanode.subnodes;
		if(subnodes && subnodes.length){
			//有子元素,则返回上一级
			if(parent && parent.text){
				//showDeptImage(parent);
				//return;
			}
		}
		//
		
	};
	
	
	// 该节点的子节点是否展开
	function getExpandStatus(node){
		//
		var result = 0;
		// 展开状态
		if(!node){
			result = 0; // 错误情况
		} else if(node.treenode && node.treenode.to_expand_status){
			result = node.treenode.to_expand_status; //记忆中的关闭
		} else if(node.to_expand_status){ // 1,2
			result = node.to_expand_status; //记忆中的关闭
		} else if(global.config.expand_all){
			result = 1; // 全局展开
		} else if(2 == node.expand_status){
			result = node.expand_status; // 这个没用
		} else if(node.treenode){ // 记忆中的展开
			result = node.treenode.to_expand_status || 0;
		}
		//
		return result;
	};
	// 展开所有节点状态
	function expandAllNodeStatus(checked){
		// 
		global.config.expand_level = checked ? 100 : 2;
		global.config.expand_all = checked ? 1 : 0;
		//
		if(!checked){
			// 选中,那就没什么事了
			return;
		}
		// 否则:
		// 去除所有节点的记忆状态
		var root = currentCacheDept();
		clear_to_expand_status(root);
		//
	};
	//
	function clear_to_expand_status(node){
		//
		if(!node){
			return;
		}
		if(node.treenode){
			node.treenode.to_expand_status = 0;
		}
		if(node.to_expand_status){
			node.to_expand_status = 0;
		}
		// 循环子节点
		var children = node.children;
		if(!children){
			return;
		}
		//
		for(var i=0; i< children.length; i++){
			clear_to_expand_status(children[i]);
		}
	};
	
	
	// 显示部门信息
	function showDeptImage(node){
		//
		if(!node){
			return;
		}
		var paper = global.paper;
		currentCacheDept(node);
		//
		// 清空旧有的元素
		paper.clear();
		
		//
		// 6. 重置一些值
    	global.config.prevposition=null;
    	global.config.downposition=null;
    	global.config.offset = {x: 0, y:0};
    	//
		//
		// 这是设置基础形状,需要进行封装
		//var shape = drawDept(paper, node);
		drawDeptTree(paper, node);
		//
		loadRaphaelProgressBar();
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
		var node = currentCacheDept();
		showDeptImage(node);
		
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
	
    // 创建进度条
	function loadRaphaelProgressBar() {
		//
        var holder1 = document.getElementById("holder1");
        //
        var $holder1 = $("#holder1");
        var pos = $holder1.offset();
        var config = {
            	x : 10
            	, y : 30
            	, value : 10
            	, vertical : 1
            	, color : "#6fdeee"
            	, element : holder1
            	, fixsize : pos
            	, onchange : function(value){
					global.config.zoom_num = value;
					refreshPaperZoom();
          		}
        };
        var pbar = Raphael.progressbar(config);
        global.pbar = pbar;
	};

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
		var $btn_deptshow = $("#btn_deptshow");
		var $btn_save_showconfig = $("#btn_save_showconfig");
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
		$checkbox_expand_all.click(function() {
			//
			var checked = $checkbox_expand_all.attr('checked') || $checkbox_expand_all.prop("checked");
			//
			expandAllNodeStatus(checked);
			// 刷新部门树 ...
			refreshDeptTree();
		});
		//
		$btn_direction_toggle.click(function() {
			//
			var direction = global.config.direction;
			var text_btn = direction ?  "纵向显示" : "横向显示";
			if(0 === direction){
				global.config.direction = 1;
			} else {
				global.config.direction = 0;
			}
			//
			$btn_direction_toggle.text(text_btn);
			// 刷新部门树 ...
			refreshDeptTree();
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
        $btn_deptshow.click(function (e) {
        	//
            var showmgrtitle = global.config.show_mgr_title ? true: false;
            var showmgrname = global.config.show_mgr_name ? true: false;
            
            $showconfig = $("#showconfig_area");
            //
        	var pos = $(this).offset();
            //
            var _left = pos.left + 15;
            var _top = pos.top + 40;
            //
            $showconfig.css({
            	"top" : _top + "px",
            	"left": _left + "px"
            });
            $showconfig.removeClass("hide");
            
            // 设置值
            var $showmgrtitle = $("#showmgrtitle");
            var $showmgrname = $("#showmgrname");
            //
            if($showmgrtitle.prop){
            	$showmgrtitle.prop("checked", showmgrtitle);
            } else {
            	$showmgrtitle.attr("checked", showmgrtitle);
            }
            if($showmgrname.prop){
            	$showmgrname.prop("checked", showmgrname);
            } else {
            	$showmgrname.attr("checked", showmgrname);
            }
            //
        });
        $btn_save_showconfig.click(function (e) {
            // TODO
            $showconfig = $("#showconfig_area");
            //
            var $showmgrtitle = $("#showmgrtitle");
            var $showmgrname = $("#showmgrname");
            //
            var showmgrtitle = $showmgrtitle.prop("checked") || $showmgrtitle.attr("checked");
            var showmgrname = $showmgrname.prop("checked") || $showmgrname.attr("checked");
            //
            if(showmgrtitle){
	            global.config.show_mgr_title=1;
            } else {
	            global.config.show_mgr_title=0;
            }
            if(showmgrname){
	            global.config.show_mgr_name=1;
            } else {
	            global.config.show_mgr_name=0;
            }
            //
            $showconfig.addClass("hide");
			// 刷新部门树 ...
			refreshDeptTree();
        });
		
		// 闭包内的函数
		function hidePopUp(){
			$popup_saveimage_area.addClass("hide");
		};
		//
		function processZoom(zoomUp){
			//
			var zoomNum = global.config.zoom_num;
			//
			if(zoomUp){
				// 放大
				zoomNum --; // 这是相反的
			} else {
				zoomNum ++; // 这是相反的
			}
			//
			if(zoomNum < 3){
				zoomNum = 3;
			} else if(zoomNum > 25){
				zoomNum = 25;
			}
			//
			if(global.pbar && global.pbar.val){
				global.pbar.val(zoomNum);
			} else {
				//
				global.config.zoom_num = zoomNum;
				refreshPaperZoom();
			}
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
	        /**  CTRL + ??? 的情况  */
	        if(e.ctrlKey){
	        	// 监听鼠标滚轮.  CTRL + Up/Down 作为快捷键
		        if (which === WHICH_UP) {
		           // Ctrl + Up
		           processZoom(1);
		           return stopEvent(e);
		        } else if (which === WHICH_DOWN) {
		           // Ctrl + Down
		           processZoom(0);
		           return stopEvent(e);
		        }
	        }
	    });
	    
	    // 只监听 holder. 是否应该监听 svg元素? 先不管
	    var $svg = $(global.svg);
	    // 监听2个位置,依靠阻止事件传播
	    global.svg && $svg.bind('mousewheel', mouseWheelHandler);
	    $holder.bind('mousewheel', mouseWheelHandler);
        //
	    // 监听鼠标滚轮.  CTRL + Up/Down 作为快捷键
        function mouseWheelHandler(event, delta, deltaX, deltaY) {
        	// 
        	if(event.ctrlKey){
        		return; // Ctrl 键则取消
        	}
        	// 是否向上滚动
        	var zoomUp = delta > 0 ? 1 : 0;
        	
        	processZoom(zoomUp);
        	//
            return stopEvent(event);
        };
        
        // 全局
        $(document).mouseup(function(e){ // 放开鼠标
        	global.config.prevposition=null;
        	global.config.downposition=null;
        }); 
        $holder.mousedown(function(e){ // 按下鼠标
        	//
        	var screenX = e.screenX;
        	var screenY = e.screenY;
        	//
        	var downposition = {
        		screenX : screenX
        		,screenY: screenY
        	};
        	//
        	global.config.downposition=( downposition);
        }).mouseup(function(e){ // 放开鼠标
        	global.config.prevposition=null;
        	global.config.downposition=null;
        }).mouseout(function(e){ // 鼠标离开
        	//global.config.downposition=null;
        }).mouseleave(function(e){ // 鼠标离开
        	//global.config.downposition=null;
        }).mousemove(function(e){ // 鼠标移动
        	//
        	var screenX = e.screenX;
        	var screenY = e.screenY;
        	//
        	var current = {
        		screenX : screenX
        		,screenY: screenY
        	};
        	//
        	var prevposition = global.config.prevposition;
        	var downposition = global.config.downposition;
        	if(!downposition){
        		return;
        	}
        	if(!prevposition || !prevposition.screenX){
        		prevposition = downposition;
        	}
        	//
        	if(!prevposition || !prevposition.screenX){
        		return; // 没有按下什么,返回
        	}
        	//
    		var pX = prevposition.screenX;
    		var pY = prevposition.screenY;
    		//
    		var deltaX = pX - screenX;
    		var deltaY = pY - screenY;
    		//
    		var min = 5;
    		if(deltaX > min || deltaX < -1*min 
    			|| deltaY > min || deltaY < -1*min){
    			// 移动超过 min 个像素
    			
    			var delta = {
    				deltaX : deltaX
    				, deltaY : deltaY
    			};
    			dragRaphael(delta);
    			//
    			global.config.prevposition=( current);
    		}
        });
        
        //
        function dragRaphael(delta){
        	if(!delta){
        		return;
        	}
			//
			var paper = global.paper;
			var zoomNum = global.config.zoom_num;
			//
			var width = paper.width;
			var height = paper.height;
			//
			var x = global.config.offset.x || 0;
			var y = global.config.offset.y || 0;
			//
			x += delta.deltaX;
			y += delta.deltaY;
			// 判断x, y的合理性
			var times = 0.7;
			//
			if(x < -1*width*times){
				x =  -1*width*times;
			}
			if(x > width*times){
				x =  width*times;
			}
			if(y < -1*height*times){
				y =  -1*height*times;
			}
			if(y > height*times){
				y =  height*times;
			}
			//
			global.config.offset.x = x;
			global.config.offset.y = y;
			var fit = false;
			//
			refreshPaperZoom();
        };
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
		// 绑定选择事件; select_node.jstree
		$orginfo_tree.on('select_node.jstree', function(e, data) {
			//
			var node = data.node;
			//
			var text = node.text;
			$current_org_name.text(text); 
			// 
			showDeptImage(node);
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
				$current_org_name.text(text); 
				// 
				showDeptImage(node);
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


// 扩展 Raphael.fn, 成为插件； 绘制连接线。 
// 定制，专门画组织结构的线
// 可以只传递1个参数,则这个参数就是现成的线条
// (线条)
// (父节点, 子节点, direction, 线条色, 线条内部填充色)
Raphael.fn.connectDept = function(pnode, snode, config, lineORcolor, bgColor) {
	// 方向
	var direction = config.direction || 0 ;
	var marginp = config.margin_parent;
	var margins = config.margin_partner;
	var exp_radius = config.exp_radius;
	// 取得颜色
	var color = typeof lineORcolor == "string" ? lineORcolor : "#000";
	//
	// 如果传入的第一个元素符合 linePath 的特征,则表示是一条线,将相关参数进行变换
	if (pnode.linePath && pnode.from && pnode.to) {
		lineORcolor = pnode;
		pnode = lineORcolor.from;
		snode = lineORcolor.to;
	}
	// 返回该元素的边界框
	var bboxP = pnode.getBBox();
	var bboxS = snode.getBBox();
	//
	// 上下左右.
	var pUp = {
		x : bboxP.x + bboxP.width / 2,
		y : bboxP.y - 1
	};
	var pDown = {
		x : bboxP.x + bboxP.width / 2,
		y : bboxP.y + bboxP.height + 12
	};
	var pLeft = {
		x : bboxP.x - 1,
		y : bboxP.y + bboxP.height / 2
	};
	var pRight = {
		x : bboxP.x + bboxP.width + 12,
		y : bboxP.y + bboxP.height / 2
	};
	//
	var sUp = {
		x : bboxS.x + bboxS.width / 2,
		y : bboxS.y - 1
	};
	var sDown = {
		x : bboxS.x + bboxS.width / 2,
		y : bboxS.y + bboxS.height + 1
	};
	var sLeft = {
		x : bboxS.x - 1,
		y : bboxS.y + bboxS.height / 2
	};
	var sRight = {
		x : bboxS.x + bboxS.width + 1,
		y : bboxS.y + bboxS.height / 2
	}
			 
	//////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////
	//
	// 简单绘制,只需要4个点
	// Number.toFixed(dn); 在数字小数点 后面补dn个0
	if(0 == direction){
		var pStart  = pDown;
		var pStart  = {
			x : pDown.x + 1,
			y : pDown.y + exp_radius/3 + 1
		};
		var pBreak  = {
			x : pStart.x,
			y : pStart.y + marginp/2 - exp_radius
		};
		var sEnd = sUp;
		var sEnd = {
			x: sUp.x + 1,
			y: sUp.y
		};
		var sBreak = {
			x : sEnd.x,
			y : pBreak.y  // y 保持一致
		};
	} else {
		var pStart  = pRight;
		var pStart  = {
			x : pRight.x + + exp_radius/3 + 1,
			y : pRight.y
		};
		var pBreak  = {
			x : pStart.x + marginp/2 - exp_radius,
			y : pStart.y
		};
		var sEnd = sLeft;
		var sBreak = {
			x : pBreak.x , // x 保持一致
			y : sEnd.y
		};
	}
	var path0 = ["M", pStart.x.toFixed(3), pStart.y.toFixed(3),
				"C", pBreak.x.toFixed(3), pBreak.y.toFixed(3),
				sBreak.x.toFixed(3), sBreak.y.toFixed(3),
				sEnd.x.toFixed(3), sEnd.y.toFixed(3),
				].join(",");
	
	 var path = ["M", pStart.x.toFixed(3), pStart.y.toFixed(3),
	 			"L", pBreak.x.toFixed(3), pBreak.y.toFixed(3),
	 			"L", sBreak.x.toFixed(3), sBreak.y.toFixed(3),
	 			"L", sEnd.x.toFixed(3), sEnd.y.toFixed(3),
	 			].join(",");
	
	// 判断,是新绘制,还是使用已有的线条和背景
	if (lineORcolor && lineORcolor.linePath) {
		lineORcolor.bgPath && lineORcolor.bgPath.attr({
			path : path, "stroke-width": 2, "stroke-linecap": "round"
		});
		lineORcolor.linePath.attr({
			path : path, "stroke-width": 2, "stroke-linecap": "round"
		});
	} else {
		return {
			bgPath : bgColor && bgColor.split && this.path(path).attr({
				stroke : bgColor.split("|")[0], // 背景
				fill : "none",
				"stroke-width" : 2 //bgColor.split("|")[1] || 3 // 背景宽度
			}),
			linePath : this.path(path).attr({
				stroke : color,
				fill : "none"
				,"stroke-width": 2, "stroke-linecap": "round"
			}),
			from : pnode,
			to : snode
		};
	}
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

// 文字样式不允许选择
function unselect(element){
	if(!element || !element.node || !element.attr){return element;}
    var style = element.node.style || {};
    style.unselectable = "on";
    style.MozUserSelect =  "none";
    style.WebkitUserSelect= "none";
    //
	element.attr({
		"font-family": "microsoft yahei",
		cursor : "default"
	});
	return element;
};

function iconcursor(element){
	if(!element || !element.attr){return element;}
	element.attr(
		{
			cursor : "pointer"
			, stroke: "none"
		});
	return element;
};

// 图标的path
function getIconPC(){
	var iconPc  = "M28.936,2.099H2.046c-0.506,0-0.919,0.414-0.919,0.92v21.097c0,0.506,0.413,0.919,0.919,0.919h17.062v-0.003h9.828c0.506,0,0.92-0.413,0.92-0.921V3.019C29.854,2.513,29.439,2.099,28.936,2.099zM28.562,20.062c0,0.412-0.338,0.75-0.75,0.75H3.062c-0.413,0-0.75-0.338-0.75-0.75v-16c0-0.413,0.337-0.75,0.75-0.75h24.75c0.412,0,0.75,0.337,0.75,0.75V20.062zM20.518,28.4c-0.033-0.035-0.062-0.055-0.068-0.062l-0.01-0.004l-0.008-0.004c0,0-0.046-0.021-0.119-0.062c-0.108-0.056-0.283-0.144-0.445-0.237c-0.162-0.097-0.32-0.199-0.393-0.271c-0.008-0.014-0.035-0.079-0.058-0.17c-0.083-0.32-0.161-0.95-0.22-1.539h-7.5c-0.023,0.23-0.048,0.467-0.076,0.691c-0.035,0.272-0.073,0.524-0.113,0.716c-0.02,0.096-0.039,0.175-0.059,0.23c-0.009,0.025-0.018,0.05-0.024,0.062c-0.003,0.006-0.005,0.01-0.007,0.013c-0.094,0.096-0.34,0.246-0.553,0.36c-0.107,0.062-0.209,0.11-0.283,0.146c-0.074,0.037-0.119,0.062-0.119,0.062l-0.007,0.004l-0.008,0.004c-0.01,0.009-0.038,0.022-0.07,0.062c-0.031,0.037-0.067,0.103-0.067,0.185c0.002,0.002-0.004,0.037-0.006,0.088c0,0.043,0.007,0.118,0.068,0.185c0.061,0.062,0.143,0.08,0.217,0.08h9.716c0.073,0,0.153-0.021,0.215-0.08c0.062-0.063,0.068-0.142,0.068-0.185c-0.001-0.051-0.008-0.086-0.007-0.088C20.583,28.503,20.548,28.439,20.518,28.4z";
	var iconF = "M28.625,26.75h-26.5V8.375h1.124c1.751,0,0.748-3.125,3-3.125c3.215,0,1.912,0,5.126,0c2.251,0,1.251,3.125,3.001,3.125h14.25V26.75z";
	return iconF;
};
