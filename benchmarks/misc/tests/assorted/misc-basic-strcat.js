
// http://my.opera.com/emoller/blog/2011/05/01/javascript-performance
// bug 659467
function foo() {
  var dest = 'apple';
  while (dest.length < 1000000) {
    var offs = dest.length - 5;
    for (var i = offs; i < offs + 10; ++i)
      dest += dest[i];
  }
}

// only run this test in spidermonkey. V8 and JSC are really bad at this.
if (typeof snarf != "undefined")
  foo();
