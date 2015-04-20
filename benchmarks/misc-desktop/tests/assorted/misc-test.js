function test() {
   return document.getElementById("test");
}
for (var i=0; i<100000; i++) {
    test();
}
