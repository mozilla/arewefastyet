var max_p = 5;
var max_n = 2000;
Array.prototype.fill = function fill(x) {
  for (var i = 0; i < this.length; i++)
    this[i] = x;
  return this;
}
function assertEq(result, expected) {
  if (result !== expected)
    throw "Assertion: Expected " + expected + ", got " + result;
}

function cnp_iter(n, p) {
  p += 1;
  var arr = (new Array(p)).fill(0);
  arr[0] = 1;
  for (var ni = 0; ni < n; ni++) {
    var last = 0;
    for (var pi = 0; pi < p; pi++) {
      var tmp = last;
      last = arr[pi];
      arr[pi] = last + tmp;
    }
  }

  return arr[p - 1];
}

function fact(low, max) {
  var p = 1;
  for (; low <= max; low++)
    p *= low;
  return p;
}

function cnp_ref(n, p) {
  return Math.round( fact(n - p + 1, n) / fact(1, p) );
}

for (var n = max_p; n < max_n; n++) {
  for (var p = 0; p < max_p; p++) {
    assertEq(cnp_iter(n, p), cnp_ref(n, p));
  }
}
