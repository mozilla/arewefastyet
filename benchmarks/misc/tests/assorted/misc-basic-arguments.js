
function count() {
  var res = 0;
  for (var i = 0; i < arguments.length; i++)
    res += arguments[i];
}

function other_count() {
  var res = 0;
  var a = arguments;
  for (var i = 0; i < a.length; i++)
    res += a[i];
}

function foo(fn) {
  for (var i = 0; i < 400000; i++)
    fn(1,2,3,4,5,6,7,8,9,10);
}
foo(count);
foo(other_count);
