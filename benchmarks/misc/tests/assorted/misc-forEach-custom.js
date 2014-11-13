
// This is a custom version of forEach which does not escape the lambda.
Array.prototype.forEach = function(callbackfn) {
    var O = this;
    var len = O.length;
    for (var k = 0; k < len; k++) {
      callbackfn(O[k], k, O);
    }

    return undefined;
};

var max_p = 5;

function cnp_iter(n, p) {
  p += 1;
  var arr = (new Array(p)).fill(0);
  arr[0] = 1;
  for (var ni = 0; ni < n; ni++) {
    var last = 0;
    arr.forEach(function (val, index, array) {
      array[index] = last + val;
      last = val;
    });
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

for (var n = max_p; n < 2000; n++) {
  for (var p = 0; p < max_p; p++) {
    assertEq(cnp_iter(n, p), cnp_ref(n, p));
  }
}
