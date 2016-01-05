// |jit-test| test-also-noasmjs
/* -*- Mode: javascript; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 ; js-indent-level : 2 ; js-curly-indent-offset: 0 -*- */
/* vim: set ts=4 et sw=4 tw=80: */

// Author: Peter Jensen

// In polyfill version, uncomment these two lines and remove "use asm"
// SIMD = {};
// load('./ecmascript_simd.js');

if (typeof SIMD === 'undefined') {
    quit(0);
}

var assertEq = assertEq || function(a, b) { if (a !== b) throw new Error("assertion error: obtained " + a + ", expected " + b); };

const NUM_BIRDS = 100;
const NUM_UPDATES = 200;
const ACCEL_DATA_STEPS = 10000;

var buffer = new ArrayBuffer(0x200000);
var bufferF32 = new Float32Array(buffer);

var actualBirds = 0;

function init() {
    actualBirds = 0;
    // Make it a power of two, for quick modulo wrapping.
    var accelDataValues = [10.0, 9.5, 9.0, 8.0, 7.0, 6.0, 5.5, 5.0, 5.0, 5.0, 5.5, 6.0, 7.0, 8.0, 9.0, 10.0];
    accelDataValues = accelDataValues.map(function(v) { return 50*v; });
    var accelDataValuesLength = accelDataValues.length;
    assertEq(accelDataValuesLength, 16); // Hard coded in the asm.js module
    for (i = 0; i < accelDataValuesLength; i++)
        bufferF32[i + NUM_BIRDS * 2] = accelDataValues[i];
}

function addBird(pos, vel) {
    bufferF32[actualBirds] = pos;
    bufferF32[actualBirds + NUM_BIRDS] = vel;
    actualBirds++;
    return actualBirds - 1;
}

function getActualBirds() {
    return actualBirds;
}

function moduleCode(global, imp, buffer) {
    "use asm";
    var toF = global.Math.fround;
    var u8 = new global.Uint8Array(buffer);
    var f32 = new global.Float32Array(buffer);

    // Keep these 3 constants in sync with NUM_BIRDS
    const maxBirds = 100;
    const maxBirdsx4 = 400;
    const maxBirdsx8 = 800;

    const accelMask = 0x3c;
    const mk4 = 0x000ffff0;

    const getMaxPos = 1000.0;
    const getAccelDataSteps = imp.accelDataSteps | 0;
    var getActualBirds = imp.getActualBirds;

    var i4 = global.SIMD.Int32x4;
    var f4 = global.SIMD.Float32x4;
    var b4 = global.SIMD.Bool32x4;
    var i4add = i4.add;
    var i4and = i4.and;
    var f4select = f4.select;
    var f4add = f4.add;
    var f4sub = f4.sub;
    var f4mul = f4.mul;
    var f4greaterThan = f4.greaterThan;
    var f4splat = f4.splat;
    var f4load = f4.load;
    var f4store = f4.store;
    var b4any = b4.anyTrue;

    const zerox4 = f4(0.0,0.0,0.0,0.0);

    function declareHeapSize() {
        f32[0x0007ffff] = toF(0.0);
    }

    function update(timeDelta) {
        timeDelta = toF(timeDelta);
        //      var steps               = Math.ceil(timeDelta/accelData.interval);
        var steps = 0;
        var subTimeDelta = toF(0.0);
        var actualBirds = 0;
        var maxPos = toF(0.0);
        var maxPosx4 = f4(0.0,0.0,0.0,0.0);
        var subTimeDeltax4  = f4(0.0,0.0,0.0,0.0);
        var subTimeDeltaSquaredx4 = f4(0.0,0.0,0.0,0.0);
        var point5x4 = f4(0.5, 0.5, 0.5, 0.5);
        var i = 0;
        var len = 0;
        var accelIndex = 0;
        var newPosx4 = f4(0.0,0.0,0.0,0.0);
        var newVelx4 = f4(0.0,0.0,0.0,0.0);
        var accel = toF(0.0);
        var accelx4 = f4(0.0,0.0,0.0,0.0);
        var a = 0;
        var posDeltax4 = f4(0.0,0.0,0.0,0.0);
        var cmpx4 = b4(0,0,0,0);
        var newVelTruex4 = f4(0.0,0.0,0.0,0.0);

        steps = getAccelDataSteps | 0;
        subTimeDelta = toF(toF(timeDelta / toF(steps | 0)) / toF(1000.0));
        actualBirds = getActualBirds() | 0;
        maxPos = toF(+getMaxPos);
        maxPosx4 = f4splat(maxPos);
        subTimeDeltax4 = f4splat(subTimeDelta);
        subTimeDeltaSquaredx4 = f4mul(subTimeDeltax4, subTimeDeltax4);

        len = ((actualBirds + 3) >> 2) << 4;

        for (i = 0; (i | 0) < (len | 0); i = (i + 16) | 0) {
            accelIndex = 0;
            newPosx4 = f4load(u8, i & mk4);
            newVelx4 = f4load(u8, (i & mk4) + maxBirdsx4);
            for (a = 0; (a | 0) < (steps | 0); a = (a + 1) | 0) {
                accel = toF(f32[(accelIndex & accelMask) + maxBirdsx8 >> 2]);
                accelx4 = f4splat(accel);
                accelIndex = (accelIndex + 4) | 0;
                posDeltax4 = f4mul(point5x4, f4mul(accelx4, subTimeDeltaSquaredx4));
                posDeltax4 = f4add(posDeltax4, f4mul(newVelx4, subTimeDeltax4));
                newPosx4 = f4add(newPosx4, posDeltax4);
                newVelx4 = f4add(newVelx4, f4mul(accelx4, subTimeDeltax4));
                cmpx4 = f4greaterThan(newPosx4, maxPosx4);

                if (b4any(cmpx4)) {
                    // Work around unimplemented 'neg' operation, using 0 - x.
                    newVelTruex4 = f4sub(zerox4, newVelx4);
                    newVelx4 = f4select(cmpx4, newVelTruex4, newVelx4);
                }
            }
            f4store(u8, i & mk4, newPosx4);
            f4store(u8, (i & mk4) + maxBirdsx4, newVelx4);
        }
    }

    return update;
}

var ffi = {
    getActualBirds: getActualBirds,
    accelDataSteps: ACCEL_DATA_STEPS
};

var fbirds = moduleCode(this, ffi, buffer);

init();
for (var i = 0; i < NUM_BIRDS; i++) {
    addBird(1000.0, 0);
}

for (var j = 0; j < NUM_UPDATES; j++) {
    fbirds(16);
}

assertEq(bufferF32[0], 999.9998168945312, "0th value should be 999.9998168945312");
assertEq(bufferF32[1], 999.9998168945312, "1th value should be 999.9998168945312");
assertEq(bufferF32[2], 999.9998168945312, "2th value should be 999.9998168945312");
assertEq(bufferF32[3], 999.9998168945312, "3th value should be 999.9998168945312");
assertEq(bufferF32[4], 999.9998168945312, "4th value should be 999.9998168945312");
assertEq(bufferF32[5], 999.9998168945312, "5th value should be 999.9998168945312");
assertEq(bufferF32[6], 999.9998168945312, "6th value should be 999.9998168945312");
assertEq(bufferF32[7], 999.9998168945312, "7th value should be 999.9998168945312");
assertEq(bufferF32[8], 999.9998168945312, "8th value should be 999.9998168945312");
assertEq(bufferF32[9], 999.9998168945312, "9th value should be 999.9998168945312");
assertEq(bufferF32[10], 999.9998168945312, "10th value should be 999.9998168945312");
assertEq(bufferF32[11], 999.9998168945312, "11th value should be 999.9998168945312");
assertEq(bufferF32[12], 999.9998168945312, "12th value should be 999.9998168945312");
assertEq(bufferF32[13], 999.9998168945312, "13th value should be 999.9998168945312");
assertEq(bufferF32[14], 999.9998168945312, "14th value should be 999.9998168945312");
assertEq(bufferF32[15], 999.9998168945312, "15th value should be 999.9998168945312");
assertEq(bufferF32[16], 999.9998168945312, "16th value should be 999.9998168945312");
assertEq(bufferF32[17], 999.9998168945312, "17th value should be 999.9998168945312");
assertEq(bufferF32[18], 999.9998168945312, "18th value should be 999.9998168945312");
assertEq(bufferF32[19], 999.9998168945312, "19th value should be 999.9998168945312");
assertEq(bufferF32[20], 999.9998168945312, "20th value should be 999.9998168945312");
assertEq(bufferF32[21], 999.9998168945312, "21th value should be 999.9998168945312");
assertEq(bufferF32[22], 999.9998168945312, "22th value should be 999.9998168945312");
assertEq(bufferF32[23], 999.9998168945312, "23th value should be 999.9998168945312");
assertEq(bufferF32[24], 999.9998168945312, "24th value should be 999.9998168945312");
assertEq(bufferF32[25], 999.9998168945312, "25th value should be 999.9998168945312");
assertEq(bufferF32[26], 999.9998168945312, "26th value should be 999.9998168945312");
assertEq(bufferF32[27], 999.9998168945312, "27th value should be 999.9998168945312");
assertEq(bufferF32[28], 999.9998168945312, "28th value should be 999.9998168945312");
assertEq(bufferF32[29], 999.9998168945312, "29th value should be 999.9998168945312");
assertEq(bufferF32[30], 999.9998168945312, "30th value should be 999.9998168945312");
assertEq(bufferF32[31], 999.9998168945312, "31th value should be 999.9998168945312");
assertEq(bufferF32[32], 999.9998168945312, "32th value should be 999.9998168945312");
assertEq(bufferF32[33], 999.9998168945312, "33th value should be 999.9998168945312");
assertEq(bufferF32[34], 999.9998168945312, "34th value should be 999.9998168945312");
assertEq(bufferF32[35], 999.9998168945312, "35th value should be 999.9998168945312");
assertEq(bufferF32[36], 999.9998168945312, "36th value should be 999.9998168945312");
assertEq(bufferF32[37], 999.9998168945312, "37th value should be 999.9998168945312");
assertEq(bufferF32[38], 999.9998168945312, "38th value should be 999.9998168945312");
assertEq(bufferF32[39], 999.9998168945312, "39th value should be 999.9998168945312");
assertEq(bufferF32[40], 999.9998168945312, "40th value should be 999.9998168945312");
assertEq(bufferF32[41], 999.9998168945312, "41th value should be 999.9998168945312");
assertEq(bufferF32[42], 999.9998168945312, "42th value should be 999.9998168945312");
assertEq(bufferF32[43], 999.9998168945312, "43th value should be 999.9998168945312");
assertEq(bufferF32[44], 999.9998168945312, "44th value should be 999.9998168945312");
assertEq(bufferF32[45], 999.9998168945312, "45th value should be 999.9998168945312");
assertEq(bufferF32[46], 999.9998168945312, "46th value should be 999.9998168945312");
assertEq(bufferF32[47], 999.9998168945312, "47th value should be 999.9998168945312");
assertEq(bufferF32[48], 999.9998168945312, "48th value should be 999.9998168945312");
assertEq(bufferF32[49], 999.9998168945312, "49th value should be 999.9998168945312");
assertEq(bufferF32[50], 999.9998168945312, "50th value should be 999.9998168945312");
assertEq(bufferF32[51], 999.9998168945312, "51th value should be 999.9998168945312");
assertEq(bufferF32[52], 999.9998168945312, "52th value should be 999.9998168945312");
assertEq(bufferF32[53], 999.9998168945312, "53th value should be 999.9998168945312");
assertEq(bufferF32[54], 999.9998168945312, "54th value should be 999.9998168945312");
assertEq(bufferF32[55], 999.9998168945312, "55th value should be 999.9998168945312");
assertEq(bufferF32[56], 999.9998168945312, "56th value should be 999.9998168945312");
assertEq(bufferF32[57], 999.9998168945312, "57th value should be 999.9998168945312");
assertEq(bufferF32[58], 999.9998168945312, "58th value should be 999.9998168945312");
assertEq(bufferF32[59], 999.9998168945312, "59th value should be 999.9998168945312");
assertEq(bufferF32[60], 999.9998168945312, "60th value should be 999.9998168945312");
assertEq(bufferF32[61], 999.9998168945312, "61th value should be 999.9998168945312");
assertEq(bufferF32[62], 999.9998168945312, "62th value should be 999.9998168945312");
assertEq(bufferF32[63], 999.9998168945312, "63th value should be 999.9998168945312");
assertEq(bufferF32[64], 999.9998168945312, "64th value should be 999.9998168945312");
assertEq(bufferF32[65], 999.9998168945312, "65th value should be 999.9998168945312");
assertEq(bufferF32[66], 999.9998168945312, "66th value should be 999.9998168945312");
assertEq(bufferF32[67], 999.9998168945312, "67th value should be 999.9998168945312");
assertEq(bufferF32[68], 999.9998168945312, "68th value should be 999.9998168945312");
assertEq(bufferF32[69], 999.9998168945312, "69th value should be 999.9998168945312");
assertEq(bufferF32[70], 999.9998168945312, "70th value should be 999.9998168945312");
assertEq(bufferF32[71], 999.9998168945312, "71th value should be 999.9998168945312");
assertEq(bufferF32[72], 999.9998168945312, "72th value should be 999.9998168945312");
assertEq(bufferF32[73], 999.9998168945312, "73th value should be 999.9998168945312");
assertEq(bufferF32[74], 999.9998168945312, "74th value should be 999.9998168945312");
assertEq(bufferF32[75], 999.9998168945312, "75th value should be 999.9998168945312");
assertEq(bufferF32[76], 999.9998168945312, "76th value should be 999.9998168945312");
assertEq(bufferF32[77], 999.9998168945312, "77th value should be 999.9998168945312");
assertEq(bufferF32[78], 999.9998168945312, "78th value should be 999.9998168945312");
assertEq(bufferF32[79], 999.9998168945312, "79th value should be 999.9998168945312");
assertEq(bufferF32[80], 999.9998168945312, "80th value should be 999.9998168945312");
assertEq(bufferF32[81], 999.9998168945312, "81th value should be 999.9998168945312");
assertEq(bufferF32[82], 999.9998168945312, "82th value should be 999.9998168945312");
assertEq(bufferF32[83], 999.9998168945312, "83th value should be 999.9998168945312");
assertEq(bufferF32[84], 999.9998168945312, "84th value should be 999.9998168945312");
assertEq(bufferF32[85], 999.9998168945312, "85th value should be 999.9998168945312");
assertEq(bufferF32[86], 999.9998168945312, "86th value should be 999.9998168945312");
assertEq(bufferF32[87], 999.9998168945312, "87th value should be 999.9998168945312");
assertEq(bufferF32[88], 999.9998168945312, "88th value should be 999.9998168945312");
assertEq(bufferF32[89], 999.9998168945312, "89th value should be 999.9998168945312");
assertEq(bufferF32[90], 999.9998168945312, "90th value should be 999.9998168945312");
assertEq(bufferF32[91], 999.9998168945312, "91th value should be 999.9998168945312");
assertEq(bufferF32[92], 999.9998168945312, "92th value should be 999.9998168945312");
assertEq(bufferF32[93], 999.9998168945312, "93th value should be 999.9998168945312");
assertEq(bufferF32[94], 999.9998168945312, "94th value should be 999.9998168945312");
assertEq(bufferF32[95], 999.9998168945312, "95th value should be 999.9998168945312");
assertEq(bufferF32[96], 999.9998168945312, "96th value should be 999.9998168945312");
assertEq(bufferF32[97], 999.9998168945312, "97th value should be 999.9998168945312");
assertEq(bufferF32[98], 999.9998168945312, "98th value should be 999.9998168945312");
assertEq(bufferF32[99], 999.9998168945312, "99th value should be 999.9998168945312");

function generateAssertList() {
  function template(i, x) {
    return 'assertEq(bufferF32[' + i + '], ' + x + ', "' + i + 'th value should be ' + x + '");\n';
  }
  var buf = ''
  for (var i = 0; i < NUM_BIRDS; i++)
      buf += template(i, bufferF32[i]);
  print(buf);
}
//generateAssertList();
