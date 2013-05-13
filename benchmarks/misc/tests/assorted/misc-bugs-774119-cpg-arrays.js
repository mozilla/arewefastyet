function testLength(arr) {
  var count = 1000;
  var x = 0;
  for (var i = 0; i < count * arr.length; ++i)
    x += arr.length;
  return x;
}

function testElementSet(arr) {
  var count = 1000;
  var length = arr.length;
  var x = 0;
  for (var i = 0; i < count; ++i)
    for (var j = 0; j < length; ++j)
      arr[j] = j;
}

function testElementGet(arr) {
  var count = 1000;
  var length = arr.length;
  var x = 0;
  for (var i = 0; i < count; ++i)
    for (var j = 0; j < length; ++j)
      x = arr[j];
  return x;
}

var compartment = newGlobal('new-compartment');

var typed = new compartment.Uint32Array(1000);
otherLength = testLength(typed);
otherTypedSet = testElementSet(typed);
otherTypedGet = testElementGet(typed);

var dense = new compartment.Array(10);
otherDenseLength = testLength(dense);
otherDenseSet = testElementSet(dense);
otherDenseGet = testElementGet(dense);
