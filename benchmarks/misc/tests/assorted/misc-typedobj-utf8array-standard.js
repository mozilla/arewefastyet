// Paired with misc-typedobj-utf8array-standard.js

function do_test() {
  // Hand tweaked to get something around 1 seconds on my laptop.
  var len = 192 * 10 * 1024;
  var jsArray_in = new Array();
  var jsArray_out = new Array();
  for(var i = 0; i < len; i++) {
    jsArray_in[i] = 1;
  }
  var sum = 0;
  for(k = 0; k < 15; k++) {
    for(i = 0; i < len; i++) {
      jsArray_out[i] = jsArray_in[i];
    }
  }
}
do_test();

