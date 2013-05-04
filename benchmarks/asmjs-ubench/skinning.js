// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = function () { };
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF32[((ptr)>>2)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF32[((ptr)>>2)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 134217728;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, TOTAL_STACK);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 592;
assert(STATICTOP < TOTAL_MEMORY);
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTISt9exception;
var __ZTVN10__cxxabiv120__si_class_type_infoE = __ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,98,108,97,104,61,37,102,10,0,0,0,0,101,114,114,111,114,58,32,37,100,92,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,2,80,0,4,0,0,0,2,0,0,0,6,0,0,0,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,0,0,0,0,48,2,80,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
HEAP32[((5243456)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5243464)>>2)]=__ZTISt9exception;
}
if (!awaitingMemoryInitializer) runPostSets();
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOPNOTSUPP:45,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 1024); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF32[(((varargs)+(argIndex))>>2)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative ? '0x' : '';
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*') || nullString;
              var argLength = _strlen(arg);
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              for (var i = 0; i < argLength; i++) {
                ret.push(HEAPU8[((arg++)|0)]);
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function ___gxx_personality_v0() {
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm.setTempRet0(typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm.setTempRet0(throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function __ZNSt9exceptionD2Ev(){}
  var _llvm_memset_p0i8_i64=_memset;
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.staticAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  function _free(){}
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var Math_min = Math.min;
function invoke_vi(index,a1) {
  try {
    Module.dynCall_vi(index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module.dynCall_ii(index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module.dynCall_iii(index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_v(index) {
  try {
    Module.dynCall_v(index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.__ZTISt9exception|0;var n=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.copyTempDouble;var af=env.copyTempFloat;var ag=env.min;var ah=env.invoke_vi;var ai=env.invoke_ii;var aj=env.invoke_iii;var ak=env.invoke_v;var al=env._malloc;var am=env._sysconf;var an=env.___cxa_throw;var ao=env._abort;var ap=env._fprintf;var aq=env._printf;var ar=env.__reallyNegative;var as=env.___setErrNo;var at=env._fwrite;var au=env._llvm_eh_exception;var av=env._write;var aw=env.___cxa_find_matching_catch;var ax=env.___cxa_allocate_exception;var ay=env.___cxa_is_number_type;var az=env.___resumeException;var aA=env.__formatString;var aB=env.___cxa_does_inherit;var aC=env._free;var aD=env.__ZSt18uncaught_exceptionv;var aE=env._pwrite;var aF=env.___cxa_call_unexpected;var aG=env._sbrk;var aH=env.___errno_location;var aI=env.___gxx_personality_v0;var aJ=env.__ZNSt9exceptionD2Ev;var aK=env._time;
// EMSCRIPTEN_START_FUNCS
function aP(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function aQ(){return i|0}function aR(a){a=a|0;i=a}function aS(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function aT(a){a=a|0;D=a}function aU(a){a=a|0;E=a}function aV(a){a=a|0;F=a}function aW(a){a=a|0;G=a}function aX(a){a=a|0;H=a}function aY(a){a=a|0;I=a}function aZ(a){a=a|0;J=a}function a_(a){a=a|0;K=a}function a$(a){a=a|0;L=a}function a0(a){a=a|0;M=a}function a1(b,d){b=b|0;d=d|0;var e=0,f=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0,V=0,W=0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,ar=0.0,as=0.0,at=0.0,au=0.0,av=0,aw=0.0,ax=0,ay=0.0;e=i;i=i+48|0;f=e|0;do{if((b|0)>1){h=a[c[d+4>>2]|0]|0;if((h|0)==50){j=6600;l=6500;break}else if((h|0)==51){m=4;break}else if((h|0)==52){j=22e3;l=24e3;break}else if((h|0)==53){j=3e4;l=32400;break}else if((h|0)==49){j=2e3;l=1700;break}else if((h|0)==48){n=0;i=e;return n|0}else{aq(5242932,(u=i,i=i+4|0,c[u>>2]=h-48|0,u)|0);n=-1;i=e;return n|0}}else{m=4}}while(0);if((m|0)==4){j=9500;l=1e4}m=j<<5;d=a2(m)|0;b=d+(j<<5)|0;h=d;while(1){g[h>>2]=0.0;g[h+4>>2]=0.0;g[h+8>>2]=0.0;g[h+12>>2]=1.0;a7(h+16|0,0,16);o=h+32|0;if((o|0)==(b|0)){break}else{h=o}}h=a2(j*12&-1)|0;b=h+(j*12&-1)|0;o=h;while(1){c[o>>2]=-1;g[o+4>>2]=0.0;c[o+8>>2]=0;p=o+12|0;if((p|0)==(b|0)){q=0;break}else{o=p}}while(1){g[d+(q<<5)+12>>2]=1.0;g[d+(q<<5)+16>>2]=0.0;g[d+(q<<5)+20>>2]=0.0;g[d+(q<<5)+24>>2]=1.0;g[d+(q<<5)+28>>2]=0.0;c[h+(q*12&-1)>>2]=0;g[h+(q*12&-1)+4>>2]=1.0;c[h+(q*12&-1)+8>>2]=1;o=q+1|0;if((o|0)<(j|0)){q=o}else{break}}a7(f|0,0,48);q=j<<1;o=a2(m)|0;m=o+(q<<4)|0;b=o;while(1){a7(b|0,0,16);p=b+16|0;if((p|0)==(m|0)){r=0;break}else{b=p}}while(1){b=d;m=h;p=o;s=j;while(1){t=s-1|0;v=c[m>>2]|0;w=+g[m+4>>2];x=w*+g[f+(v*48&-1)>>2];y=w*+g[f+(v*48&-1)+4>>2];z=w*+g[f+(v*48&-1)+8>>2];A=w*+g[f+(v*48&-1)+12>>2];B=w*+g[f+(v*48&-1)+16>>2];C=w*+g[f+(v*48&-1)+20>>2];D=w*+g[f+(v*48&-1)+24>>2];E=w*+g[f+(v*48&-1)+28>>2];F=w*+g[f+(v*48&-1)+32>>2];G=w*+g[f+(v*48&-1)+36>>2];H=w*+g[f+(v*48&-1)+40>>2];I=w*+g[f+(v*48&-1)+44>>2];v=m+12|0;L27:do{if((c[m+8>>2]|0)==0){w=I;J=H;K=G;L=F;M=E;N=D;O=C;P=B;Q=A;R=z;S=y;T=x;U=m;V=v;while(1){W=c[V>>2]|0;X=+g[U+16>>2];Y=T+X*+g[f+(W*48&-1)>>2];Z=S+X*+g[f+(W*48&-1)+4>>2];_=R+X*+g[f+(W*48&-1)+8>>2];$=Q+X*+g[f+(W*48&-1)+12>>2];aa=P+X*+g[f+(W*48&-1)+16>>2];ab=O+X*+g[f+(W*48&-1)+20>>2];ac=N+X*+g[f+(W*48&-1)+24>>2];ad=M+X*+g[f+(W*48&-1)+28>>2];ae=L+X*+g[f+(W*48&-1)+32>>2];af=K+X*+g[f+(W*48&-1)+36>>2];ag=J+X*+g[f+(W*48&-1)+40>>2];ah=w+X*+g[f+(W*48&-1)+44>>2];W=V+12|0;if((c[V+8>>2]|0)==0){w=ah;J=ag;K=af;L=ae;M=ad;N=ac;O=ab;P=aa;Q=$;R=_;S=Z;T=Y;U=V;V=W}else{ai=ah;aj=ag;ak=af;al=ae;am=ad;an=ac;ao=ab;ap=aa;ar=$;as=_;at=Z;au=Y;av=W;break L27}}}else{ai=I;aj=H;ak=G;al=F;am=E;an=D;ao=C;ap=B;ar=A;as=z;at=y;au=x;av=v}}while(0);v=b|0;V=b+4|0;U=b+8|0;g[p>>2]=ar+(au*+g[v>>2]+at*+g[V>>2]+as*+g[U>>2]);g[p+4>>2]=am+(ap*+g[v>>2]+ao*+g[V>>2]+an*+g[U>>2]);g[p+8>>2]=ai+(al*+g[v>>2]+ak*+g[V>>2]+aj*+g[U>>2]);U=b+16|0;V=b+20|0;v=b+24|0;g[p+16>>2]=au*+g[U>>2]+at*+g[V>>2]+as*+g[v>>2];g[p+20>>2]=ap*+g[U>>2]+ao*+g[V>>2]+an*+g[v>>2];g[p+24>>2]=al*+g[U>>2]+ak*+g[V>>2]+aj*+g[v>>2];if((t|0)==0){break}else{b=b+32|0;m=av;p=p+32|0;s=t}}s=r+1|0;if(s>>>0<l>>>0){r=s}else{aw=0.0;ax=0;break}}while(1){ay=aw+(+g[o+(ax<<4)>>2]+ +g[o+(ax<<4)+4>>2]+ +g[o+(ax<<4)+8>>2]+ +g[o+(ax<<4)+12>>2]);r=ax+1|0;if((r|0)==(q|0)){break}else{aw=ay;ax=r}}aq(5242920,(u=i,i=i+8|0,g[k>>2]=ay,c[u>>2]=c[k>>2]|0,c[u+4>>2]=c[k+4>>2]|0,u)|0);n=0;i=e;return n|0}function a2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aI=0,aJ=0,aL=0,aM=0,aN=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0;b=(a|0)==0?1:a;a=b>>>0<245;d=b>>>0<11;e=b+11|0;f=e&-8;g=b>>>0>4294967231;b=-f|0;h=e>>>8;e=(h|0)==0;i=f|3;j=f|4;k=f+8|0;l=f+12|0;m=f+28|0;n=f+16|0;o=f+20|0;p=f+24|0;q=f>>>0>16777215;r=(h+1048320|0)>>>16&8;s=h<<r;h=(s+520192|0)>>>16&4;t=s<<h;s=(t+245760|0)>>>16&2;u=(14-(h|r|s)|0)+(t<<s>>>15)|0;s=f>>>((u+7|0)>>>0)&1|u<<1;L37:while(1){do{if(a){u=d?16:f;t=u>>>3;r=c[1310736]|0;h=r>>>(t>>>0);if((h&3|0)!=0){v=(h&1^1)+t|0;w=v<<1;x=5242984+(w<<2)|0;y=5242984+(w+2<<2)|0;w=c[y>>2]|0;z=w+8|0;A=c[z>>2]|0;if((x|0)==(A|0)){c[1310736]=r&(1<<v^-1)}else{if(A>>>0<(c[1310740]|0)>>>0){C=386;break L37}D=A+12|0;if((c[D>>2]|0)!=(w|0)){C=387;break L37}c[D>>2]=x;c[y>>2]=A}A=v<<3;c[w+4>>2]=A|3;v=w+(A|4)|0;c[v>>2]=c[v>>2]|1;E=z;C=364;break}if(u>>>0<=(c[1310738]|0)>>>0){F=u;C=183;break}if((h|0)!=0){z=2<<t;v=h<<t&(z|-z);z=(v&-v)-1|0;v=z>>>12&16;t=z>>>(v>>>0);z=t>>>5&8;h=t>>>(z>>>0);t=h>>>2&4;A=h>>>(t>>>0);h=A>>>1&2;w=A>>>(h>>>0);A=w>>>1&1;y=(z|v|t|h|A)+(w>>>(A>>>0))|0;A=y<<1;w=5242984+(A<<2)|0;h=5242984+(A+2<<2)|0;A=c[h>>2]|0;t=A+8|0;v=c[t>>2]|0;if((w|0)==(v|0)){c[1310736]=r&(1<<y^-1)}else{if(v>>>0<(c[1310740]|0)>>>0){C=384;break L37}r=v+12|0;if((c[r>>2]|0)!=(A|0)){C=385;break L37}c[r>>2]=w;c[h>>2]=v}v=y<<3;y=v-u|0;c[A+4>>2]=u|3;h=A;A=h+u|0;c[h+(u|4)>>2]=y|1;c[h+v>>2]=y;v=c[1310738]|0;if((v|0)!=0){h=c[1310741]|0;w=v>>>3;v=w<<1;r=5242984+(v<<2)|0;z=c[1310736]|0;x=1<<w;if((z&x|0)==0){c[1310736]=z|x;G=r;H=5242984+(v+2<<2)|0}else{x=5242984+(v+2<<2)|0;v=c[x>>2]|0;if(v>>>0<(c[1310740]|0)>>>0){C=48;break L37}else{G=v;H=x}}c[H>>2]=h;c[G+12>>2]=h;c[h+8>>2]=G;c[h+12>>2]=r}c[1310738]=y;c[1310741]=A;E=t;C=364;break}t=c[1310737]|0;if((t|0)==0){F=u;C=183;break}A=(t&-t)-1|0;t=A>>>12&16;y=A>>>(t>>>0);A=y>>>5&8;r=y>>>(A>>>0);y=r>>>2&4;h=r>>>(y>>>0);r=h>>>1&2;x=h>>>(r>>>0);h=x>>>1&1;v=c[5243248+((A|t|y|r|h)+(x>>>(h>>>0))<<2)>>2]|0;h=v;x=v;r=(c[v+4>>2]&-8)-u|0;while(1){v=c[h+16>>2]|0;if((v|0)==0){y=c[h+20>>2]|0;if((y|0)==0){break}else{I=y}}else{I=v}v=(c[I+4>>2]&-8)-u|0;y=v>>>0<r>>>0;h=I;x=y?I:x;r=y?v:r}h=x;v=c[1310740]|0;if(h>>>0<v>>>0){C=382;break L37}y=h+u|0;t=y;if(h>>>0>=y>>>0){C=383;break L37}y=c[x+24>>2]|0;A=c[x+12>>2]|0;L76:do{if((A|0)==(x|0)){z=x+20|0;w=c[z>>2]|0;do{if((w|0)==0){D=x+16|0;J=c[D>>2]|0;if((J|0)==0){K=0;break L76}else{L=J;M=D;break}}else{L=w;M=z}}while(0);while(1){z=L+20|0;w=c[z>>2]|0;if((w|0)!=0){L=w;M=z;continue}z=L+16|0;w=c[z>>2]|0;if((w|0)==0){break}else{L=w;M=z}}if(M>>>0<v>>>0){C=70;break L37}c[M>>2]=0;K=L}else{z=c[x+8>>2]|0;if(z>>>0<v>>>0){C=379;break L37}w=z+12|0;if((c[w>>2]|0)!=(x|0)){C=380;break L37}D=A+8|0;if((c[D>>2]|0)!=(x|0)){C=381;break L37}c[w>>2]=A;c[D>>2]=z;K=A}}while(0);L90:do{if((y|0)!=0){A=x+28|0;v=5243248+(c[A>>2]<<2)|0;do{if((x|0)==(c[v>>2]|0)){c[v>>2]=K;if((K|0)!=0){break}c[1310737]=c[1310737]&(1<<c[A>>2]^-1);break L90}else{if(y>>>0<(c[1310740]|0)>>>0){C=79;break L37}z=y+16|0;if((c[z>>2]|0)==(x|0)){c[z>>2]=K}else{c[y+20>>2]=K}if((K|0)==0){break L90}}}while(0);if(K>>>0<(c[1310740]|0)>>>0){C=90;break L37}c[K+24>>2]=y;A=c[x+16>>2]|0;if((A|0)!=0){if(A>>>0<(c[1310740]|0)>>>0){C=85;break L37}c[K+16>>2]=A;c[A+24>>2]=K}A=c[x+20>>2]|0;if((A|0)==0){break}if(A>>>0<(c[1310740]|0)>>>0){C=89;break L37}c[K+20>>2]=A;c[A+24>>2]=K}}while(0);if(r>>>0<16){y=r+u|0;c[x+4>>2]=y|3;A=h+(y+4|0)|0;c[A>>2]=c[A>>2]|1}else{c[x+4>>2]=u|3;c[h+(u|4)>>2]=r|1;c[h+(r+u|0)>>2]=r;A=c[1310738]|0;if((A|0)!=0){y=c[1310741]|0;v=A>>>3;A=v<<1;z=5242984+(A<<2)|0;D=c[1310736]|0;w=1<<v;if((D&w|0)==0){c[1310736]=D|w;N=z;O=5242984+(A+2<<2)|0}else{w=5242984+(A+2<<2)|0;A=c[w>>2]|0;if(A>>>0<(c[1310740]|0)>>>0){C=97;break L37}else{N=A;O=w}}c[O>>2]=y;c[N+12>>2]=y;c[y+8>>2]=N;c[y+12>>2]=z}c[1310738]=r;c[1310741]=t}z=x+8|0;if((z|0)==0){F=u;C=183;break}else{E=z;C=364;break}}else{if(g){F=-1;C=183;break}z=c[1310737]|0;if((z|0)==0){F=f;C=183;break}if(e){P=0}else{P=q?31:s}y=c[5243248+(P<<2)>>2]|0;L127:do{if((y|0)==0){Q=0;R=b;S=0}else{if((P|0)==31){T=0}else{T=25-(P>>>1)|0}w=0;A=b;D=y;v=f<<T;J=0;while(1){U=c[D+4>>2]&-8;V=U-f|0;if(V>>>0<A>>>0){if((U|0)==(f|0)){Q=D;R=V;S=D;break L127}else{W=D;X=V}}else{W=w;X=A}V=c[D+20>>2]|0;U=c[D+16+(v>>>31<<2)>>2]|0;Y=(V|0)==0|(V|0)==(U|0)?J:V;if((U|0)==0){Q=W;R=X;S=Y;break L127}else{w=W;A=X;D=U;v=v<<1;J=Y}}}}while(0);if((S|0)==0&(Q|0)==0){y=2<<P;u=z&(y|-y);if((u|0)==0){F=f;C=183;break}y=(u&-u)-1|0;u=y>>>12&16;x=y>>>(u>>>0);y=x>>>5&8;t=x>>>(y>>>0);x=t>>>2&4;r=t>>>(x>>>0);t=r>>>1&2;h=r>>>(t>>>0);r=h>>>1&1;Z=c[5243248+((y|u|x|t|r)+(h>>>(r>>>0))<<2)>>2]|0}else{Z=S}L142:do{if((Z|0)==0){_=R;$=Q}else{r=Z;h=R;t=Q;while(1){x=(c[r+4>>2]&-8)-f|0;u=x>>>0<h>>>0;y=u?x:h;x=u?r:t;u=c[r+16>>2]|0;if((u|0)!=0){r=u;h=y;t=x;continue}u=c[r+20>>2]|0;if((u|0)==0){_=y;$=x;break L142}else{r=u;h=y;t=x}}}}while(0);if(($|0)==0){F=f;C=183;break}if(_>>>0>=((c[1310738]|0)-f|0)>>>0){F=f;C=183;break}z=$;t=c[1310740]|0;if(z>>>0<t>>>0){C=393;break L37}h=z+f|0;r=h;if(z>>>0>=h>>>0){C=394;break L37}x=c[$+24>>2]|0;y=c[$+12>>2]|0;L151:do{if((y|0)==($|0)){u=$+20|0;J=c[u>>2]|0;do{if((J|0)==0){v=$+16|0;D=c[v>>2]|0;if((D|0)==0){aa=0;break L151}else{ab=D;ac=v;break}}else{ab=J;ac=u}}while(0);while(1){u=ab+20|0;J=c[u>>2]|0;if((J|0)!=0){ab=J;ac=u;continue}u=ab+16|0;J=c[u>>2]|0;if((J|0)==0){break}else{ab=J;ac=u}}if(ac>>>0<t>>>0){C=135;break L37}c[ac>>2]=0;aa=ab}else{u=c[$+8>>2]|0;if(u>>>0<t>>>0){C=388;break L37}J=u+12|0;if((c[J>>2]|0)!=($|0)){C=389;break L37}v=y+8|0;if((c[v>>2]|0)!=($|0)){C=390;break L37}c[J>>2]=y;c[v>>2]=u;aa=y}}while(0);L165:do{if((x|0)!=0){y=$+28|0;t=5243248+(c[y>>2]<<2)|0;do{if(($|0)==(c[t>>2]|0)){c[t>>2]=aa;if((aa|0)!=0){break}c[1310737]=c[1310737]&(1<<c[y>>2]^-1);break L165}else{if(x>>>0<(c[1310740]|0)>>>0){C=144;break L37}u=x+16|0;if((c[u>>2]|0)==($|0)){c[u>>2]=aa}else{c[x+20>>2]=aa}if((aa|0)==0){break L165}}}while(0);if(aa>>>0<(c[1310740]|0)>>>0){C=155;break L37}c[aa+24>>2]=x;y=c[$+16>>2]|0;if((y|0)!=0){if(y>>>0<(c[1310740]|0)>>>0){C=150;break L37}c[aa+16>>2]=y;c[y+24>>2]=aa}y=c[$+20>>2]|0;if((y|0)==0){break}if(y>>>0<(c[1310740]|0)>>>0){C=154;break L37}c[aa+20>>2]=y;c[y+24>>2]=aa}}while(0);do{if(_>>>0<16){x=_+f|0;c[$+4>>2]=x|3;y=z+(x+4|0)|0;c[y>>2]=c[y>>2]|1}else{c[$+4>>2]=i;c[z+j>>2]=_|1;c[z+(_+f|0)>>2]=_;y=_>>>3;if(_>>>0<256){x=y<<1;t=5242984+(x<<2)|0;u=c[1310736]|0;v=1<<y;if((u&v|0)==0){c[1310736]=u|v;ad=t;ae=5242984+(x+2<<2)|0}else{v=5242984+(x+2<<2)|0;x=c[v>>2]|0;if(x>>>0<(c[1310740]|0)>>>0){C=162;break L37}else{ad=x;ae=v}}c[ae>>2]=r;c[ad+12>>2]=r;c[z+k>>2]=ad;c[z+l>>2]=t;break}t=h;v=_>>>8;do{if((v|0)==0){af=0}else{if(_>>>0>16777215){af=31;break}x=(v+1048320|0)>>>16&8;u=v<<x;y=(u+520192|0)>>>16&4;J=u<<y;u=(J+245760|0)>>>16&2;D=(14-(y|x|u)|0)+(J<<u>>>15)|0;af=_>>>((D+7|0)>>>0)&1|D<<1}}while(0);v=5243248+(af<<2)|0;c[z+m>>2]=af;c[z+o>>2]=0;c[z+n>>2]=0;D=c[1310737]|0;u=1<<af;if((D&u|0)==0){c[1310737]=D|u;c[v>>2]=t;c[z+p>>2]=v;c[z+l>>2]=t;c[z+k>>2]=t;break}if((af|0)==31){ag=0}else{ag=25-(af>>>1)|0}u=_<<ag;D=c[v>>2]|0;while(1){if((c[D+4>>2]&-8|0)==(_|0)){break}ah=D+16+(u>>>31<<2)|0;v=c[ah>>2]|0;if((v|0)==0){C=174;break}else{u=u<<1;D=v}}if((C|0)==174){C=0;if(ah>>>0<(c[1310740]|0)>>>0){C=176;break L37}c[ah>>2]=t;c[z+p>>2]=D;c[z+l>>2]=t;c[z+k>>2]=t;break}u=D+8|0;v=c[u>>2]|0;J=c[1310740]|0;if(D>>>0<J>>>0){C=391;break L37}if(v>>>0<J>>>0){C=392;break L37}c[v+12>>2]=t;c[u>>2]=t;c[z+k>>2]=v;c[z+l>>2]=D;c[z+p>>2]=0}}while(0);z=$+8|0;if((z|0)==0){F=f;C=183;break}else{E=z;C=364;break}}}while(0);L215:do{if((C|0)==183){C=0;z=c[1310738]|0;if(F>>>0<=z>>>0){h=z-F|0;r=c[1310741]|0;if(h>>>0>15){v=r;c[1310741]=v+F|0;c[1310738]=h;c[v+(F+4|0)>>2]=h|1;c[v+z>>2]=h;c[r+4>>2]=F|3}else{c[1310738]=0;c[1310741]=0;c[r+4>>2]=z|3;h=r+(z+4|0)|0;c[h>>2]=c[h>>2]|1}E=r+8|0;C=364;break}r=c[1310739]|0;if(F>>>0<r>>>0){h=r-F|0;c[1310739]=h;r=c[1310742]|0;z=r;c[1310742]=z+F|0;c[z+(F+4|0)>>2]=h|1;c[r+4>>2]=F|3;E=r+8|0;C=364;break}if((c[1310720]|0)==0){r=am(8)|0;if((r-1&r|0)!=0){C=192;break L37}c[1310722]=r;c[1310721]=r;c[1310723]=-1;c[1310724]=2097152;c[1310725]=0;c[1310847]=0;c[1310720]=aK(0)&-16^1431655768}r=F+48|0;h=c[1310722]|0;z=F+47|0;v=h+z|0;u=-h|0;h=v&u;if(h>>>0<=F>>>0){break}J=c[1310846]|0;if((J|0)!=0){x=c[1310844]|0;y=x+h|0;if(y>>>0<=x>>>0|y>>>0>J>>>0){break}}L235:do{if((c[1310847]&4|0)==0){J=c[1310742]|0;L237:do{if((J|0)==0){C=204}else{y=J;x=5243392;while(1){ai=x|0;A=c[ai>>2]|0;if(A>>>0<=y>>>0){aj=x+4|0;if((A+(c[aj>>2]|0)|0)>>>0>y>>>0){break}}A=c[x+8>>2]|0;if((A|0)==0){C=204;break L237}else{x=A}}if((x|0)==0){C=204;break}y=v-(c[1310739]|0)&u;if(y>>>0>=2147483647){ak=0;break}A=aG(y|0)|0;w=(A|0)==((c[ai>>2]|0)+(c[aj>>2]|0)|0);al=w?A:-1;ap=w?y:0;aq=A;ar=y;C=213;break}}while(0);do{if((C|0)==204){C=0;J=aG(0)|0;if((J|0)==-1){ak=0;break}D=J;t=c[1310721]|0;y=t-1|0;if((y&D|0)==0){as=h}else{as=(h-D|0)+(y+D&-t)|0}t=c[1310844]|0;D=t+as|0;if(!(as>>>0>F>>>0&as>>>0<2147483647)){ak=0;break}y=c[1310846]|0;if((y|0)!=0){if(D>>>0<=t>>>0|D>>>0>y>>>0){ak=0;break}}y=aG(as|0)|0;D=(y|0)==(J|0);al=D?J:-1;ap=D?as:0;aq=y;ar=as;C=213;break}}while(0);L257:do{if((C|0)==213){C=0;y=-ar|0;if((al|0)!=-1){at=ap;au=al;C=224;break L235}do{if((aq|0)!=-1&ar>>>0<2147483647&ar>>>0<r>>>0){D=c[1310722]|0;J=(z-ar|0)+D&-D;if(J>>>0>=2147483647){av=ar;break}if((aG(J|0)|0)==-1){aG(y|0);ak=ap;break L257}else{av=J+ar|0;break}}else{av=ar}}while(0);if((aq|0)==-1){ak=ap}else{at=av;au=aq;C=224;break L235}}}while(0);c[1310847]=c[1310847]|4;aw=ak;C=221;break}else{aw=0;C=221}}while(0);do{if((C|0)==221){C=0;if(h>>>0>=2147483647){break}z=aG(h|0)|0;r=aG(0)|0;if(!((r|0)!=-1&(z|0)!=-1&z>>>0<r>>>0)){break}u=r-z|0;r=u>>>0>(F+40|0)>>>0;v=r?z:-1;if((v|0)==-1){break}else{at=r?u:aw;au=v;C=224;break}}}while(0);do{if((C|0)==224){C=0;h=(c[1310844]|0)+at|0;c[1310844]=h;if(h>>>0>(c[1310845]|0)>>>0){c[1310845]=h}h=c[1310742]|0;L277:do{if((h|0)==0){v=c[1310740]|0;if((v|0)==0|au>>>0<v>>>0){c[1310740]=au}c[1310848]=au;c[1310849]=at;c[1310851]=0;c[1310745]=c[1310720]|0;c[1310744]=-1;v=0;while(1){u=v<<1;r=5242984+(u<<2)|0;c[5242984+(u+3<<2)>>2]=r;c[5242984+(u+2<<2)>>2]=r;r=v+1|0;if((r|0)==32){break}else{v=r}}v=au+8|0;if((v&7|0)==0){ay=0}else{ay=-v&7}v=(at-40|0)-ay|0;c[1310742]=au+ay|0;c[1310739]=v;c[au+(ay+4|0)>>2]=v|1;c[au+(at-36|0)>>2]=40;c[1310743]=c[1310724]|0}else{v=5243392;while(1){az=c[v>>2]|0;aA=v+4|0;aB=c[aA>>2]|0;if((au|0)==(az+aB|0)){C=236;break}r=c[v+8>>2]|0;if((r|0)==0){break}else{v=r}}do{if((C|0)==236){C=0;if((c[v+12>>2]&8|0)!=0){break}r=h;if(!(r>>>0>=az>>>0&r>>>0<au>>>0)){break}c[aA>>2]=aB+at|0;r=c[1310742]|0;u=(c[1310739]|0)+at|0;z=r;y=r+8|0;if((y&7|0)==0){aC=0}else{aC=-y&7}y=u-aC|0;c[1310742]=z+aC|0;c[1310739]=y;c[z+(aC+4|0)>>2]=y|1;c[z+(u+4|0)>>2]=40;c[1310743]=c[1310724]|0;break L277}}while(0);if(au>>>0<(c[1310740]|0)>>>0){c[1310740]=au}v=au+at|0;u=5243392;while(1){aD=u|0;if((c[aD>>2]|0)==(v|0)){C=246;break}z=c[u+8>>2]|0;if((z|0)==0){break}else{u=z}}do{if((C|0)==246){C=0;if((c[u+12>>2]&8|0)!=0){break}c[aD>>2]=au;v=u+4|0;c[v>>2]=(c[v>>2]|0)+at|0;v=au+8|0;if((v&7|0)==0){aE=0}else{aE=-v&7}v=au+(at+8|0)|0;if((v&7|0)==0){aF=0}else{aF=-v&7}v=au+(aF+at|0)|0;z=v;y=aE+F|0;r=au+y|0;x=r;J=(v-(au+aE|0)|0)-F|0;c[au+(aE+4|0)>>2]=F|3;do{if((z|0)==(c[1310742]|0)){D=(c[1310739]|0)+J|0;c[1310739]=D;c[1310742]=x;c[au+(y+4|0)>>2]=D|1}else{if((z|0)==(c[1310741]|0)){D=(c[1310738]|0)+J|0;c[1310738]=D;c[1310741]=x;c[au+(y+4|0)>>2]=D|1;c[au+(D+y|0)>>2]=D;break}D=at+4|0;t=c[au+(D+aF|0)>>2]|0;if((t&3|0)==1){A=t&-8;w=t>>>3;L322:do{if(t>>>0<256){Y=c[au+((aF|8)+at|0)>>2]|0;U=c[au+((at+12|0)+aF|0)>>2]|0;V=5242984+(w<<1<<2)|0;if((Y|0)!=(V|0)){if(Y>>>0<(c[1310740]|0)>>>0){C=397;break L37}if((c[Y+12>>2]|0)!=(z|0)){C=398;break L37}}if((U|0)==(Y|0)){c[1310736]=c[1310736]&(1<<w^-1);break}if((U|0)==(V|0)){aI=U+8|0}else{if(U>>>0<(c[1310740]|0)>>>0){C=395;break L37}V=U+8|0;if((c[V>>2]|0)==(z|0)){aI=V}else{C=396;break L37}}c[Y+12>>2]=U;c[aI>>2]=Y}else{Y=v;U=c[au+((aF|24)+at|0)>>2]|0;V=c[au+((at+12|0)+aF|0)>>2]|0;L337:do{if((V|0)==(Y|0)){aJ=aF|16;aL=au+(D+aJ|0)|0;aM=c[aL>>2]|0;do{if((aM|0)==0){aN=au+(aJ+at|0)|0;aP=c[aN>>2]|0;if((aP|0)==0){aQ=0;break L337}else{aR=aP;aS=aN;break}}else{aR=aM;aS=aL}}while(0);while(1){aL=aR+20|0;aM=c[aL>>2]|0;if((aM|0)!=0){aR=aM;aS=aL;continue}aL=aR+16|0;aM=c[aL>>2]|0;if((aM|0)==0){break}else{aR=aM;aS=aL}}if(aS>>>0<(c[1310740]|0)>>>0){C=281;break L37}c[aS>>2]=0;aQ=aR}else{aL=c[au+((aF|8)+at|0)>>2]|0;if(aL>>>0<(c[1310740]|0)>>>0){C=399;break L37}aM=aL+12|0;if((c[aM>>2]|0)!=(Y|0)){C=400;break L37}aJ=V+8|0;if((c[aJ>>2]|0)!=(Y|0)){C=401;break L37}c[aM>>2]=V;c[aJ>>2]=aL;aQ=V}}while(0);if((U|0)==0){break}V=au+((at+28|0)+aF|0)|0;aL=5243248+(c[V>>2]<<2)|0;do{if((Y|0)==(c[aL>>2]|0)){c[aL>>2]=aQ;if((aQ|0)!=0){break}c[1310737]=c[1310737]&(1<<c[V>>2]^-1);break L322}else{if(U>>>0<(c[1310740]|0)>>>0){C=290;break L37}aJ=U+16|0;if((c[aJ>>2]|0)==(Y|0)){c[aJ>>2]=aQ}else{c[U+20>>2]=aQ}if((aQ|0)==0){break L322}}}while(0);if(aQ>>>0<(c[1310740]|0)>>>0){C=301;break L37}c[aQ+24>>2]=U;Y=aF|16;V=c[au+(Y+at|0)>>2]|0;if((V|0)!=0){if(V>>>0<(c[1310740]|0)>>>0){C=296;break L37}c[aQ+16>>2]=V;c[V+24>>2]=aQ}V=c[au+(D+Y|0)>>2]|0;if((V|0)==0){break}if(V>>>0<(c[1310740]|0)>>>0){C=300;break L37}c[aQ+20>>2]=V;c[V+24>>2]=aQ}}while(0);aT=au+((A|aF)+at|0)|0;aU=A+J|0}else{aT=z;aU=J}D=aT+4|0;c[D>>2]=c[D>>2]&-2;c[au+(y+4|0)>>2]=aU|1;c[au+(aU+y|0)>>2]=aU;D=aU>>>3;if(aU>>>0<256){w=D<<1;t=5242984+(w<<2)|0;V=c[1310736]|0;Y=1<<D;if((V&Y|0)==0){c[1310736]=V|Y;aV=t;aW=5242984+(w+2<<2)|0}else{Y=5242984+(w+2<<2)|0;w=c[Y>>2]|0;if(w>>>0<(c[1310740]|0)>>>0){C=307;break L37}else{aV=w;aW=Y}}c[aW>>2]=x;c[aV+12>>2]=x;c[au+(y+8|0)>>2]=aV;c[au+(y+12|0)>>2]=t;break}t=r;Y=aU>>>8;do{if((Y|0)==0){aX=0}else{if(aU>>>0>16777215){aX=31;break}w=(Y+1048320|0)>>>16&8;V=Y<<w;D=(V+520192|0)>>>16&4;aL=V<<D;V=(aL+245760|0)>>>16&2;aJ=(14-(D|w|V)|0)+(aL<<V>>>15)|0;aX=aU>>>((aJ+7|0)>>>0)&1|aJ<<1}}while(0);Y=5243248+(aX<<2)|0;c[au+(y+28|0)>>2]=aX;c[au+(y+20|0)>>2]=0;c[au+(y+16|0)>>2]=0;A=c[1310737]|0;aJ=1<<aX;if((A&aJ|0)==0){c[1310737]=A|aJ;c[Y>>2]=t;c[au+(y+24|0)>>2]=Y;c[au+(y+12|0)>>2]=t;c[au+(y+8|0)>>2]=t;break}if((aX|0)==31){aY=0}else{aY=25-(aX>>>1)|0}aJ=aU<<aY;A=c[Y>>2]|0;while(1){if((c[A+4>>2]&-8|0)==(aU|0)){break}aZ=A+16+(aJ>>>31<<2)|0;Y=c[aZ>>2]|0;if((Y|0)==0){C=319;break}else{aJ=aJ<<1;A=Y}}if((C|0)==319){C=0;if(aZ>>>0<(c[1310740]|0)>>>0){C=321;break L37}c[aZ>>2]=t;c[au+(y+24|0)>>2]=A;c[au+(y+12|0)>>2]=t;c[au+(y+8|0)>>2]=t;break}aJ=A+8|0;Y=c[aJ>>2]|0;V=c[1310740]|0;if(A>>>0<V>>>0){C=402;break L37}if(Y>>>0<V>>>0){C=403;break L37}c[Y+12>>2]=t;c[aJ>>2]=t;c[au+(y+8|0)>>2]=Y;c[au+(y+12|0)>>2]=A;c[au+(y+24|0)>>2]=0}}while(0);E=au+(aE|8)|0;C=364;break L215}}while(0);u=h;y=5243392;while(1){a_=c[y>>2]|0;if(a_>>>0<=u>>>0){a$=c[y+4>>2]|0;a0=a_+a$|0;if(a0>>>0>u>>>0){break}}y=c[y+8>>2]|0}y=a_+(a$-39|0)|0;if((y&7|0)==0){a1=0}else{a1=-y&7}y=a_+((a$-47|0)+a1|0)|0;r=y>>>0<(h+16|0)>>>0?u:y;y=r+8|0;x=au+8|0;if((x&7|0)==0){a2=0}else{a2=-x&7}x=(at-40|0)-a2|0;c[1310742]=au+a2|0;c[1310739]=x;c[au+(a2+4|0)>>2]=x|1;c[au+(at-36|0)>>2]=40;c[1310743]=c[1310724]|0;c[r+4>>2]=27;a8(y|0,5243392,16);c[1310848]=au;c[1310849]=at;c[1310851]=0;c[1310850]=y;y=r+28|0;c[y>>2]=7;L411:do{if((r+32|0)>>>0<a0>>>0){x=y;while(1){J=x+4|0;c[J>>2]=7;if((x+8|0)>>>0<a0>>>0){x=J}else{break L411}}}}while(0);if((r|0)==(u|0)){break}y=r-h|0;x=u+(y+4|0)|0;c[x>>2]=c[x>>2]&-2;c[h+4>>2]=y|1;c[u+y>>2]=y;x=y>>>3;if(y>>>0<256){J=x<<1;z=5242984+(J<<2)|0;v=c[1310736]|0;Y=1<<x;if((v&Y|0)==0){c[1310736]=v|Y;a3=z;a4=5242984+(J+2<<2)|0}else{Y=5242984+(J+2<<2)|0;J=c[Y>>2]|0;if(J>>>0<(c[1310740]|0)>>>0){C=342;break L37}else{a3=J;a4=Y}}c[a4>>2]=h;c[a3+12>>2]=h;c[h+8>>2]=a3;c[h+12>>2]=z;break}z=h;Y=y>>>8;do{if((Y|0)==0){a5=0}else{if(y>>>0>16777215){a5=31;break}J=(Y+1048320|0)>>>16&8;v=Y<<J;x=(v+520192|0)>>>16&4;aJ=v<<x;v=(aJ+245760|0)>>>16&2;V=(14-(x|J|v)|0)+(aJ<<v>>>15)|0;a5=y>>>((V+7|0)>>>0)&1|V<<1}}while(0);Y=5243248+(a5<<2)|0;c[h+28>>2]=a5;c[h+20>>2]=0;c[h+16>>2]=0;u=c[1310737]|0;r=1<<a5;if((u&r|0)==0){c[1310737]=u|r;c[Y>>2]=z;c[h+24>>2]=Y;c[h+12>>2]=h;c[h+8>>2]=h;break}if((a5|0)==31){a6=0}else{a6=25-(a5>>>1)|0}r=y<<a6;u=c[Y>>2]|0;while(1){if((c[u+4>>2]&-8|0)==(y|0)){break}a7=u+16+(r>>>31<<2)|0;Y=c[a7>>2]|0;if((Y|0)==0){C=354;break}else{r=r<<1;u=Y}}if((C|0)==354){C=0;if(a7>>>0<(c[1310740]|0)>>>0){C=356;break L37}c[a7>>2]=z;c[h+24>>2]=u;c[h+12>>2]=h;c[h+8>>2]=h;break}r=u+8|0;y=c[r>>2]|0;Y=c[1310740]|0;if(u>>>0<Y>>>0){C=404;break L37}if(y>>>0<Y>>>0){C=405;break L37}c[y+12>>2]=z;c[r>>2]=z;c[h+8>>2]=y;c[h+12>>2]=u;c[h+24>>2]=0}}while(0);h=c[1310739]|0;if(h>>>0<=F>>>0){break}y=h-F|0;c[1310739]=y;h=c[1310742]|0;r=h;c[1310742]=r+F|0;c[r+(F+4|0)>>2]=y|1;c[h+4>>2]=F|3;E=h+8|0;C=364;break L215}}while(0);c[aH()>>2]=12;break}}while(0);if((C|0)==364){C=0;if((E|0)!=0){C=374;break}}h=(B=c[1310867]|0,c[1310867]=B+0,B);if((h|0)==0){C=372;break}aO[h&7]()}if((C|0)==70){ao();return 0;return 0}else if((C|0)==79){ao();return 0;return 0}else if((C|0)==85){ao();return 0;return 0}else if((C|0)==89){ao();return 0;return 0}else if((C|0)==90){ao();return 0;return 0}else if((C|0)==97){ao();return 0;return 0}else if((C|0)==48){ao();return 0;return 0}else if((C|0)==135){ao();return 0;return 0}else if((C|0)==144){ao();return 0;return 0}else if((C|0)==150){ao();return 0;return 0}else if((C|0)==154){ao();return 0;return 0}else if((C|0)==155){ao();return 0;return 0}else if((C|0)==162){ao();return 0;return 0}else if((C|0)==176){ao();return 0;return 0}else if((C|0)==192){ao();return 0;return 0}else if((C|0)==281){ao();return 0;return 0}else if((C|0)==290){ao();return 0;return 0}else if((C|0)==296){ao();return 0;return 0}else if((C|0)==300){ao();return 0;return 0}else if((C|0)==301){ao();return 0;return 0}else if((C|0)==307){ao();return 0;return 0}else if((C|0)==321){ao();return 0;return 0}else if((C|0)==342){ao();return 0;return 0}else if((C|0)==356){ao();return 0;return 0}else if((C|0)==372){F=ax(4)|0;c[F>>2]=5243424;an(F|0,5243456,4);return 0}else if((C|0)==374){return E|0}else if((C|0)==379){ao();return 0;return 0}else if((C|0)==380){ao();return 0;return 0}else if((C|0)==381){ao();return 0;return 0}else if((C|0)==382){ao();return 0;return 0}else if((C|0)==383){ao();return 0;return 0}else if((C|0)==384){ao();return 0;return 0}else if((C|0)==385){ao();return 0;return 0}else if((C|0)==386){ao();return 0;return 0}else if((C|0)==387){ao();return 0;return 0}else if((C|0)==388){ao();return 0;return 0}else if((C|0)==389){ao();return 0;return 0}else if((C|0)==390){ao();return 0;return 0}else if((C|0)==391){ao();return 0;return 0}else if((C|0)==392){ao();return 0;return 0}else if((C|0)==393){ao();return 0;return 0}else if((C|0)==394){ao();return 0;return 0}else if((C|0)==395){ao();return 0;return 0}else if((C|0)==396){ao();return 0;return 0}else if((C|0)==397){ao();return 0;return 0}else if((C|0)==398){ao();return 0;return 0}else if((C|0)==399){ao();return 0;return 0}else if((C|0)==400){ao();return 0;return 0}else if((C|0)==401){ao();return 0;return 0}else if((C|0)==402){ao();return 0;return 0}else if((C|0)==403){ao();return 0;return 0}else if((C|0)==404){ao();return 0;return 0}else if((C|0)==405){ao();return 0;return 0}return 0}function a3(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;b=a;if((a|0)==0){return}d=a-8|0;e=d;f=c[1310740]|0;if(d>>>0<f>>>0){ao()}g=c[a-4>>2]|0;a=g&3;if((a|0)==1){ao()}h=g&-8;i=b+(h-8|0)|0;j=i;L514:do{if((g&1|0)==0){k=c[d>>2]|0;if((a|0)==0){return}l=-8-k|0;m=b+l|0;n=m;o=k+h|0;if(m>>>0<f>>>0){ao()}if((n|0)==(c[1310741]|0)){p=b+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1310738]=o;c[p>>2]=c[p>>2]&-2;c[b+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[b+(l+8|0)>>2]|0;s=c[b+(l+12|0)>>2]|0;t=5242984+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<f>>>0){ao()}if((c[k+12>>2]|0)==(n|0)){break}ao()}}while(0);if((s|0)==(k|0)){c[1310736]=c[1310736]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<f>>>0){ao()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}ao()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[b+(l+24|0)>>2]|0;v=c[b+(l+12|0)>>2]|0;L548:do{if((v|0)==(t|0)){w=b+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=b+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L548}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<f>>>0){ao()}else{c[C>>2]=0;A=B;break}}else{w=c[b+(l+8|0)>>2]|0;if(w>>>0<f>>>0){ao()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){ao()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{ao()}}}while(0);if((p|0)==0){q=n;r=o;break}v=b+(l+28|0)|0;m=5243248+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1310737]=c[1310737]&(1<<c[v>>2]^-1);q=n;r=o;break L514}else{if(p>>>0<(c[1310740]|0)>>>0){ao()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L514}}}while(0);if(A>>>0<(c[1310740]|0)>>>0){ao()}c[A+24>>2]=p;t=c[b+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1310740]|0)>>>0){ao()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[b+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1310740]|0)>>>0){ao()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=e;r=h}}while(0);e=q;if(e>>>0>=i>>>0){ao()}A=b+(h-4|0)|0;f=c[A>>2]|0;if((f&1|0)==0){ao()}do{if((f&2|0)==0){if((j|0)==(c[1310742]|0)){B=(c[1310739]|0)+r|0;c[1310739]=B;c[1310742]=q;c[q+4>>2]=B|1;if((q|0)==(c[1310741]|0)){c[1310741]=0;c[1310738]=0}if(B>>>0<=(c[1310743]|0)>>>0){return}do{if((c[1310720]|0)==0){B=am(8)|0;if((B-1&B|0)==0){c[1310722]=B;c[1310721]=B;c[1310723]=-1;c[1310724]=2097152;c[1310725]=0;c[1310847]=0;c[1310720]=aK(0)&-16^1431655768;break}else{ao()}}}while(0);o=c[1310742]|0;if((o|0)==0){return}n=c[1310739]|0;do{if(n>>>0>40){l=c[1310722]|0;B=$(((((n-41|0)+l|0)>>>0)/(l>>>0)>>>0)-1|0,l);C=o;u=5243392;while(1){a=c[u>>2]|0;if(a>>>0<=C>>>0){if((a+(c[u+4>>2]|0)|0)>>>0>C>>>0){D=u;break}}a=c[u+8>>2]|0;if((a|0)==0){D=0;break}else{u=a}}if((c[D+12>>2]&8|0)!=0){break}u=aG(0)|0;C=D+4|0;if((u|0)!=((c[D>>2]|0)+(c[C>>2]|0)|0)){break}a=aG(-(B>>>0>2147483646?-2147483648-l|0:B)|0)|0;d=aG(0)|0;if(!((a|0)!=-1&d>>>0<u>>>0)){break}a=u-d|0;if((u|0)==(d|0)){break}c[C>>2]=(c[C>>2]|0)-a|0;c[1310844]=(c[1310844]|0)-a|0;C=c[1310742]|0;d=(c[1310739]|0)-a|0;a=C;u=C+8|0;if((u&7|0)==0){E=0}else{E=-u&7}u=d-E|0;c[1310742]=a+E|0;c[1310739]=u;c[a+(E+4|0)>>2]=u|1;c[a+(d+4|0)>>2]=40;c[1310743]=c[1310724]|0;return}}while(0);if((c[1310739]|0)>>>0<=(c[1310743]|0)>>>0){return}c[1310743]=-1;return}if((j|0)==(c[1310741]|0)){o=(c[1310738]|0)+r|0;c[1310738]=o;c[1310741]=q;c[q+4>>2]=o|1;c[e+o>>2]=o;return}o=(f&-8)+r|0;n=f>>>3;L648:do{if(f>>>0<256){d=c[b+h>>2]|0;a=c[b+(h|4)>>2]|0;u=5242984+(n<<1<<2)|0;do{if((d|0)!=(u|0)){if(d>>>0<(c[1310740]|0)>>>0){ao()}if((c[d+12>>2]|0)==(j|0)){break}ao()}}while(0);if((a|0)==(d|0)){c[1310736]=c[1310736]&(1<<n^-1);break}do{if((a|0)==(u|0)){F=a+8|0}else{if(a>>>0<(c[1310740]|0)>>>0){ao()}B=a+8|0;if((c[B>>2]|0)==(j|0)){F=B;break}ao()}}while(0);c[d+12>>2]=a;c[F>>2]=d}else{u=i;B=c[b+(h+16|0)>>2]|0;l=c[b+(h|4)>>2]|0;L650:do{if((l|0)==(u|0)){C=b+(h+12|0)|0;g=c[C>>2]|0;do{if((g|0)==0){t=b+(h+8|0)|0;p=c[t>>2]|0;if((p|0)==0){G=0;break L650}else{H=p;I=t;break}}else{H=g;I=C}}while(0);while(1){C=H+20|0;g=c[C>>2]|0;if((g|0)!=0){H=g;I=C;continue}C=H+16|0;g=c[C>>2]|0;if((g|0)==0){break}else{H=g;I=C}}if(I>>>0<(c[1310740]|0)>>>0){ao()}else{c[I>>2]=0;G=H;break}}else{C=c[b+h>>2]|0;if(C>>>0<(c[1310740]|0)>>>0){ao()}g=C+12|0;if((c[g>>2]|0)!=(u|0)){ao()}t=l+8|0;if((c[t>>2]|0)==(u|0)){c[g>>2]=l;c[t>>2]=C;G=l;break}else{ao()}}}while(0);if((B|0)==0){break}l=b+(h+20|0)|0;d=5243248+(c[l>>2]<<2)|0;do{if((u|0)==(c[d>>2]|0)){c[d>>2]=G;if((G|0)!=0){break}c[1310737]=c[1310737]&(1<<c[l>>2]^-1);break L648}else{if(B>>>0<(c[1310740]|0)>>>0){ao()}a=B+16|0;if((c[a>>2]|0)==(u|0)){c[a>>2]=G}else{c[B+20>>2]=G}if((G|0)==0){break L648}}}while(0);if(G>>>0<(c[1310740]|0)>>>0){ao()}c[G+24>>2]=B;u=c[b+(h+8|0)>>2]|0;do{if((u|0)!=0){if(u>>>0<(c[1310740]|0)>>>0){ao()}else{c[G+16>>2]=u;c[u+24>>2]=G;break}}}while(0);u=c[b+(h+12|0)>>2]|0;if((u|0)==0){break}if(u>>>0<(c[1310740]|0)>>>0){ao()}else{c[G+20>>2]=u;c[u+24>>2]=G;break}}}while(0);c[q+4>>2]=o|1;c[e+o>>2]=o;if((q|0)!=(c[1310741]|0)){J=o;break}c[1310738]=o;return}else{c[A>>2]=f&-2;c[q+4>>2]=r|1;c[e+r>>2]=r;J=r}}while(0);r=J>>>3;if(J>>>0<256){e=r<<1;f=5242984+(e<<2)|0;A=c[1310736]|0;G=1<<r;do{if((A&G|0)==0){c[1310736]=A|G;K=f;L=5242984+(e+2<<2)|0}else{r=5242984+(e+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1310740]|0)>>>0){K=h;L=r;break}ao()}}while(0);c[L>>2]=q;c[K+12>>2]=q;c[q+8>>2]=K;c[q+12>>2]=f;return}f=q;K=J>>>8;do{if((K|0)==0){M=0}else{if(J>>>0>16777215){M=31;break}L=(K+1048320|0)>>>16&8;e=K<<L;G=(e+520192|0)>>>16&4;A=e<<G;e=(A+245760|0)>>>16&2;r=(14-(G|L|e)|0)+(A<<e>>>15)|0;M=J>>>((r+7|0)>>>0)&1|r<<1}}while(0);K=5243248+(M<<2)|0;c[q+28>>2]=M;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1310737]|0;e=1<<M;do{if((r&e|0)==0){c[1310737]=r|e;c[K>>2]=f;c[q+24>>2]=K;c[q+12>>2]=q;c[q+8>>2]=q}else{if((M|0)==31){N=0}else{N=25-(M>>>1)|0}A=J<<N;L=c[K>>2]|0;while(1){if((c[L+4>>2]&-8|0)==(J|0)){break}O=L+16+(A>>>31<<2)|0;G=c[O>>2]|0;if((G|0)==0){P=554;break}else{A=A<<1;L=G}}if((P|0)==554){if(O>>>0<(c[1310740]|0)>>>0){ao()}else{c[O>>2]=f;c[q+24>>2]=L;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=L+8|0;o=c[A>>2]|0;G=c[1310740]|0;if(L>>>0<G>>>0){ao()}if(o>>>0<G>>>0){ao()}else{c[o+12>>2]=f;c[A>>2]=f;c[q+8>>2]=o;c[q+12>>2]=L;c[q+24>>2]=0;break}}}while(0);q=(c[1310744]|0)-1|0;c[1310744]=q;if((q|0)==0){Q=5243400}else{return}while(1){q=c[Q>>2]|0;if((q|0)==0){break}else{Q=q+8|0}}c[1310744]=-1;return}function a4(a){a=a|0;return 5242904}function a5(a){a=a|0;return}function a6(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function a7(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function a8(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function a9(a,b){a=a|0;b=b|0;aL[a&7](b|0)}function ba(a,b){a=a|0;b=b|0;return aM[a&7](b|0)|0}function bb(a,b,c){a=a|0;b=b|0;c=c|0;return aN[a&7](b|0,c|0)|0}function bc(a){a=a|0;aO[a&7]()}function bd(a){a=a|0;aa(0)}function be(a){a=a|0;aa(1);return 0}function bf(a,b){a=a|0;b=b|0;aa(2);return 0}function bg(){aa(3)}
// EMSCRIPTEN_END_FUNCS
var aL=[bd,bd,a3,bd,a5,bd,bd,bd];var aM=[be,be,be,be,be,be,a4,be];var aN=[bf,bf,bf,bf,bf,bf,bf,bf];var aO=[bg,bg,bg,bg,bg,bg,bg,bg];return{_strlen:a6,_memcpy:a8,_main:a1,_memset:a7,stackAlloc:aP,stackSave:aQ,stackRestore:aR,setThrew:aS,setTempRet0:aT,setTempRet1:aU,setTempRet2:aV,setTempRet3:aW,setTempRet4:aX,setTempRet5:aY,setTempRet6:aZ,setTempRet7:a_,setTempRet8:a$,setTempRet9:a0,dynCall_vi:a9,dynCall_ii:ba,dynCall_iii:bb,dynCall_v:bc}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, invoke_vi: invoke_vi, invoke_ii: invoke_ii, invoke_iii: invoke_iii, invoke_v: invoke_v, _malloc: _malloc, _sysconf: _sysconf, ___cxa_throw: ___cxa_throw, _abort: _abort, _fprintf: _fprintf, _printf: _printf, __reallyNegative: __reallyNegative, ___setErrNo: ___setErrNo, _fwrite: _fwrite, _llvm_eh_exception: _llvm_eh_exception, _write: _write, ___cxa_find_matching_catch: ___cxa_find_matching_catch, ___cxa_allocate_exception: ___cxa_allocate_exception, ___cxa_is_number_type: ___cxa_is_number_type, ___resumeException: ___resumeException, __formatString: __formatString, ___cxa_does_inherit: ___cxa_does_inherit, _free: _free, __ZSt18uncaught_exceptionv: __ZSt18uncaught_exceptionv, _pwrite: _pwrite, ___cxa_call_unexpected: ___cxa_call_unexpected, _sbrk: _sbrk, ___errno_location: ___errno_location, ___gxx_personality_v0: ___gxx_personality_v0, __ZNSt9exceptionD2Ev: __ZNSt9exceptionD2Ev, _time: _time, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, NaN: NaN, Infinity: Infinity, __ZTISt9exception: __ZTISt9exception, __ZTVN10__cxxabiv120__si_class_type_infoE: __ZTVN10__cxxabiv120__si_class_type_infoE }, buffer);
var _strlen = Module["_strlen"] = asm._strlen;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var _main = Module["_main"] = asm._main;
var _memset = Module["_memset"] = asm._memset;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
Runtime.stackAlloc = function(size) { return asm.stackAlloc(size) };
Runtime.stackSave = function() { return asm.stackSave() };
Runtime.stackRestore = function(top) { asm.stackRestore(top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
