var origPostMessage = window.postMessage;
window.postMessage = function(arg) {
    origPostMessage.call(window, arg, "*");
}
window.onmessage = function(e) {
    recordMeasurement(e.data);
}
document.write('<script src="getprop-performance-getter-helper.js"></' + 'script>');
