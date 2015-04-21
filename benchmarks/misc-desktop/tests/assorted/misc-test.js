function test() {
   return document.getElementById("test");
}


// Optional. Call this if you want to ignore the time it took to set up the test.
startMeasuring();

for (var i=0; i<100000; i++) {
    test();
}

// Required. Notifies the measuring is done.
stopMeasuring();

// Alternately, instead of using startMeasuring/stopMeasuring, you can
// call record() and pass it the time, in milliseconds, that your test
// took.
