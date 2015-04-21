var w = new Worker("getname-performance-getter-helper.js")
w.onmessage = function (e) {
    record(e.data);
}
