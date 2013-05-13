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
/*if (ArrayBuffer && Uint8Array && Int32Array) {
  var membuf = new ArrayBuffer(256*1024);
  memory = new Uint8Array(membuf);
  var regbuf = new ArrayBuffer(256*4);
  regs = new Int32Array(regbuf);
  } else {*/
memory = [];
regs = [];
//}

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

    cycleCount = 20000000;

    //output.textContent = "";
    results = [];
}

function dumpState(s) {
    var v = s + " at " + PC + "\n";
    for (var i = 0; i < 8; ++i) {
        if (i > 0) {
            v += ",";
        }
        v += "regs[" + i + "] = " + regs[i];
    }
    return v + "\n";
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

    var start = Date.now();
    var s = interpreter();
    var end = Date.now();
    //print(results.join("\n") + "\n" + dumpState(s) + "Interpreter elapsed time: " + (end - start) + "ms");
}

// ------------- Compiler -------------

var traces;
var TPC;
var trace;
var defined;
var accumulatedCycleCount;

function traceError(err) {
    trace.push('return "' + err + '";');
    return false;
}

function value(xx) {
    if (!defined[xx]) {
        trace.push('var v' + xx + ' = regs[' + xx + ']; ');
        defined[xx] = true;
    }
    return "v" + xx;
}

function assign(xx, v) {
    trace.push("var v" + xx + " = regs[" + xx + "] = " + v);
    defined[xx] = true;
}

function traceInstruction(withInterrupt) {
    trace.push('/*' + TPC + '*/');

    if (withInterrupt) {
        trace.push('if (--cycleCount == 0) return "INTERRUPT";');
    }
    ++accumulatedCycleCount;

    if (TPC < 0 || TPC >= 0x1000)
        return traceError("ILLEGAL PC");

    var xx, yy;
    switch (ROM[TPC]) {
    case 0x00:
        return traceError("HALTED");
    case 0x01: {
        if (TPC + 3 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        yy = ROM[TPC + 2];
        assign(xx, "(" + value(xx) + " + " + value(yy) + ") & 0xFFFFFFFF;");
        TPC += 3;
        return true;
    }
    case 0x02: {
        if (TPC + 3 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        yy = ROM[TPC + 2];
        assign(xx, "(" + value(xx) + " - " + value(yy) + ") & 0xFFFFFFFF;");
        TPC += 3;
        return true;
    }
    case 0x03: {
        if (TPC + 3 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        yy = ROM[TPC + 2];
        trace.push('var a = ' + value(xx) + '; if (a < 0x1000 || a + 4 > memory.length) return "WRITE OUT OF BOUNDS"; ' +
                   'var v = ' + value(yy) + '; memory[a] = v & 0xFF; memory[a + 1] = (v >> 8) & 0xFF; ' +
                   'memory[a + 2] = (v >> 16) & 0xFF; memory[a + 3] = (v >> 24) & 0xFF;');
        TPC += 3;
        return true;
    }
    case 0x04: {
        if (TPC + 3 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        yy = ROM[TPC + 2];
        trace.push('var a = ' + value(xx) + '; if (a < 0 || a + 4 > memory.length) return "READ OUT OF BOUNDS";');
        assign(yy, "memory[a] | (memory[a + 1] << 8) | (memory[a + 2] << 16) | (memory[a + 3] << 24)");
        TPC += 3;
        return true;
    }
    case 0x05: {
        if (TPC + 3 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        assign(xx, ROM[TPC + 2]);
        TPC += 3;
        return true;
    }
    case 0x06: {
        if (TPC + 4 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        assign(xx, ROM[TPC + 2] + (ROM[TPC + 3] << 8));
        TPC += 4;
        return true;
    }
    case 0x07: {
        if (TPC + 3 > 0x1000)
            return traceError("ILLEGAL PC");
        TPC = ROM[TPC + 1] + (ROM[TPC + 2] << 8);
        if (TPC == PC) {
            trace.push('continue;');
        }
        return false;
    }
    case 0x08: {
        if (TPC + 3 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        var dest = TPC + 3 + ((ROM[TPC + 2] << 24) >> 24);
        if (dest == PC) {
            trace.push('if (' + value(xx) + ') continue;');
        } else {
            trace.push('if (' + value(xx) + ') { PC = ' + dest + '; return ""; }');
        }
        TPC += 3;
        return false;
    }
    case 0x09: {
        if (TPC + 2 > 0x1000)
            return traceError("ILLEGAL PC");
        xx = ROM[TPC + 1];
        trace.push('results.push(' + value(xx) + ');');
        TPC += 2;
        return true;
    }
    }
}

function buildTrace(withInterrupt, preamble) {
    trace = [preamble];
    defined = [];
    for (var i = 0; i < 8; ++i) {
        defined[i] = false;
    }
    accumulatedCycleCount = 0;
    TPC = PC;
    while (traceInstruction(withInterrupt)) {
    }
    if (TPC == PC) {
        trace.push('continue;');
    } else {
        trace.push('PC=' + TPC + ';', 'return "";');
    }
    return trace.join("\n");
}

function makeTrace() {
    var slowCode = buildTrace(true, "");
    var cycleLimit = accumulatedCycleCount;

    var fastCode = 'while (true) {\n' +
        buildTrace(false, "if (cycleCount <= " + cycleLimit + ") { /* Slow path */ " + slowCode + "}\n" + 
                   "/* FAST PATH */\ncycleCount -= " + cycleLimit + ";") + "\n" +
        '}';
    //print("\n\n**** Code for trace starting at " + PC + " **** :\n" + fastCode + "\n");
    return new Function(fastCode);
}

function compiler() {
    traces = [];
    while (1) {
        if (PC < 0 || PC >= 0x1000)
            return "ILLEGAL PC";

        var t = traces[PC];
        if (!t) {
            traces[PC] = t = makeTrace();
        }
        var s = t();
        if (s != "")
            return s;
    }
}

function testCompiler() {
    setup();

    //var start = Date.now();
    var s = compiler();
    //var end = Date.now();
    //print(end-start);
    //print(results.join("\n") + "\n" + dumpState(s) + "Compiler elapsed time: " + (end - start) + "ms");
}

function printReferences() {
    //references.textContent = "";
    var r0 = 0;
    for (var i = 0; i < 10; ++i) {
        var sum = 0;
        var r5 = 0;
        for (var j = 0x8000; j > 0; --j) {
            sum = (sum + r0) & 0xFFFFFFFF;
            r5 = (r5 + 1) & 0xFFFFFFFF;
            r0 = (r0 + r5) & 0xFFFFFFFF;
        }
        print(sum);
        r0 = sum;
    }
}

//testInterpreter();
testCompiler();
//printReferences();
