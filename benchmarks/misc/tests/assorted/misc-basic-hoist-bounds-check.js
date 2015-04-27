var num = 10000, max = 2000;
var str = new Array(num).join(',');

function countCommas(str) {
  var commas = 0;
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) === 44 /* ',' */)
      commas++;
  }
  return commas;
}

with ({ res: 0 }) {
  for (var i = 0; i < max; i++)
    res += countCommas(str);
  assertEq(res, (num - 1) * max);
};
