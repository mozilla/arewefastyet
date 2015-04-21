var count = 1000000;
var holder;
var start = performance.now();
for (var i = 0; i < count; ++i)
    holder = performance;
var end = performance.now();
postMessage(end - start);
