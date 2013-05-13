
function fill_array(len) {
    var a = Array(len);
    for (var i = 0; i < 500; i++) {
	for (var j = 0; j < len; j++)
	    a[j] = 0;
    }
    return a;
}

function use_array(a) {
    for (var i = 0; i < 500; i++) {
	var x = 0;
	for (var j = 0; j < a.length; j++)
	    x += a[j];
    }
}

var a = fill_array(100000);
use_array(a);
