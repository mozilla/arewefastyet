// Paired with misc-typedobj-utf8array-typedobj.js

function do_test() {
  // Hand tweaked to get something around 1 seconds on my laptop.
  var len = 192 * 10 * 1024;
  var BDType = TypedObject.uint8.array(len);
  var bdArray_in = new BDType();
  var bdArray_out = new BDType();
  for(var i = 0; i < len; i++) {
    bdArray_in[i] = 1;
  }
  var sum = 0;
  for(var k = 0; k < 15; k++) {
    for(i = 0; i < len; i++) {
      bdArray_out[i] = bdArray_in[i];
    }
  }
}
do_test();

