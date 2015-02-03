// Paired with misc-typedobj-simple-struct-standard.js

var T = TypedObject;

var Struct = new T.StructType({a: T.int32, b:T.int32});
var ObjectArray = T.Object.array(100000);

function do_test() {
    var arr1 = new ObjectArray();
    var arr2 = new ObjectArray();
    for (var i = 0; i < arr1.length; i++) {
        arr1[i] = new Struct();
        arr1[i].a = 1;
        arr1[i].b = 2;
        arr2[i] = new Struct();
        arr2[i].a = 2;
        arr2[i].b = 1;
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
