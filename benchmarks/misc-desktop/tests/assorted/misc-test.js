function test() {
   return document.getElementById("test");
}


// Optional. When you don't want to remove the time it took to setup the test.
startMeasuring();

for (var i=0; i<100000; i++) {
    test();
}

// Required. Notifies the measuring is done.
stopMeasuring();
