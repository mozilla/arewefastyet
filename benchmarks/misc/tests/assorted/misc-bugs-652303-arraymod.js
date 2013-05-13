var conf = {
        'create_cnt' : 2000,
        'read_cnt' : 5000000,
        'write_cnt' : 5000000,
        'iterations' : 0,
	//        'order_l1' : [browser],
        'order_l2' : ['normal',
                            'imageData',
                            'arrayBuffer'],
        'order_l3' : ['create',
                            'sequentialRead',
                            'randomRead',
                            'sequentialWrite']
}
var arraySize = 10240;
    
var new_normal = function() {
    var arr = [], i;
    for (i = 0; i < arraySize; i++) {
        arr[i] = 0;
    }
    return arr;
}

var randlist;

function init_randlist() {
    randlist = [];
    for (var i=0; i < arraySize; i++) {
        randlist[i] = parseInt(Math.random() * 256, 10);
    }
}

function copy_randlist(arr) {
    for (var i=0; i < arraySize; i++) {
        arr[i] = randlist[i];
    }
}

function test_randomRead(arr) {
    var i, cnt;
    /* Initialize the array */
    copy_randlist(arr); // used as jumplist

    i = 0;
    for (cnt = 0; cnt < conf.read_cnt; cnt++) {
        i = (arr[i] + cnt) % arraySize;
    }
}

init_randlist();
test_randomRead(new_normal());
