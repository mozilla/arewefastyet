var w = new Worker("getprop-performance-getter-helper.js")
w.onmessage = function (e) {
    recordMeasurement(e.data);
}
