Math.fround = Math.fround || function(x){return x;};

var SIZE = 1000000;
var REPEAT = 100;
var f32 = new Float32Array(SIZE);

function expf(x) {
    x = Math.fround(x);
    var e = Math.fround(x / 120);
    e = Math.fround(e + Math.fround(0.04167)); // 1/24
    e = Math.fround(e * x);
    e = Math.fround(e + Math.fround(0.16667)); // 1/6
    e = Math.fround(e * x);
    e = Math.fround(e + .5);           // 1/2
    e = Math.fround(e * x);
    e = Math.fround(e + 1);            // 1
    e = Math.fround(e * x);
    e = Math.fround(e + 1);
    return e;
}

function compute() {
    for(var i = 0; i < SIZE; ++i)
        f32[i] = (i % 100) / 100.;

    for(var i = 0, s = SIZE; i < s; ++i) {
        f32[i] = expf(f32[i]);
    }
}

function runBenchmark() {
    for (var n = REPEAT; n; --n) {
        compute();
    }
}
runBenchmark();
