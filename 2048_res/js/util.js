//附带不用修改浏览器安全配置的javascript代码，兼容ie， firefox全系列

function getPath(obj) {
	if (obj) {

		if (window.navigator.userAgent.indexOf("MSIE") >= 1) {
			obj.select();

			return document.selection.createRange().text;
		}

		else if (window.navigator.userAgent.indexOf("Firefox") >= 1) {
			if (obj.files) {

				return obj.files.item(0).getAsDataURL();
			}
			return obj.value;
		}
		return obj.value;
	}
}
// 参数obj为input file对象

function ajaxUtil(url, inParm, fn, isCrossDommain) {
	if (isCrossDommain) {
		jQuery.ajax({
			type : 'GET',
			url : url,
			async : false,
			dataType : 'jsonp',
			jsonp : 'jsonpcallback',
			data : inParm,
			success : function(json) {
				fn(json);
			},
			error : function() {
				alert("网络异常，请重试！", "");
			}
		});
	} else {
		jQuery.ajax({
			type : "POST",
			url : url,
			data : inParm,
			success : function(outParm) {
				fn(outParm);
			},
			error : function() {
				alert("网络异常，请重试！", "");
			}
		});
	}
}
function strSubNew(str, length) {
	var str_r = /[^\x00-\xff]/g;
	var size = 0;
	if (str.match(str_r) == null) {
		size = 0;
	} else {
		size = str.match(str_r).length;
	}
	if ((size + str.length) > length) {
		var tempstr = "";
		var bj = 0;
		for (var i = 0; i < str.length - 1; i++) {
			// /[^\x00-\x80]/g
			if (/[^\x00-\xff]/g.test(str.substring(i, i + 1))) {
				bj += 2;
			} else {
				bj++;
			}
			tempstr += str.substring(i, i + 1);
			if (bj >= length) {
				tempstr += "...";
				return tempstr;
				break;
			}
		}
	}
	return str;
}

//全屏背景自适应
function backImgAuto(imgObj) {
    var b = imgObj.parent();
        var width = window.inneeWidth
        var height = window.innerHeight;
        b.css({
            height : height + "px"
        });
        width = parseInt(b.css('width'));
        var imgw = parseInt(imgObj.css('width'));
        var imgh = parseInt(imgObj.css('height'));
        // 调整图片宽高
        if (width / imgw * imgh > height) {
            imgh = width / imgw * imgh;
            imgw = width;
            imgObj.css({
                width : imgw + "px",
                height : imgh + "px",
                left : "0px",
                top : (imgh - height) / 2 * -1 + "px"
            });
        } else {
            imgw = height / imgh * imgw;
            imgh = height;
            imgObj.css({
                width : imgw + "px",
                height : imgh + "px",
                top : "0px",
                left : (imgw - width) / 2 * -1 + "px"
            });
        }
}