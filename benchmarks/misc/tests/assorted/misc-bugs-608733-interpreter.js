/**
 * Instruction set:
 *   00 HALT
 *   01 xx yy        Rxx = Rxx + Ryy
 *   02 xx yy        Rxx = Rxx - Ryy
 *   03 xx yy        Mem[Rxx] = Ryy
 *   04 xx yy        Ryy = Mem[Rxx]
 *   05 xx ii        Rxx = 000000ii
 *   06 xx ii jj     Rxx = 0000jjii
 *   07 ii jj        PC = 0000jjii
 *   08 xx ii        if (Rxx != 0) PC += ii (sign extended)
 *   09 xx           PRINT Rxx
 */

/**
 * Sample code that writes a bunch of values to memory, then reads them back while summing them up.
 * See printReferences below for a more readable JS implementation of this code.
 */
var ROM = [
    0x05, 0x00, 0x00, // R0 = 0
    0x06, 0x01, 0x00, 0x10, // R1 = 0x1000
    0x06, 0x02, 0x00, 0x80, // R2 = 0x8000
    0x05, 0x03, 0x04, // R3 = 4
    0x05, 0x04, 0x01, // R4 = 1
    0x05, 0x05, 0x00, // R5 = 0
    // L1: (20)
    0x03, 0x01, 0x00, // Mem[R1] = R0
    0x01, 0x01, 0x03, // R1 = R1 + R3 (4)
    0x01, 0x05, 0x04, // R5 = R5 + R4 (1)
    0x01, 0x00, 0x05, // R0 = R0 + R5
    0x02, 0x02, 0x04, // R2 = R2 - R4 (1)
    0x08, 0x02, 0xEE, // if (R2 != 0) PC = L1
    0x05, 0x00, 0x00, // R0 = 0
    0x06, 0x01, 0x00, 0x10, // R1 = 0x1000
    0x06, 0x02, 0x00, 0x80, // R2 = 0x02
    // L2: (49)
    0x04, 0x01, 0x05, // R5 = Mem[R1]
    0x01, 0x00, 0x05, // R0 = R0 + R5
    0x01, 0x01, 0x03, // R1 = R1 + R3 (1)
    0x02, 0x02, 0x04, // R2 = R2 - R4 (1)
    0x08, 0x02, 0xF1, // if (R2 != 0) PC = L2
    0x09, 0x00, // PRINT R0
    0x07, 0x03, 0x00, // PC = 0x0003
    0x00 // HALT
];

var memory;
var regs;
var hasTypedArrays = false;
if (this.Uint8Array && this.Int32Array) {
    //XXX: d8 does not support ArrayBuffer
    //var membuf = new ArrayBuffer(256*1024);
    memory = new Uint8Array(256*1024);
    //var regbuf = new ArrayBuffer(256*4);
    regs = new Int32Array(256);
    hasTypedArrays = true;
} else {
    memory = [];
    regs = [];
}

var PC;
var cycleCount;
//var output = document.getElementById("output");
//var references = document.getElementById("references");
var results = [];

for (var i = ROM.length; i < 0x1000; ++i) {
    ROM[i] = 0;
}

function setup() {
    var i;
    for (i = 0; i < ROM.length; ++i) {
        memory[i] = ROM[i];
    }
    for (; i < 0x40000; ++i) { // 256K memory, first 16K are immutable
        memory[i] = 0;
    }

    PC = 0;
    for (i = 0; i < 256; ++i) {
        regs[i] = 0xFFFFFFFF;
    }

    cycleCount = 50000000;

    //output.textContent = "";
    results = [];
}

// ------------- Interpreter -------------
function interpreter() {
    while (1) {
        if (--cycleCount == 0)
            return "INTERRUPT";

        if (PC < 0 || PC >= 0x1000)
            return "ILLEGAL PC";

        // output.textContent += dumpState("TRACE");
        
        var xx, yy;
        switch (ROM[PC]) {
        case 0x00:
            return "HALTED";
        case 0x01: {
            if (PC + 3 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            yy = ROM[PC + 2];
            regs[xx] = (regs[xx] + regs[yy]) & 0xFFFFFFFF;
            PC += 3;
            break;
        }
        case 0x02: {
            if (PC + 3 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            yy = ROM[PC + 2];
            regs[xx] = (regs[xx] - regs[yy]) & 0xFFFFFFFF;
            PC += 3;
            break;
        }
        case 0x03: {
            if (PC + 3 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            yy = ROM[PC + 2];
            var a = regs[xx];
            if (a < 0x1000 || a + 4 > memory.length)
                return "WRITE OUT OF BOUNDS";
            var v = regs[yy];
            memory[a] = v & 0xFF;
            memory[a + 1] = (v >> 8) & 0xFF;
            memory[a + 2] = (v >> 16) & 0xFF;
            memory[a + 3] = (v >> 24) & 0xFF;
            PC += 3;
            break;
        }
        case 0x04: {
            if (PC + 3 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            yy = ROM[PC + 2];
            var a = regs[xx];
            if (a < 0 || a + 4 > memory.length)
                return "READ OUT OF BOUNDS";
            regs[yy] = memory[a] | (memory[a + 1] << 8) | (memory[a + 2] << 16) | (memory[a + 3] << 24);
            PC += 3;
            break;
        }
        case 0x05: {
            if (PC + 3 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            regs[xx] = ROM[PC + 2];
            PC += 3;
            break;
        }
        case 0x06: {
            if (PC + 4 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            regs[xx] = ROM[PC + 2] + (ROM[PC + 3] << 8);
            PC += 4;
            break;
        }
        case 0x07: {
            if (PC + 3 > 0x1000)
                return "ILLEGAL PC";
            PC = ROM[PC + 1] + (ROM[PC + 2] << 8);
            break;
        }
        case 0x08: {
            if (PC + 3 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            if (regs[xx]) {
                PC += 3 + ((ROM[PC + 2] << 24) >> 24);
            } else {
                PC += 3;
            }
            break;
        }
        case 0x09: {
            if (PC + 2 > 0x1000)
                return "ILLEGAL PC";
            xx = ROM[PC + 1];
            results.push(regs[xx]);
            PC += 2;
            break;
        }
        default:
            return "ILLEGAL INSTRUCTION";
        }
    }
}

function testInterpreter() {
    setup();

    //var start = Date.now();
    var s = interpreter();
    if (s !== "INTERRUPT")
        throw "Error";
    //var end = Date.now();
    //print(results.join("\n") + "\n" + dumpState(s) + "Interpreter elapsed time: " + (end - start) + "ms");
}
if (hasTypedArrays) {
    testInterpreter();
}
