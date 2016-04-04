function assertEq(result, expected) {
  if (result !== expected)
    throw "Assertion: Expected " + expected + ", got " + result;
}

var loops = 10000;
var entries = 100;

var map = new Map();
for (var i = 0; i < entries; i++)
    map.set(i * 2, i * 3);

function test_keys(m) {
  for (var i = loops; i--;) {
    var j = 0;
    for (var k of m.keys()) {
      assertEq(k, j * 2);
      j++;
    }
  }
}
test_keys(map);

function test_values(m) {
  for (var i = loops; i--;) {
    var j = 0;
    for (var v of m.values()) {
      assertEq(v, j * 3);
      j++;
    }
  }
}
test_values(map);

function test_entries(m) {
  for (var i = loops; i--;) {
    var j = 0;
    for (var e of m.entries()) {
      assertEq(e[0], j * 2);
      assertEq(e[1], j * 3);
      j++;
    }
  }
}
test_entries(map);

function test_iterator(m) {
  for (var i = loops; i--;) {
    var j = 0;
    for (var e of m) {
      assertEq(e[0], j * 2);
      assertEq(e[1], j * 3);
      j++;
    }
  }
}
test_iterator(map);
