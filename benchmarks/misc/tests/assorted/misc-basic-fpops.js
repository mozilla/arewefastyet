
function test_add(x, y) {
  var z = 0;
  for (var i = 0; i < x; i++)
    z += y;
}

test_add(0x3ffffff, 10.5);

function test_mul(x, y) {
  var z = 10;
  for (var i = 0; i < x; i++)
    z = z * y;
}

test_mul(0x3ffffff, 10.5);
