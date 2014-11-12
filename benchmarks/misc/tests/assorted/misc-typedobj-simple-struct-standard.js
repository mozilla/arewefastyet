// Paired with misc-typedobj-simple-struct-typedobj.js

function do_test() {
    var arr1 = new Array(100000);
    var arr2 = new Array(100000);
    for (var i = 0; i < arr1.length; i++) {
        arr1[i] = {a:1,b:2};
        arr2[i] = {a:2,b:1};
    }

    for (var i = 0; i < 100; i++) {
        for (var j = 0; j < arr1.length; j++) {
            var a = arr1[j].a;
            var b = arr1[j].b;
            arr1[j].a = arr2[j].b;
            arr1[j].b = arr2[j].a;
            arr2[j].a = a;
            arr2[j].b = b;
        }
    }
}
do_test();
