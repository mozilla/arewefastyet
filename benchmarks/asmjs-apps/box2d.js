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
  Module['print'] = function() { };
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
STATICTOP += 9104;
assert(STATICTOP < TOTAL_MEMORY);
__ATINIT__ = __ATINIT__.concat([
]);
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,92,31,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,104,31,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,29,80,0,60,29,80,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,98,50,87,111,114,108,100,46,99,112,112,0,0,48,32,60,61,32,105,66,32,38,38,32,105,66,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,105,65,32,33,61,32,40,45,49,41,0,0,97,108,112,104,97,48,32,60,32,49,46,48,102,0,0,0,99,104,105,108,100,50,32,33,61,32,40,45,49,41,0,0,109,95,119,111,114,108,100,45,62,73,115,76,111,99,107,101,100,40,41,32,61,61,32,102,97,108,115,101,0,0,0,0,116,121,112,101,65,32,61,61,32,98,50,95,100,121,110,97,109,105,99,66,111,100,121,32,124,124,32,116,121,112,101,66,32,61,61,32,98,50,95,100,121,110,97,109,105,99,66,111,100,121,0,0,98,50,73,115,86,97,108,105,100,40,98,100,45,62,108,105,110,101,97,114,68,97,109,112,105,110,103,41,32,38,38,32,98,100,45,62,108,105,110,101,97,114,68,97,109,112,105,110,103,32,62,61,32,48,46,48,102,0,0,0,99,104,105,108,100,49,32,33,61,32,40,45,49,41,0,0,115,116,97,99,107,67,111,117,110,116,32,60,32,115,116,97,99,107,83,105,122,101,0,0,97,114,101,97,32,62,32,49,46,49,57,50,48,57,50,57,48,69,45,48,55,70,0,0,112,99,45,62,112,111,105,110,116,67,111,117,110,116,32,62,32,48,0,0,98,50,73,115,86,97,108,105,100,40,98,100,45,62,97,110,103,117,108,97,114,68,97,109,112,105,110,103,41,32,38,38,32,98,100,45,62,97,110,103,117,108,97,114,68,97,109,112,105,110,103,32,62,61,32,48,46,48,102,0,112,32,61,61,32,101,110,116,114,121,45,62,100,97,116,97,0,0,0,0,48,32,60,32,99,111,117,110,116,32,38,38,32,99,111,117,110,116,32,60,32,51,0,0,109,95,110,111,100,101,115,91,112,114,111,120,121,73,100,93,46,73,115,76,101,97,102,40,41,0,0,0,99,97,99,104,101,45,62,99,111,117,110,116,32,60,61,32,51,0,0,0,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,83,104,97,112,101,115,47,98,50,67,104,97,105,110,83,104,97,112,101,46,99,112,112,0,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,83,104,97,112,101,115,47,98,50,80,111,108,121,103,111,110,83,104,97,112,101,46,99,112,112,0,0,0,98,45,62,73,115,65,99,116,105,118,101,40,41,32,61,61,32,116,114,117,101,0,0,0,48,32,60,61,32,105,110,100,101,120,32,38,38,32,105,110,100,101,120,32,60,32,109,95,99,111,117,110,116,32,45,32,49,0,0,0,97,46,120,32,62,61,32,48,46,48,102,32,38,38,32,97,46,121,32,62,61,32,48,46,48,102,0,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,67,111,110,116,97,99,116,83,111,108,118,101,114,46,99,112,112,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,67,105,114,99,108,101,67,111,110,116,97,99,116,46,99,112,112,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,98,50,70,105,120,116,117,114,101,46,99,112,112,0,0,0,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,67,104,97,105,110,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,46,99,112,112,0,0,0,0,98,50,73,115,86,97,108,105,100,40,98,100,45,62,97,110,103,117,108,97,114,86,101,108,111,99,105,116,121,41,0,0,48,32,60,61,32,116,121,112,101,65,32,38,38,32,116,121,112,101,66,32,60,32,98,50,83,104,97,112,101,58,58,101,95,116,121,112,101,67,111,117,110,116,0,0,109,95,101,110,116,114,121,67,111,117,110,116,32,62,32,48,0,0,0,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,67,104,97,105,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,46,99,112,112,0,48,32,60,61,32,112,114,111,120,121,73,100,32,38,38,32,112,114,111,120,121,73,100,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,0,0,98,108,111,99,107,67,111,117,110,116,32,42,32,98,108,111,99,107,83,105,122,101,32,60,61,32,98,50,95,99,104,117,110,107,83,105,122,101,0,0,48,32,60,61,32,105,110,100,101,120,32,38,38,32,105,110,100,101,120,32,60,32,109,95,99,111,117,110,116,0,0,0,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,98,50,67,111,108,108,105,100,101,80,111,108,121,103,111,110,46,99,112,112,0,0,0,0,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,98,50,67,111,108,108,105,100,101,69,100,103,101,46,99,112,112,0,0,0,109,95,118,101,114,116,101,120,67,111,117,110,116,32,62,61,32,51,0,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,98,50,73,115,108,97,110,100,46,99,112,112,0,112,111,105,110,116,67,111,117,110,116,32,61,61,32,49,32,124,124,32,112,111,105,110,116,67,111,117,110,116,32,61,61,32,50,0,0,98,50,73,115,86,97,108,105,100,40,98,100,45,62,97,110,103,108,101,41,0,0,0,0,115,95,105,110,105,116,105,97,108,105,122,101,100,32,61,61,32,116,114,117,101,0,0,0,109,95,101,110,116,114,121,67,111,117,110,116,32,60,32,98,50,95,109,97,120,83,116,97,99,107,69,110,116,114,105,101,115,0,0,0,48,32,60,32,109,95,110,111,100,101,67,111,117,110,116,0,46,47,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,98,50,68,105,115,116,97,110,99,101,46,104,0,0,48,32,60,61,32,105,110,100,101,120,32,38,38,32,105,110,100,101,120,32,60,32,98,50,95,98,108,111,99,107,83,105,122,101,115,0,48,46,48,102,32,60,61,32,108,111,119,101,114,32,38,38,32,108,111,119,101,114,32,60,61,32,105,110,112,117,116,46,109,97,120,70,114,97,99,116,105,111,110,0,109,95,98,111,100,121,67,111,117,110,116,32,60,32,109,95,98,111,100,121,67,97,112,97,99,105,116,121,0,0,0,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,80,111,108,121,103,111,110,67,111,110,116,97,99,116,46,99,112,112,0,0,0,0,109,95,99,111,110,116,97,99,116,67,111,117,110,116,32,60,32,109,95,99,111,110,116,97,99,116,67,97,112,97,99,105,116,121,0,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,80,111,108,121,103,111,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,46,99,112,112,0,0,0,109,95,106,111,105,110,116,67,111,117,110,116,32,60,32,109,95,106,111,105,110,116,67,97,112,97,99,105,116,121,0,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,69,100,103,101,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,46,99,112,112,0,46,47,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,98,50,73,115,108,97,110,100,46,104,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,69,100,103,101,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,46,99,112,112,0,0,109,97,110,105,102,111,108,100,45,62,112,111,105,110,116,67,111,117,110,116,32,62,32,48,0,0,0,0,109,95,102,105,120,116,117,114,101,66,45,62,71,101,116,84,121,112,101,40,41,32,61,61,32,98,50,83,104,97,112,101,58,58,101,95,99,105,114,99,108,101,0,0,109,95,102,105,120,116,117,114,101,66,45,62,71,101,116,84,121,112,101,40,41,32,61,61,32,98,50,83,104,97,112,101,58,58,101,95,112,111,108,121,103,111,110,0,46,47,66,111,120,50,68,47,67,111,109,109,111,110,47,98,50,77,97,116,104,46,104,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,67,111,110,116,97,99,116,115,47,98,50,67,111,110,116,97,99,116,46,99,112,112,0,0,0,116,111,105,73,110,100,101,120,66,32,60,32,109,95,98,111,100,121,67,111,117,110,116,0,66,111,120,50,68,47,68,121,110,97,109,105,99,115,47,98,50,66,111,100,121,46,99,112,112,0,0,0,98,100,45,62,108,105,110,101,97,114,86,101,108,111,99,105,116,121,46,73,115,86,97,108,105,100,40,41,0,0,0,0,48,32,60,61,32,116,121,112,101,50,32,38,38,32,116,121,112,101,50,32,60,32,98,50,83,104,97,112,101,58,58,101,95,116,121,112,101,67,111,117,110,116,0,0,109,95,101,110,116,114,121,67,111,117,110,116,32,61,61,32,48,0,0,0,66,111,120,50,68,47,67,111,109,109,111,110,47,98,50,83,116,97,99,107,65,108,108,111,99,97,116,111,114,46,99,112,112,0,0,0,48,32,60,61,32,110,111,100,101,73,100,32,38,38,32,110,111,100,101,73,100,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,48,32,60,32,115,105,122,101,0,0,0,0,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,98,50,84,105,109,101,79,102,73,109,112,97,99,116,46,99,112,112,0,0,73,115,76,111,99,107,101,100,40,41,32,61,61,32,102,97,108,115,101,0,46,47,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,98,50,68,121,110,97,109,105,99,84,114,101,101,46,104,0,0,0,109,95,110,111,100,101,115,91,66,45,62,112,97,114,101,110,116,93,46,99,104,105,108,100,50,32,61,61,32,105,65,0,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,98,50,68,121,110,97,109,105,99,84,114,101,101,46,99,112,112,0,0,0,48,32,60,61,32,105,69,32,38,38,32,105,69,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,66,111,120,50,68,47,67,111,108,108,105,115,105,111,110,47,98,50,68,105,115,116,97,110,99,101,46,99,112,112,0,0,112,111,105,110,116,67,111,117,110,116,32,62,32,48,0,0,109,95,102,105,120,116,117,114,101,65,45,62,71,101,116,84,121,112,101,40,41,32,61,61,32,98,50,83,104,97,112,101,58,58,101,95,99,105,114,99,108,101,0,0,109,95,102,105,120,116,117,114,101,65,45,62,71,101,116,84,121,112,101,40,41,32,61,61,32,98,50,83,104,97,112,101,58,58,101,95,99,104,97,105,110,0,0,0,48,32,60,61,32,105,68,32,38,38,32,105,68,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,48,32,60,61,32,101,100,103,101,49,32,38,38,32,101,100,103,101,49,32,60,32,112,111,108,121,49,45,62,109,95,118,101,114,116,101,120,67,111,117,110,116,0,0,100,101,110,32,62,32,48,46,48,102,0,0,116,111,105,73,110,100,101,120,65,32,60,32,109,95,98,111,100,121,67,111,117,110,116,0,109,95,110,111,100,101,115,91,67,45,62,112,97,114,101,110,116,93,46,99,104,105,108,100,50,32,61,61,32,105,65,0,102,97,108,115,101,0,0,0,109,95,102,105,120,116,117,114,101,65,45,62,71,101,116,84,121,112,101,40,41,32,61,61,32,98,50,83,104,97,112,101,58,58,101,95,112,111,108,121,103,111,110,0,109,95,102,105,120,116,117,114,101,65,45,62,71,101,116,84,121,112,101,40,41,32,61,61,32,98,50,83,104,97,112,101,58,58,101,95,101,100,103,101,0,0,0,0,48,32,60,61,32,116,121,112,101,49,32,38,38,32,116,121,112,101,49,32,60,32,98,50,83,104,97,112,101,58,58,101,95,116,121,112,101,67,111,117,110,116,0,0,98,100,45,62,112,111,115,105,116,105,111,110,46,73,115,86,97,108,105,100,40,41,0,0,109,95,73,32,62,32,48,46,48,102,0,0,109,95,105,110,100,101,120,32,61,61,32,48,0,0,0,0,48,32,60,61,32,105,71,32,38,38,32,105,71,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,116,97,114,103,101,116,32,62,32,116,111,108,101,114,97,110,99,101,0,0,66,111,120,50,68,47,67,111,109,109,111,110,47,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,46,99,112,112,0,0,0,109,95,110,111,100,101,67,111,117,110,116,32,61,61,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,0,48,32,60,61,32,105,110,100,101,120,32,38,38,32,105,110,100,101,120,32,60,32,99,104,97,105,110,45,62,109,95,99,111,117,110,116,0,0,0,0,106,32,60,32,98,50,95,98,108,111,99,107,83,105,122,101,115,0,0,0,48,32,60,61,32,105,70,32,38,38,32,105,70,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,109,95,116,121,112,101,32,61,61,32,98,50,95,100,121,110,97,109,105,99,66,111,100,121,0,0,0,0,48,32,60,61,32,105,67,32,38,38,32,105,67,32,60,32,109,95,110,111,100,101,67,97,112,97,99,105,116,121,0,0,102,114,97,109,101,32,97,118,101,114,97,103,101,115,58,32,37,46,51,102,32,43,45,32,37,46,51,102,10,0,0,0,101,114,114,111,114,58,32,37,100,92,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,108,111,97,116,51,50,32,98,50,83,105,109,112,108,101,120,58,58,71,101,116,77,101,116,114,105,99,40,41,32,99,111,110,115,116,0,0,0,0,118,111,105,100,32,98,50,83,105,109,112,108,101,120,58,58,71,101,116,87,105,116,110,101,115,115,80,111,105,110,116,115,40,98,50,86,101,99,50,32,42,44,32,98,50,86,101,99,50,32,42,41,32,99,111,110,115,116,0,0,98,50,86,101,99,50,32,98,50,83,105,109,112,108,101,120,58,58,71,101,116,67,108,111,115,101,115,116,80,111,105,110,116,40,41,32,99,111,110,115,116,0,0,0,102,108,111,97,116,51,50,32,98,50,83,101,112,97,114,97,116,105,111,110,70,117,110,99,116,105,111,110,58,58,69,118,97,108,117,97,116,101,40,105,110,116,51,50,44,32,105,110,116,51,50,44,32,102,108,111,97,116,51,50,41,32,99,111,110,115,116,0,102,108,111,97,116,51,50,32,98,50,83,101,112,97,114,97,116,105,111,110,70,117,110,99,116,105,111,110,58,58,70,105,110,100,77,105,110,83,101,112,97,114,97,116,105,111,110,40,105,110,116,51,50,32,42,44,32,105,110,116,51,50,32,42,44,32,102,108,111,97,116,51,50,41,32,99,111,110,115,116,0,0,0,0,99,111,110,115,116,32,98,50,86,101,99,50,32,38,98,50,68,105,115,116,97,110,99,101,80,114,111,120,121,58,58,71,101,116,86,101,114,116,101,120,40,105,110,116,51,50,41,32,99,111,110,115,116,0,0,0,118,105,114,116,117,97,108,32,98,111,111,108,32,98,50,80,111,108,121,103,111,110,83,104,97,112,101,58,58,82,97,121,67,97,115,116,40,98,50,82,97,121,67,97,115,116,79,117,116,112,117,116,32,42,44,32,99,111,110,115,116,32,98,50,82,97,121,67,97,115,116,73,110,112,117,116,32,38,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,44,32,105,110,116,51,50,41,32,99,111,110,115,116,0,0,0,118,105,114,116,117,97,108,32,118,111,105,100,32,98,50,80,111,108,121,103,111,110,83,104,97,112,101,58,58,67,111,109,112,117,116,101,77,97,115,115,40,98,50,77,97,115,115,68,97,116,97,32,42,44,32,102,108,111,97,116,51,50,41,32,99,111,110,115,116,0,0,0,118,111,105,100,32,42,98,50,68,121,110,97,109,105,99,84,114,101,101,58,58,71,101,116,85,115,101,114,68,97,116,97,40,105,110,116,51,50,41,32,99,111,110,115,116,0,0,0,99,111,110,115,116,32,98,50,65,65,66,66,32,38,98,50,68,121,110,97,109,105,99,84,114,101,101,58,58,71,101,116,70,97,116,65,65,66,66,40,105,110,116,51,50,41,32,99,111,110,115,116,0,0,0,0,118,111,105,100,32,98,50,67,104,97,105,110,83,104,97,112,101,58,58,71,101,116,67,104,105,108,100,69,100,103,101,40,98,50,69,100,103,101,83,104,97,112,101,32,42,44,32,105,110,116,51,50,41,32,99,111,110,115,116,0,118,111,105,100,32,98,50,83,105,109,112,108,101,120,58,58,82,101,97,100,67,97,99,104,101,40,99,111,110,115,116,32,98,50,83,105,109,112,108,101,120,67,97,99,104,101,32,42,44,32,99,111,110,115,116,32,98,50,68,105,115,116,97,110,99,101,80,114,111,120,121,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,44,32,99,111,110,115,116,32,98,50,68,105,115,116,97,110,99,101,80,114,111,120,121,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,41,0,0,0,118,111,105,100,32,98,50,70,105,120,116,117,114,101,58,58,68,101,115,116,114,111,121,40,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,32,42,41,0,115,116,97,116,105,99,32,118,111,105,100,32,98,50,67,111,110,116,97,99,116,58,58,68,101,115,116,114,111,121,40,98,50,67,111,110,116,97,99,116,32,42,44,32,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,32,42,41,0,115,116,97,116,105,99,32,98,50,67,111,110,116,97,99,116,32,42,98,50,67,111,110,116,97,99,116,58,58,67,114,101,97,116,101,40,98,50,70,105,120,116,117,114,101,32,42,44,32,105,110,116,51,50,44,32,98,50,70,105,120,116,117,114,101,32,42,44,32,105,110,116,51,50,44,32,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,32,42,41,0,118,111,105,100,32,98,50,73,115,108,97,110,100,58,58,83,111,108,118,101,84,79,73,40,99,111,110,115,116,32,98,50,84,105,109,101,83,116,101,112,32,38,44,32,105,110,116,51,50,44,32,105,110,116,51,50,41,0,0,0,118,111,105,100,32,98,50,73,115,108,97,110,100,58,58,65,100,100,40,98,50,67,111,110,116,97,99,116,32,42,41,0,118,111,105,100,32,98,50,73,115,108,97,110,100,58,58,65,100,100,40,98,50,74,111,105,110,116,32,42,41,0,0,0,118,111,105,100,32,98,50,73,115,108,97,110,100,58,58,65,100,100,40,98,50,66,111,100,121,32,42,41,0,0,0,0,118,111,105,100,32,98,50,87,111,114,108,100,58,58,83,111,108,118,101,84,79,73,40,99,111,110,115,116,32,98,50,84,105,109,101,83,116,101,112,32,38,41,0,0,118,111,105,100,32,98,50,87,111,114,108,100,58,58,83,111,108,118,101,40,99,111,110,115,116,32,98,50,84,105,109,101,83,116,101,112,32,38,41,0,98,50,66,111,100,121,32,42,98,50,87,111,114,108,100,58,58,67,114,101,97,116,101,66,111,100,121,40,99,111,110,115,116,32,98,50,66,111,100,121,68,101,102,32,42,41,0,0,118,111,105,100,32,98,50,83,119,101,101,112,58,58,65,100,118,97,110,99,101,40,102,108,111,97,116,51,50,41,0,0,98,50,66,111,100,121,58,58,98,50,66,111,100,121,40,99,111,110,115,116,32,98,50,66,111,100,121,68,101,102,32,42,44,32,98,50,87,111,114,108,100,32,42,41,0,0,0,0,118,111,105,100,32,98,50,66,111,100,121,58,58,82,101,115,101,116,77,97,115,115,68,97,116,97,40,41,0,0,0,0,98,50,70,105,120,116,117,114,101,32,42,98,50,66,111,100,121,58,58,67,114,101,97,116,101,70,105,120,116,117,114,101,40,99,111,110,115,116,32,98,50,70,105,120,116,117,114,101,68,101,102,32,42,41,0,0,98,50,80,111,108,121,103,111,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,58,58,98,50,80,111,108,121,103,111,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,40,98,50,70,105,120,116,117,114,101,32,42,44,32,98,50,70,105,120,116,117,114,101,32,42,41,0,0,118,111,105,100,32,98,50,80,111,115,105,116,105,111,110,83,111,108,118,101,114,77,97,110,105,102,111,108,100,58,58,73,110,105,116,105,97,108,105,122,101,40,98,50,67,111,110,116,97,99,116,80,111,115,105,116,105,111,110,67,111,110,115,116,114,97,105,110,116,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,44,32,105,110,116,51,50,41,0,0,0,98,50,67,104,97,105,110,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,58,58,98,50,67,104,97,105,110,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,40,98,50,70,105,120,116,117,114,101,32,42,44,32,105,110,116,51,50,44,32,98,50,70,105,120,116,117,114,101,32,42,44,32,105,110,116,51,50,41,0,0,98,50,69,100,103,101,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,58,58,98,50,69,100,103,101,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,40,98,50,70,105,120,116,117,114,101,32,42,44,32,98,50,70,105,120,116,117,114,101,32,42,41,0,0,98,50,67,104,97,105,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,58,58,98,50,67,104,97,105,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,40,98,50,70,105,120,116,117,114,101,32,42,44,32,105,110,116,51,50,44,32,98,50,70,105,120,116,117,114,101,32,42,44,32,105,110,116,51,50,41,0,0,0,0,98,50,69,100,103,101,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,58,58,98,50,69,100,103,101,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,40,98,50,70,105,120,116,117,114,101,32,42,44,32,98,50,70,105,120,116,117,114,101,32,42,41,0,0,0,0,102,108,111,97,116,51,50,32,98,50,83,101,112,97,114,97,116,105,111,110,70,117,110,99,116,105,111,110,58,58,73,110,105,116,105,97,108,105,122,101,40,99,111,110,115,116,32,98,50,83,105,109,112,108,101,120,67,97,99,104,101,32,42,44,32,99,111,110,115,116,32,98,50,68,105,115,116,97,110,99,101,80,114,111,120,121,32,42,44,32,99,111,110,115,116,32,98,50,83,119,101,101,112,32,38,44,32,99,111,110,115,116,32,98,50,68,105,115,116,97,110,99,101,80,114,111,120,121,32,42,44,32,99,111,110,115,116,32,98,50,83,119,101,101,112,32,38,44,32,102,108,111,97,116,51,50,41,0,0,0,98,50,83,116,97,99,107,65,108,108,111,99,97,116,111,114,58,58,126,98,50,83,116,97,99,107,65,108,108,111,99,97,116,111,114,40,41,0,0,0,118,111,105,100,32,42,98,50,83,116,97,99,107,65,108,108,111,99,97,116,111,114,58,58,65,108,108,111,99,97,116,101,40,105,110,116,51,50,41,0,118,111,105,100,32,98,50,83,116,97,99,107,65,108,108,111,99,97,116,111,114,58,58,70,114,101,101,40,118,111,105,100,32,42,41,0,98,50,80,111,108,121,103,111,110,67,111,110,116,97,99,116,58,58,98,50,80,111,108,121,103,111,110,67,111,110,116,97,99,116,40,98,50,70,105,120,116,117,114,101,32,42,44,32,98,50,70,105,120,116,117,114,101,32,42,41,0,0,0,0,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,58,58,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,40,41,0,0,0,0,118,111,105,100,32,42,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,58,58,65,108,108,111,99,97,116,101,40,105,110,116,51,50,41,0,118,111,105,100,32,98,50,66,108,111,99,107,65,108,108,111,99,97,116,111,114,58,58,70,114,101,101,40,118,111,105,100,32,42,44,32,105,110,116,51,50,41,0,0,118,111,105,100,32,98,50,68,105,115,116,97,110,99,101,80,114,111,120,121,58,58,83,101,116,40,99,111,110,115,116,32,98,50,83,104,97,112,101,32,42,44,32,105,110,116,51,50,41,0,0,0,98,50,67,111,110,116,97,99,116,83,111,108,118,101,114,58,58,98,50,67,111,110,116,97,99,116,83,111,108,118,101,114,40,98,50,67,111,110,116,97,99,116,83,111,108,118,101,114,68,101,102,32,42,41,0,0,118,111,105,100,32,98,50,67,111,110,116,97,99,116,83,111,108,118,101,114,58,58,73,110,105,116,105,97,108,105,122,101,86,101,108,111,99,105,116,121,67,111,110,115,116,114,97,105,110,116,115,40,41,0,0,0,118,111,105,100,32,98,50,67,111,110,116,97,99,116,83,111,108,118,101,114,58,58,83,111,108,118,101,86,101,108,111,99,105,116,121,67,111,110,115,116,114,97,105,110,116,115,40,41,0,0,0,0,98,50,67,105,114,99,108,101,67,111,110,116,97,99,116,58,58,98,50,67,105,114,99,108,101,67,111,110,116,97,99,116,40,98,50,70,105,120,116,117,114,101,32,42,44,32,98,50,70,105,120,116,117,114,101,32,42,41,0,0,98,111,111,108,32,98,50,68,121,110,97,109,105,99,84,114,101,101,58,58,77,111,118,101,80,114,111,120,121,40,105,110,116,51,50,44,32,99,111,110,115,116,32,98,50,65,65,66,66,32,38,44,32,99,111,110,115,116,32,98,50,86,101,99,50,32,38,41,0,0,0,0,118,111,105,100,32,98,50,68,121,110,97,109,105,99,84,114,101,101,58,58,70,114,101,101,78,111,100,101,40,105,110,116,51,50,41,0,105,110,116,51,50,32,98,50,68,121,110,97,109,105,99,84,114,101,101,58,58,66,97,108,97,110,99,101,40,105,110,116,51,50,41,0,105,110,116,51,50,32,98,50,68,121,110,97,109,105,99,84,114,101,101,58,58,65,108,108,111,99,97,116,101,78,111,100,101,40,41,0,118,111,105,100,32,98,50,68,121,110,97,109,105,99,84,114,101,101,58,58,73,110,115,101,114,116,76,101,97,102,40,105,110,116,51,50,41,0,0,0,118,111,105,100,32,98,50,70,105,110,100,73,110,99,105,100,101,110,116,69,100,103,101,40,98,50,67,108,105,112,86,101,114,116,101,120,32,42,44,32,99,111,110,115,116,32,98,50,80,111,108,121,103,111,110,83,104,97,112,101,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,44,32,105,110,116,51,50,44,32,99,111,110,115,116,32,98,50,80,111,108,121,103,111,110,83,104,97,112,101,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,41,0,0,0,0,102,108,111,97,116,51,50,32,98,50,69,100,103,101,83,101,112,97,114,97,116,105,111,110,40,99,111,110,115,116,32,98,50,80,111,108,121,103,111,110,83,104,97,112,101,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,44,32,105,110,116,51,50,44,32,99,111,110,115,116,32,98,50,80,111,108,121,103,111,110,83,104,97,112,101,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,41,0,0,0,118,111,105,100,32,98,50,67,111,108,108,105,100,101,69,100,103,101,65,110,100,67,105,114,99,108,101,40,98,50,77,97,110,105,102,111,108,100,32,42,44,32,99,111,110,115,116,32,98,50,69,100,103,101,83,104,97,112,101,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,44,32,99,111,110,115,116,32,98,50,67,105,114,99,108,101,83,104,97,112,101,32,42,44,32,99,111,110,115,116,32,98,50,84,114,97,110,115,102,111,114,109,32,38,41,0,118,111,105,100,32,98,50,84,105,109,101,79,102,73,109,112,97,99,116,40,98,50,84,79,73,79,117,116,112,117,116,32,42,44,32,99,111,110,115,116,32,98,50,84,79,73,73,110,112,117,116,32,42,41,0,0,118,111,105,100,32,98,50,68,105,115,116,97,110,99,101,40,98,50,68,105,115,116,97,110,99,101,79,117,116,112,117,116,32,42,44,32,98,50,83,105,109,112,108,101,120,67,97,99,104,101,32,42,44,32,99,111,110,115,116,32,98,50,68,105,115,116,97,110,99,101,73,110,112,117,116,32,42,41,0,0,0,0,0,0,128,31,80,0,108,0,0,0,116,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,144,31,80,0,146,0,0,0,64,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,156,31,80,0,104,0,0,0,22,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,168,31,80,0,18,0,0,0,2,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,180,31,80,0,152,0,0,0,150,0,0,0,148,0,0,0,0,0,0,0,0,0,0,0,192,31,80,0,92,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,204,31,80,0,50,0,0,0,144,0,0,0,112,0,0,0,84,0,0,0,70,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,212,31,80,0,52,0,0,0,128,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,224,31,80,0,136,0,0,0,14,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,232,31,80,0,10,0,0,0,96,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,244,31,80,0,48,0,0,0,114,0,0,0,78,0,0,0,42,0,0,0,98,0,0,0,80,0,0,0,44,0,0,0,102,0,0,0,0,0,0,0,0,0,0,0,0,32,80,0,120,0,0,0,106,0,0,0,46,0,0,0,34,0,0,0,60,0,0,0,68,0,0,0,32,0,0,0,36,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,57,98,50,67,111,110,116,97,99,116,0,0,55,98,50,83,104,97,112,101,0,0,0,0,50,53,98,50,80,111,108,121,103,111,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,0,50,52,98,50,67,104,97,105,110,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,0,0,50,51,98,50,69,100,103,101,65,110,100,80,111,108,121,103,111,110,67,111,110,116,97,99,116,0,0,0,50,51,98,50,67,104,97,105,110,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,0,0,0,50,50,98,50,69,100,103,101,65,110,100,67,105,114,99,108,101,67,111,110,116,97,99,116,0,0,0,0,49,55,98,50,67,111,110,116,97,99,116,76,105,115,116,101,110,101,114,0,49,54,98,50,80,111,108,121,103,111,110,67,111,110,116,97,99,116,0,0,49,53,98,50,67,111,110,116,97,99,116,70,105,108,116,101,114,0,0,0,49,53,98,50,67,105,114,99,108,101,67,111,110,116,97,99,116,0,0,0,49,52,98,50,80,111,108,121,103,111,110,83,104,97,112,101,0,0,0,0,49,49,98,50,69,100,103,101,83,104,97,112,101,0,0,0,0,0,0,0,188,29,80,0,0,0,0,0,204,29,80,0,104,31,80,0,0,0,0,0,244,29,80,0,116,31,80,0,0,0,0,0,24,30,80,0,84,31,80,0,0,0,0,0,60,30,80,0,0,0,0,0,72,30,80,0,0,0,0,0,84,30,80,0,128,31,80,0,0,0,0,0,112,30,80,0,128,31,80,0,0,0,0,0,140,30,80,0,128,31,80,0,0,0,0,0,168,30,80,0,128,31,80,0,0,0,0,0,196,30,80,0,128,31,80,0,0,0,0,0,224,30,80,0,0,0,0,0,244,30,80,0,128,31,80,0,0,0,0,0,8,31,80,0,0,0,0,0,28,31,80,0,128,31,80,0,0,0,0,0,48,31,80,0,136,31,80,0,0,0,0,0,68,31,80,0,136,31,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,32,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,1,0,0,64,1,0,0,128,1,0,0,192,1,0,0,0,2,0,0,128,2,0,0,0,0,0,0], "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(8))>>2)]=(66);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(12))>>2)]=(62);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(16))>>2)]=(94);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(20))>>2)]=(140);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(24))>>2)]=(72);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(28))>>2)]=(74);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(32))>>2)]=(142);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(36))>>2)]=(88);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(8))>>2)]=(66);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(12))>>2)]=(28);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(16))>>2)]=(94);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(20))>>2)]=(140);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(24))>>2)]=(72);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(28))>>2)]=(118);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(32))>>2)]=(76);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(36))>>2)]=(38);
HEAP32[((5250900)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5250908)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5250920)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5250932)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5250944)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5250952)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5250960)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5250972)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5250984)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5250996)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5251008)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5251020)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5251028)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5251040)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5251048)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5251060)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5251072)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
}
if (!awaitingMemoryInitializer) runPostSets();
  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }
  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      Runtime.stackRestore(ret);
    }
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
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000/1000));
    }
  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }
  var _sqrtf=Math.sqrt;
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  var _sinf=Math.sin;
  var _cosf=Math.cos;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var _floorf=Math.floor;
  var _llvm_memset_p0i8_i64=_memset;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
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
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
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
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var Math_min = Math.min;
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module.dynCall_iiiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module.dynCall_viiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module.dynCall_vi(index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module.dynCall_vii(index,a1,a2);
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
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module.dynCall_iiii(index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module.dynCall_viii(index,a1,a2,a3);
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
function invoke_viif(index,a1,a2,a3) {
  try {
    Module.dynCall_viif(index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module.dynCall_viiiiii(index,a1,a2,a3,a4,a5,a6);
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
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module.dynCall_viiii(index,a1,a2,a3,a4);
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
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var n=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.copyTempDouble;var af=env.copyTempFloat;var ag=env.min;var ah=env.invoke_iiiiii;var ai=env.invoke_viiiii;var aj=env.invoke_vi;var ak=env.invoke_vii;var al=env.invoke_ii;var am=env.invoke_iiii;var an=env.invoke_viii;var ao=env.invoke_v;var ap=env.invoke_viif;var aq=env.invoke_viiiiii;var ar=env.invoke_iii;var as=env.invoke_viiii;var at=env._llvm_lifetime_end;var au=env._cosf;var av=env._floorf;var aw=env._abort;var ax=env._fprintf;var ay=env._printf;var az=env.__reallyNegative;var aA=env._sqrtf;var aB=env._llvm_stackrestore;var aC=env._clock;var aD=env.___setErrNo;var aE=env._fwrite;var aF=env._write;var aG=env._exit;var aH=env._sysconf;var aI=env.___cxa_pure_virtual;var aJ=env.__formatString;var aK=env.__ZSt9terminatev;var aL=env._sinf;var aM=env.___assert_func;var aN=env._pwrite;var aO=env._sbrk;var aP=env._llvm_stacksave;var aQ=env.___errno_location;var aR=env.___gxx_personality_v0;var aS=env._llvm_lifetime_start;var aT=env._time;var aU=env.__exit;
// EMSCRIPTEN_START_FUNCS
function a5(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function a6(){return i|0}function a7(a){a=a|0;i=a}function a8(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function a9(a){a=a|0;D=a}function ba(a){a=a|0;E=a}function bb(a){a=a|0;F=a}function bc(a){a=a|0;G=a}function bd(a){a=a|0;H=a}function be(a){a=a|0;I=a}function bf(a){a=a|0;J=a}function bg(a){a=a|0;K=a}function bh(a){a=a|0;L=a}function bi(a){a=a|0;M=a}function bj(a){a=a|0;return}function bk(a){a=a|0;return}function bl(a){a=a|0;return 1}function bm(a,b,c){a=a|0;b=b|0;c=c|0;return 0}function bn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0.0,h=0.0,i=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0;f=+g[d+12>>2];h=+g[a+12>>2];i=+g[d+8>>2];j=+g[a+16>>2];l=+g[d>>2];m=l+(f*h-i*j);n=+g[d+4>>2];o=h*i+f*j+n;j=+g[a+20>>2];h=+g[a+24>>2];p=l+(f*j-i*h);l=n+(i*j+f*h);h=+g[a+8>>2];a=b;d=(g[k>>2]=(m<p?m:p)-h,c[k>>2]|0);e=(g[k>>2]=(o<l?o:l)-h,c[k>>2]|0)|0;c[a>>2]=0|d;c[a+4>>2]=e;e=b+8|0;b=(g[k>>2]=h+(m>p?m:p),c[k>>2]|0);a=(g[k>>2]=h+(o>l?o:l),c[k>>2]|0)|0;c[e>>2]=0|b;c[e+4>>2]=a;return}function bo(a,b,d){a=a|0;b=b|0;d=+d;var e=0,f=0;g[b>>2]=0.0;d=(+g[a+16>>2]+ +g[a+24>>2])*.5;e=b+4|0;f=(g[k>>2]=(+g[a+12>>2]+ +g[a+20>>2])*.5,c[k>>2]|0);a=(g[k>>2]=d,c[k>>2]|0)|0;c[e>>2]=0|f;c[e+4>>2]=a;g[b+12>>2]=0.0;return}function bp(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0,s=0.0,t=0.0;d=i;e=c[1312995]|0;f=i;i=i+(e*4&-1)|0;i=i+3>>2<<2;if((e|0)>0){h=0;j=0.0}else{k=+(e|0);g[a>>2]=0.0/k;l=0.0;m=k;n=l/m;o=+P(+n);p=a+4|0;g[p>>2]=o;i=d;return}while(1){k=+((c[b+(h<<2)>>2]|0)>>>0>>>0)/1.0e3*1.0e3;g[f+(h<<2)>>2]=k;q=j+k;r=h+1|0;if((r|0)<(e|0)){h=r;j=q}else{break}}j=+(e|0);k=q/j;g[a>>2]=k;q=0.0;h=0;while(1){s=+g[f+(h<<2)>>2]-k;t=q+s*s;b=h+1|0;if((b|0)<(e|0)){q=t;h=b}else{l=t;m=j;break}}n=l/m;o=+P(+n);p=a+4|0;g[p>>2]=o;i=d;return}function bq(b,d){b=b|0;d=d|0;var e=0,f=0,h=0;e=bB(d,48)|0;if((e|0)==0){f=0}else{c[e>>2]=5250456;c[e+4>>2]=1;g[e+8>>2]=.009999999776482582;c1(e+28|0,0,18);f=e}c[f+4>>2]=c[b+4>>2]|0;g[f+8>>2]=+g[b+8>>2];e=b+12|0;d=f+12|0;h=c[e+4>>2]|0;c[d>>2]=c[e>>2]|0;c[d+4>>2]=h;h=b+20|0;d=f+20|0;e=c[h+4>>2]|0;c[d>>2]=c[h>>2]|0;c[d+4>>2]=e;e=b+28|0;d=f+28|0;h=c[e+4>>2]|0;c[d>>2]=c[e>>2]|0;c[d+4>>2]=h;h=b+36|0;d=f+36|0;e=c[h+4>>2]|0;c[d>>2]=c[h>>2]|0;c[d+4>>2]=e;a[f+44|0]=a[b+44|0]&1;a[f+45|0]=a[b+45|0]&1;return f|0}function br(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0.0,i=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0;h=+g[e>>2];i=+g[d>>2]-h;j=+g[e+4>>2];l=+g[d+4>>2]-j;m=+g[e+12>>2];n=+g[e+8>>2];o=i*m+l*n;p=-0.0-n;q=m*l+i*p;i=+g[d+8>>2]-h;h=+g[d+12>>2]-j;j=m*i+n*h-o;n=i*p+m*h-q;e=a+12|0;f=c[e+4>>2]|0;h=(c[k>>2]=c[e>>2]|0,+g[k>>2]);m=(c[k>>2]=f,+g[k>>2]);f=a+20|0;a=c[f+4>>2]|0;p=(c[k>>2]=c[f>>2]|0,+g[k>>2]);i=p-h;p=(c[k>>2]=a,+g[k>>2])-m;l=-0.0-i;r=i*i+p*p;s=+P(+r);if(s<1.1920928955078125e-7){t=p;u=l}else{v=1.0/s;t=p*v;u=v*l}l=(m-q)*u+(h-o)*t;v=n*u+j*t;if(v==0.0){w=0;return w|0}s=l/v;if(s<0.0){w=0;return w|0}if(+g[d+16>>2]<s|r==0.0){w=0;return w|0}v=(i*(o+j*s-h)+p*(q+n*s-m))/r;if(v<0.0|v>1.0){w=0;return w|0}g[b+8>>2]=s;if(l>0.0){d=b;a=(g[k>>2]=-0.0-t,c[k>>2]|0);f=(g[k>>2]=-0.0-u,c[k>>2]|0)|0;c[d>>2]=0|a;c[d+4>>2]=f;w=1;return w|0}else{f=b;b=(g[k>>2]=t,c[k>>2]|0);d=(g[k>>2]=u,c[k>>2]|0)|0;c[f>>2]=0|b;c[f+4>>2]=d;w=1;return w|0}return 0}function bs(a){a=a|0;if((a|0)==0){return}c_(a);return}function bt(d,e){d=d|0;e=e|0;var f=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0.0,P=0,Q=0.0,R=0.0,S=0,T=0,U=0,V=0,W=0;f=i;i=i+103396|0;h=f|0;j=f+28|0;l=f+56|0;m=f+103084|0;n=f+103136|0;o=f+103184|0;p=f+103336|0;q=f+103388|0;do{if((d|0)>1){r=a[c[e+4>>2]|0]|0;if((r|0)==53){c[1312995]=5661;s=640;break}else if((r|0)==49){c[1312995]=35;s=5;break}else if((r|0)==50){c[1312995]=161;s=32;break}else if((r|0)==51){t=43;break}else if((r|0)==52){c[1312995]=2331;s=320;break}else if((r|0)==48){v=0;i=f;return v|0}else{ay(5246132,(u=i,i=i+4|0,c[u>>2]=r-48|0,u)|0);v=-1;i=f;return v|0}}else{t=43}}while(0);if((t|0)==43){c[1312995]=333;s=64}e=l|0;d=l+8|0;c[d>>2]=128;c[l+4>>2]=0;r=cZ(1024)|0;c[l>>2]=r;c1(r|0,0,c[d>>2]<<3|0);c1(l+12|0,0,56);d=0;r=1;while(1){if((d|0)>=14){t=49;break}if((r|0)>(c[5251924+(d<<2)>>2]|0)){w=d+1|0;a[r+5251280|0]=w&255;x=w}else{a[r+5251280|0]=d&255;x=d}w=r+1|0;if((w|0)<641){d=x;r=w}else{break}}if((t|0)==49){aM(5245880,73,5249004,5245988);return 0}c[l+102468>>2]=0;c[l+102472>>2]=0;c[l+102476>>2]=0;c[l+102864>>2]=0;c[l+102872>>2]=-1;r=l+102884|0;c[r>>2]=16;c[l+102880>>2]=0;x=cZ(576)|0;d=l+102876|0;c[d>>2]=x;c1(x|0,0,(c[r>>2]|0)*36&-1|0);x=(c[r>>2]|0)-1|0;L70:do{if((x|0)>0){w=0;while(1){y=w+1|0;c[(c[d>>2]|0)+(w*36&-1)+20>>2]=y;c[(c[d>>2]|0)+(w*36&-1)+32>>2]=-1;z=(c[r>>2]|0)-1|0;if((y|0)<(z|0)){w=y}else{A=z;break L70}}}else{A=x}}while(0);c[(c[d>>2]|0)+(A*36&-1)+20>>2]=-1;c[(c[d>>2]|0)+(((c[r>>2]|0)-1|0)*36&-1)+32>>2]=-1;c1(l+102888|0,0,16);c[l+102920>>2]=16;c[l+102924>>2]=0;c[l+102916>>2]=cZ(192)|0;c[l+102908>>2]=16;c[l+102912>>2]=0;c[l+102904>>2]=cZ(64)|0;c[l+102932>>2]=0;c[l+102936>>2]=0;c[l+102940>>2]=5242940;c[l+102944>>2]=5242936;r=l+102948|0;c[l+102980>>2]=0;c[l+102984>>2]=0;c1(r|0,0,20);a[l+102992|0]=1;a[l+102993|0]=1;a[l+102994|0]=0;a[l+102995|0]=1;d=l+102976|0;a[d]=1;A=l+102968|0;c[A>>2]=0;c[A+4>>2]=-1054867456;A=l+102868|0;c[A>>2]=4;g[l+102988>>2]=0.0;c[r>>2]=e;c1(l+102996|0,0,32);a[d]=0;c[m+44>>2]=0;c1(m+4|0,0,32);a[m+36|0]=1;a[m+37|0]=1;a[m+38|0]=0;a[m+39|0]=0;c[m>>2]=0;a[m+40|0]=1;g[m+48>>2]=1.0;d=bB(e,152)|0;if((d|0)==0){B=0}else{r=d;bC(r,m,l);B=r}c[B+92>>2]=0;r=l+102952|0;c[B+96>>2]=c[r>>2]|0;m=c[r>>2]|0;if((m|0)!=0){c[m+92>>2]=B}c[r>>2]=B;m=l+102960|0;c[m>>2]=(c[m>>2]|0)+1|0;c[n>>2]=5250456;c[n+4>>2]=1;g[n+8>>2]=.009999999776482582;c1(n+28|0,0,18);d=n+12|0;c[d>>2]=-1038090240;c[d+4>>2]=0;d=n+20|0;c[d>>2]=1109393408;c[d+4>>2]=0;a[n+44|0]=0;a[n+45|0]=0;b[j+22>>1]=1;b[j+24>>1]=-1;b[j+26>>1]=0;c[j+4>>2]=0;g[j+8>>2]=.20000000298023224;g[j+12>>2]=0.0;a[j+20|0]=0;c[j>>2]=n|0;g[j+16>>2]=0.0;bF(B,j);c[o>>2]=5250412;c[o+4>>2]=2;g[o+8>>2]=.009999999776482582;c[o+148>>2]=4;g[o+20>>2]=-.5;g[o+24>>2]=-.5;g[o+28>>2]=.5;g[o+32>>2]=-.5;g[o+36>>2]=.5;g[o+40>>2]=.5;g[o+44>>2]=-.5;g[o+48>>2]=.5;g[o+84>>2]=0.0;g[o+88>>2]=-1.0;g[o+92>>2]=1.0;g[o+96>>2]=0.0;g[o+100>>2]=0.0;g[o+104>>2]=1.0;g[o+108>>2]=-1.0;g[o+112>>2]=0.0;g[o+12>>2]=0.0;g[o+16>>2]=0.0;j=p+44|0;B=p+36|0;n=p+4|0;d=p+37|0;x=p+38|0;w=p+39|0;z=p|0;y=p+40|0;C=p+48|0;D=p+4|0;E=o|0;o=h+22|0;F=h+24|0;G=h+26|0;H=h|0;I=h+4|0;J=h+8|0;K=h+12|0;L=h+16|0;M=h+20|0;N=.75;O=-7.0;P=0;L82:while(1){Q=N;R=O;S=P;while(1){c[j>>2]=0;c1(n|0,0,32);a[B]=1;a[d]=1;a[x]=0;a[w]=0;a[y]=1;g[C>>2]=1.0;c[z>>2]=2;T=(g[k>>2]=R,c[k>>2]|0);U=(g[k>>2]=Q,c[k>>2]|0)|0;c[D>>2]=0|T;c[D+4>>2]=U;if((c[A>>2]&2|0)!=0){t=65;break L82}U=bB(e,152)|0;if((U|0)==0){V=0}else{T=U;bC(T,p,l);V=T}c[V+92>>2]=0;c[V+96>>2]=c[r>>2]|0;T=c[r>>2]|0;if((T|0)!=0){c[T+92>>2]=V}c[r>>2]=V;c[m>>2]=(c[m>>2]|0)+1|0;b[o>>1]=1;b[F>>1]=-1;b[G>>1]=0;c[I>>2]=0;g[J>>2]=.20000000298023224;g[K>>2]=0.0;a[M]=0;c[H>>2]=E;g[L>>2]=5.0;bF(V,h);T=S+1|0;if((T|0)<40){Q=Q+0.0;R=R+1.125;S=T}else{break}}S=P+1|0;if((S|0)<40){N=N+1.0;O=O+.5625;P=S}else{W=0;break}}if((t|0)==65){aM(5242944,109,5247908,5245200);return 0}while(1){bT(l);t=W+1|0;if((t|0)<(s|0)){W=t}else{break}}W=c[1312995]|0;s=aP()|0;t=i;i=i+(W*4&-1)|0;i=i+3>>2<<2;L103:do{if((W|0)>0){P=0;while(1){h=aC()|0;bT(l);c[t+(P<<2)>>2]=(aC()|0)-h|0;h=P+1|0;if((h|0)<(c[1312995]|0)){P=h}else{break L103}}}}while(0);bp(q,t);O=+g[q+4>>2];ay(5246100,(u=i,i=i+16|0,g[k>>2]=+g[q>>2],c[u>>2]=c[k>>2]|0,c[u+4>>2]=c[k+4>>2]|0,g[k>>2]=O,c[u+8>>2]=c[k>>2]|0,c[u+12>>2]=c[k+4>>2]|0,u)|0);aB(s|0);bS(l);v=0;i=f;return v|0}function bu(a){a=a|0;return 1}function bv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0.0,f=0.0,h=0.0,i=0.0,j=0.0,k=0.0,l=0,m=0;e=+g[d>>2]- +g[b>>2];f=+g[d+4>>2]- +g[b+4>>2];h=+g[b+12>>2];i=+g[b+8>>2];j=e*h+f*i;k=h*f+e*(-0.0-i);b=c[a+148>>2]|0;d=0;while(1){if((d|0)>=(b|0)){l=1;m=103;break}if((j- +g[a+20+(d<<3)>>2])*+g[a+84+(d<<3)>>2]+(k- +g[a+20+(d<<3)+4>>2])*+g[a+84+(d<<3)+4>>2]>0.0){l=0;m=104;break}else{d=d+1|0}}if((m|0)==103){return l|0}else if((m|0)==104){return l|0}return 0}function bw(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0.0,h=0.0,i=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0,x=0.0,y=0.0,z=0.0,A=0.0;f=+g[d+12>>2];h=+g[a+20>>2];i=+g[d+8>>2];j=+g[a+24>>2];l=+g[d>>2];m=l+(f*h-i*j);n=+g[d+4>>2];o=h*i+f*j+n;d=c[a+148>>2]|0;L120:do{if((d|0)>1){j=o;h=m;p=o;q=m;e=1;while(1){r=+g[a+20+(e<<3)>>2];s=+g[a+20+(e<<3)+4>>2];t=l+(f*r-i*s);u=r*i+f*s+n;s=h<t?h:t;r=j<u?j:u;v=q>t?q:t;t=p>u?p:u;w=e+1|0;if((w|0)<(d|0)){j=r;h=s;p=t;q=v;e=w}else{x=r;y=s;z=t;A=v;break L120}}}else{x=o;y=m;z=o;A=m}}while(0);m=+g[a+8>>2];a=b;d=(g[k>>2]=y-m,c[k>>2]|0);e=(g[k>>2]=x-m,c[k>>2]|0)|0;c[a>>2]=0|d;c[a+4>>2]=e;e=b+8|0;b=(g[k>>2]=A+m,c[k>>2]|0);a=(g[k>>2]=z+m,c[k>>2]|0)|0;c[e>>2]=0|b;c[e+4>>2]=a;return}function bx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=bB(b,152)|0;if((d|0)==0){e=0}else{c[d>>2]=5250412;c[d+4>>2]=2;g[d+8>>2]=.009999999776482582;c[d+148>>2]=0;g[d+12>>2]=0.0;g[d+16>>2]=0.0;e=d}c[e+4>>2]=c[a+4>>2]|0;g[e+8>>2]=+g[a+8>>2];d=a+12|0;b=e+12|0;f=c[d+4>>2]|0;c[b>>2]=c[d>>2]|0;c[b+4>>2]=f;c0(e+20|0,a+20|0,64);c0(e+84|0,a+84|0,64);c[e+148>>2]=c[a+148>>2]|0;return e|0}function by(a){a=a|0;if((a|0)==0){return}c_(a);return}function bz(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0.0,i=0.0,j=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0,u=0.0,v=0.0,w=0,x=0.0,y=0,z=0.0;h=+g[e>>2];i=+g[d>>2]-h;j=+g[e+4>>2];l=+g[d+4>>2]-j;f=e+12|0;m=+g[f>>2];n=e+8|0;o=+g[n>>2];p=i*m+l*o;q=-0.0-o;r=m*l+i*q;i=+g[d+8>>2]-h;h=+g[d+12>>2]-j;j=m*i+o*h-p;o=i*q+m*h-r;h=+g[d+16>>2];d=c[a+148>>2]|0;m=0.0;e=0;s=-1;q=h;L134:while(1){if((e|0)>=(d|0)){t=127;break}i=+g[a+84+(e<<3)>>2];l=+g[a+84+(e<<3)+4>>2];u=(+g[a+20+(e<<3)>>2]-p)*i+(+g[a+20+(e<<3)+4>>2]-r)*l;v=j*i+o*l;L137:do{if(v==0.0){if(u<0.0){w=0;t=134;break L134}else{x=m;y=s;z=q}}else{do{if(v<0.0){if(u>=m*v){break}x=u/v;y=e;z=q;break L137}}while(0);if(v<=0.0){x=m;y=s;z=q;break}if(u>=q*v){x=m;y=s;z=q;break}x=m;y=s;z=u/v}}while(0);if(z<x){w=0;t=135;break}else{m=x;e=e+1|0;s=y;q=z}}if((t|0)==134){return w|0}else if((t|0)==135){return w|0}else if((t|0)==127){if(m<0.0|m>h){aM(5243468,249,5246968,5244368);return 0}if((s|0)<=-1){w=0;return w|0}g[b+8>>2]=m;m=+g[f>>2];h=+g[a+84+(s<<3)>>2];z=+g[n>>2];q=+g[a+84+(s<<3)+4>>2];s=b;b=(g[k>>2]=m*h-z*q,c[k>>2]|0);a=(g[k>>2]=h*z+m*q,c[k>>2]|0)|0;c[s>>2]=0|b;c[s+4>>2]=a;w=1;return w|0}return 0}function bA(a,b,d){a=a|0;b=b|0;d=+d;var e=0,f=0.0,h=0.0,i=0,j=0.0,l=0.0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0;e=c[a+148>>2]|0;if((e|0)>2){f=0.0;h=0.0;i=0}else{aM(5243468,306,5247084,5244116)}while(1){j=h+ +g[a+20+(i<<3)>>2];l=f+ +g[a+20+(i<<3)+4>>2];m=i+1|0;if((m|0)<(e|0)){f=l;h=j;i=m}else{break}}h=1.0/+(e|0);f=j*h;j=l*h;i=a+20|0;m=a+24|0;h=0.0;l=0.0;n=0;o=0.0;p=0.0;while(1){q=+g[a+20+(n<<3)>>2]-f;r=+g[a+20+(n<<3)+4>>2]-j;s=n+1|0;t=(s|0)<(e|0);if(t){u=a+20+(s<<3)|0;v=a+20+(s<<3)+4|0}else{u=i;v=m}w=+g[u>>2]-f;x=+g[v>>2]-j;y=q*x-r*w;z=y*.5;A=p+z;B=z*.3333333432674408;C=l+(q+w)*B;D=h+(r+x)*B;E=o+y*.0833333358168602*(w*w+(q*q+q*w)+(x*x+(r*r+r*x)));if(t){h=D;l=C;n=s;o=E;p=A}else{break}}p=A*d;g[b>>2]=p;if(A>1.1920928955078125e-7){o=1.0/A;A=C*o;C=D*o;o=f+A;f=j+C;n=b+4|0;v=(g[k>>2]=o,c[k>>2]|0);u=(g[k>>2]=f,c[k>>2]|0)|0;c[n>>2]=0|v;c[n+4>>2]=u;g[b+12>>2]=E*d+p*(o*o+f*f-(A*A+C*C));return}else{aM(5243468,352,5247084,5243232)}}function bB(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((d|0)==0){e=0;return e|0}if((d|0)<=0){aM(5245880,104,5249044,5245152);return 0}if((d|0)>640){e=cZ(d)|0;return e|0}f=a[d+5251280|0]|0;d=f&255;if((f&255)>=14){aM(5245880,112,5249044,5244332);return 0}f=b+12+(d<<2)|0;g=c[f>>2]|0;if((g|0)!=0){c[f>>2]=c[g>>2]|0;e=g;return e|0}g=b+4|0;h=c[g>>2]|0;i=b+8|0;j=b|0;if((h|0)==(c[i>>2]|0)){b=c[j>>2]|0;k=h+128|0;c[i>>2]=k;i=cZ(k<<3)|0;c[j>>2]=i;k=b;c0(i|0,k|0,c[g>>2]<<3|0);c1((c[j>>2]|0)+(c[g>>2]<<3)|0,0,1024);c_(k);l=c[g>>2]|0}else{l=h}h=c[j>>2]|0;j=cZ(16384)|0;k=h+(l<<3)+4|0;c[k>>2]=j;i=c[5251924+(d<<2)>>2]|0;c[h+(l<<3)>>2]=i;l=16384/(i|0)&-1;if(($(l,i)|0)>=16385){aM(5245880,140,5249044,5243968);return 0}h=l-1|0;L197:do{if((h|0)>0){l=0;d=j;while(1){b=d+$(l,i)|0;m=l+1|0;c[b>>2]=d+$(m,i)|0;b=c[k>>2]|0;if((m|0)==(h|0)){n=b;break L197}else{l=m;d=b}}}else{n=j}}while(0);c[n+$(h,i)>>2]=0;c[f>>2]=c[c[k>>2]>>2]|0;c[g>>2]=(c[g>>2]|0)+1|0;e=c[k>>2]|0;return e|0}function bC(d,e,f){d=d|0;e=e|0;f=f|0;var h=0,i=0.0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,u=0;h=e+4|0;i=+g[h>>2];if(!(i==i&!(C=0.0,C!=C)&i>+-p&i<+p)){aM(5244952,27,5247988,5245776)}i=+g[e+8>>2];if(!(i==i&!(C=0.0,C!=C)&i>+-p&i<+p)){aM(5244952,27,5247988,5245776)}j=e+16|0;i=+g[j>>2];if(!(i==i&!(C=0.0,C!=C)&i>+-p&i<+p)){aM(5244952,28,5247988,5244980)}i=+g[e+20>>2];if(!(i==i&!(C=0.0,C!=C)&i>+-p&i<+p)){aM(5244952,28,5247988,5244980)}k=e+12|0;i=+g[k>>2];if(!(i==i&!(C=0.0,C!=C)&i>+-p&i<+p)){aM(5244952,29,5247988,5244200)}l=e+24|0;i=+g[l>>2];if(!(i==i&!(C=0.0,C!=C)&i>+-p&i<+p)){aM(5244952,30,5247988,5243776)}m=e+32|0;i=+g[m>>2];if(i<0.0|i==i&!(C=0.0,C!=C)&i>+-p&i<+p^1){aM(5244952,31,5247988,5243276)}n=e+28|0;i=+g[n>>2];if(i<0.0|i==i&!(C=0.0,C!=C)&i>+-p&i<+p^1){aM(5244952,32,5247988,5243132)}o=d+4|0;b[o>>1]=0;if((a[e+39|0]&1)<<24>>24==0){q=0}else{b[o>>1]=8;q=8}if((a[e+38|0]&1)<<24>>24==0){r=q}else{s=q|16;b[o>>1]=s;r=s}if((a[e+36|0]&1)<<24>>24==0){t=r}else{s=r|4;b[o>>1]=s;t=s}if((a[e+37|0]&1)<<24>>24==0){u=t}else{s=t|2;b[o>>1]=s;u=s}if((a[e+40|0]&1)<<24>>24!=0){b[o>>1]=u|32}c[d+88>>2]=f;f=h;h=d+12|0;u=c[f>>2]|0;o=c[f+4>>2]|0;c[h>>2]=u;c[h+4>>2]=o;i=+g[k>>2];g[d+20>>2]=+S(+i);g[d+24>>2]=+R(+i);g[d+28>>2]=0.0;g[d+32>>2]=0.0;h=d+36|0;c[h>>2]=u;c[h+4>>2]=o;h=d+44|0;c[h>>2]=u;c[h+4>>2]=o;g[d+52>>2]=+g[k>>2];g[d+56>>2]=+g[k>>2];g[d+60>>2]=0.0;c[d+108>>2]=0;c[d+112>>2]=0;c[d+92>>2]=0;c[d+96>>2]=0;k=j;j=d+64|0;o=c[k+4>>2]|0;c[j>>2]=c[k>>2]|0;c[j+4>>2]=o;g[d+72>>2]=+g[l>>2];g[d+132>>2]=+g[n>>2];g[d+136>>2]=+g[m>>2];g[d+140>>2]=+g[e+48>>2];g[d+76>>2]=0.0;g[d+80>>2]=0.0;g[d+84>>2]=0.0;g[d+144>>2]=0.0;m=c[e>>2]|0;c[d>>2]=m;n=d+116|0;if((m|0)==2){g[n>>2]=1.0;g[d+120>>2]=1.0;m=d+124|0;g[m>>2]=0.0;l=d+128|0;g[l>>2]=0.0;o=e+44|0;j=c[o>>2]|0;k=d+148|0;c[k>>2]=j;h=d+100|0;c[h>>2]=0;u=d+104|0;c[u>>2]=0;return}else{g[n>>2]=0.0;g[d+120>>2]=0.0;m=d+124|0;g[m>>2]=0.0;l=d+128|0;g[l>>2]=0.0;o=e+44|0;j=c[o>>2]|0;k=d+148|0;c[k>>2]=j;h=d+100|0;c[h>>2]=0;u=d+104|0;c[u>>2]=0;return}}function bD(a){a=a|0;return}function bE(a){a=a|0;return}function bF(d,e){d=d|0;e=e|0;var f=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0.0,N=0.0,O=0.0,P=0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0;f=i;i=i+16|0;h=f|0;j=d+88|0;l=c[j>>2]|0;if((c[l+102868>>2]&2|0)!=0){aM(5244952,153,5248068,5243048)}m=l|0;l=bB(m,44)|0;if((l|0)==0){n=0}else{b[l+32>>1]=1;b[l+34>>1]=-1;b[l+36>>1]=0;c[l+40>>2]=0;c[l+24>>2]=0;c[l+28>>2]=0;c1(l|0,0,16);n=l}c[n+40>>2]=c[e+4>>2]|0;g[n+16>>2]=+g[e+8>>2];g[n+20>>2]=+g[e+12>>2];l=n+8|0;c[l>>2]=d;o=n+4|0;c[o>>2]=0;c0(n+32|0,e+22|0,6);a[n+38|0]=a[e+20|0]&1;p=c[e>>2]|0;q=a3[c[(c[p>>2]|0)+8>>2]&255](p,m)|0;p=n+12|0;c[p>>2]=q;r=aZ[c[(c[q>>2]|0)+12>>2]&255](q)|0;q=bB(m,r*28&-1)|0;m=n+24|0;c[m>>2]=q;L256:do{if((r|0)>0){c[q+16>>2]=0;c[(c[m>>2]|0)+24>>2]=-1;if((r|0)==1){break}else{s=1}while(1){c[(c[m>>2]|0)+(s*28&-1)+16>>2]=0;c[(c[m>>2]|0)+(s*28&-1)+24>>2]=-1;t=s+1|0;if((t|0)==(r|0)){break L256}else{s=t}}}}while(0);s=n+28|0;c[s>>2]=0;r=n|0;g[r>>2]=+g[e+16>>2];e=d+4|0;L261:do{if((b[e>>1]&32)<<16>>16!=0){q=c[j>>2]|0;t=d+12|0;u=c[p>>2]|0;v=aZ[c[(c[u>>2]|0)+12>>2]&255](u)|0;c[s>>2]=v;if((v|0)<=0){break}v=q+102872|0;u=q+102876|0;w=q+102900|0;x=q+102912|0;y=q+102908|0;z=q+102904|0;q=0;while(1){A=c[m>>2]|0;B=A+(q*28&-1)|0;C=c[p>>2]|0;a4[c[(c[C>>2]|0)+24>>2]&255](C,B|0,t,q);C=bY(v)|0;D=+g[A+(q*28&-1)+4>>2]+-.10000000149011612;E=(c[u>>2]|0)+(C*36&-1)|0;F=(g[k>>2]=+g[B>>2]+-.10000000149011612,c[k>>2]|0);G=(g[k>>2]=D,c[k>>2]|0)|0;c[E>>2]=0|F;c[E+4>>2]=G;D=+g[A+(q*28&-1)+12>>2]+.10000000149011612;G=(c[u>>2]|0)+(C*36&-1)+8|0;E=(g[k>>2]=+g[A+(q*28&-1)+8>>2]+.10000000149011612,c[k>>2]|0);F=(g[k>>2]=D,c[k>>2]|0)|0;c[G>>2]=0|E;c[G+4>>2]=F;c[(c[u>>2]|0)+(C*36&-1)+16>>2]=B;c[(c[u>>2]|0)+(C*36&-1)+32>>2]=0;bZ(v,C);c[w>>2]=(c[w>>2]|0)+1|0;B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){F=c[z>>2]|0;c[y>>2]=B<<1;G=cZ(B<<3)|0;c[z>>2]=G;E=F;c0(G|0,E|0,c[x>>2]<<2|0);c_(E);H=c[x>>2]|0}else{H=B}c[(c[z>>2]|0)+(H<<2)>>2]=C;c[x>>2]=(c[x>>2]|0)+1|0;c[A+(q*28&-1)+24>>2]=C;c[A+(q*28&-1)+16>>2]=n;c[A+(q*28&-1)+20>>2]=q;A=q+1|0;if((A|0)<(c[s>>2]|0)){q=A}else{break L261}}}}while(0);s=d+100|0;c[o>>2]=c[s>>2]|0;c[s>>2]=n;n=d+104|0;c[n>>2]=(c[n>>2]|0)+1|0;c[l>>2]=d;if(+g[r>>2]<=0.0){I=c[j>>2]|0;J=I+102868|0;K=c[J>>2]|0;L=K|1;c[J>>2]=L;i=f;return}r=d+116|0;l=d+120|0;n=d+124|0;o=d+128|0;H=d+28|0;g[H>>2]=0.0;g[d+32>>2]=0.0;c1(r|0,0,16);p=c[d>>2]|0;if((p|0)==0|(p|0)==1){m=d+12|0;q=d+36|0;x=c[m>>2]|0;z=c[m+4>>2]|0;c[q>>2]=x;c[q+4>>2]=z;q=d+44|0;c[q>>2]=x;c[q+4>>2]=z;g[d+52>>2]=+g[d+56>>2];I=c[j>>2]|0;J=I+102868|0;K=c[J>>2]|0;L=K|1;c[J>>2]=L;i=f;return}else if((p|0)==2){p=c[s>>2]|0;do{if((p|0)==0){M=0.0;N=0.0;O=0.0;P=227}else{s=h|0;z=h+4|0;q=h+8|0;x=h+12|0;D=0.0;Q=0.0;m=p;R=0.0;S=0.0;while(1){T=+g[m>>2];if(T==0.0){U=Q;V=D;W=R;X=S}else{y=c[m+12>>2]|0;a1[c[(c[y>>2]|0)+28>>2]&255](y,h,T);T=+g[s>>2];Y=T+ +g[r>>2];g[r>>2]=Y;Z=Q+T*+g[z>>2];_=D+T*+g[q>>2];T=+g[x>>2]+ +g[n>>2];g[n>>2]=T;U=Z;V=_;W=Y;X=T}y=c[m+4>>2]|0;if((y|0)==0){break}else{D=V;Q=U;m=y;R=W;S=X}}if(W<=0.0){M=X;N=U;O=V;P=227;break}S=1.0/W;g[l>>2]=S;$=U*S;aa=V*S;ab=W;ac=X;break}}while(0);if((P|0)==227){g[r>>2]=1.0;g[l>>2]=1.0;$=N;aa=O;ab=1.0;ac=M}do{if(ac>0.0){if((b[e>>1]&16)<<16>>16!=0){P=233;break}M=ac-(aa*aa+$*$)*ab;g[n>>2]=M;if(M>0.0){ad=1.0/M;break}else{aM(5244952,319,5248036,5245800)}}else{P=233}}while(0);if((P|0)==233){g[n>>2]=0.0;ad=0.0}g[o>>2]=ad;o=d+44|0;n=c[o+4>>2]|0;ad=(c[k>>2]=c[o>>2]|0,+g[k>>2]);ab=(c[k>>2]=n,+g[k>>2]);n=H;H=(g[k>>2]=$,c[k>>2]|0);P=(g[k>>2]=aa,c[k>>2]|0)|0;c[n>>2]=0|H;c[n+4>>2]=P;ac=+g[d+24>>2];M=+g[d+20>>2];O=+g[d+12>>2]+(ac*$-M*aa);N=$*M+ac*aa+ +g[d+16>>2];P=(g[k>>2]=O,c[k>>2]|0);n=0|P;P=(g[k>>2]=N,c[k>>2]|0)|0;c[o>>2]=n;c[o+4>>2]=P;o=d+36|0;c[o>>2]=n;c[o+4>>2]=P;aa=+g[d+72>>2];P=d+64|0;g[P>>2]=+g[P>>2]+(N-ab)*(-0.0-aa);P=d+68|0;g[P>>2]=aa*(O-ad)+ +g[P>>2];I=c[j>>2]|0;J=I+102868|0;K=c[J>>2]|0;L=K|1;c[J>>2]=L;i=f;return}else{aM(5244952,284,5248036,5246040)}}function bG(d,e){d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0,m=0;f=e+48|0;h=e+52|0;i=c[(c[f>>2]|0)+8>>2]|0;j=c[(c[h>>2]|0)+8>>2]|0;k=c[d+72>>2]|0;do{if((k|0)!=0){if((c[e+4>>2]&2|0)==0){break}aY[c[(c[k>>2]|0)+12>>2]&255](k,e)}}while(0);k=e+8|0;l=c[k>>2]|0;m=e+12|0;if((l|0)!=0){c[l+12>>2]=c[m>>2]|0}l=c[m>>2]|0;if((l|0)!=0){c[l+8>>2]=c[k>>2]|0}k=d+60|0;if((c[k>>2]|0)==(e|0)){c[k>>2]=c[m>>2]|0}m=e+24|0;k=c[m>>2]|0;l=e+28|0;if((k|0)!=0){c[k+12>>2]=c[l>>2]|0}k=c[l>>2]|0;if((k|0)!=0){c[k+8>>2]=c[m>>2]|0}m=i+112|0;if((e+16|0)==(c[m>>2]|0)){c[m>>2]=c[l>>2]|0}l=e+40|0;m=c[l>>2]|0;i=e+44|0;if((m|0)!=0){c[m+12>>2]=c[i>>2]|0}m=c[i>>2]|0;if((m|0)!=0){c[m+8>>2]=c[l>>2]|0}l=j+112|0;if((e+32|0)==(c[l>>2]|0)){c[l>>2]=c[i>>2]|0}i=c[d+76>>2]|0;if(!(a[5251084]|0)){aM(5244888,103,5247508,5244224)}do{if((c[e+124>>2]|0)>0){l=c[(c[f>>2]|0)+8>>2]|0;j=l+4|0;m=b[j>>1]|0;if((m&2)<<16>>16==0){b[j>>1]=m|2;g[l+144>>2]=0.0}l=c[(c[h>>2]|0)+8>>2]|0;m=l+4|0;j=b[m>>1]|0;if((j&2)<<16>>16!=0){break}b[m>>1]=j|2;g[l+144>>2]=0.0}}while(0);l=c[(c[(c[f>>2]|0)+12>>2]|0)+4>>2]|0;f=c[(c[(c[h>>2]|0)+12>>2]|0)+4>>2]|0;if((l|0)>-1&(f|0)<4){aY[c[5251088+(l*48&-1)+(f*12&-1)+4>>2]&255](e,i);i=d+64|0;c[i>>2]=(c[i>>2]|0)-1|0;return}else{aM(5244888,114,5247508,5243808)}}function bH(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=c[a>>2]|0;e=c[b>>2]|0;if((d|0)<(e|0)){f=1;return f|0}if((d|0)!=(e|0)){f=0;return f|0}f=(c[a+4>>2]|0)<(c[b+4>>2]|0);return f|0}function bI(d,e){d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;f=i;i=i+1040|0;h=f|0;j=f+1036|0;k=d+52|0;c[k>>2]=0;l=d+40|0;m=c[l>>2]|0;do{if((m|0)>0){n=d+32|0;o=d+56|0;p=d+12|0;q=d+4|0;r=h+4|0;s=h|0;t=h+1028|0;u=h+1032|0;v=d|0;w=d+48|0;x=d+44|0;y=0;z=m;while(1){A=c[(c[n>>2]|0)+(y<<2)>>2]|0;c[o>>2]=A;if((A|0)==-1){B=z}else{if((A|0)<=-1){C=355;break}if((c[p>>2]|0)<=(A|0)){C=356;break}D=c[q>>2]|0;c[s>>2]=r;c[u>>2]=256;c[r>>2]=c[v>>2]|0;c[t>>2]=1;E=D+(A*36&-1)|0;F=D+(A*36&-1)+4|0;G=D+(A*36&-1)+8|0;H=D+(A*36&-1)+12|0;A=1;D=r;while(1){I=A-1|0;c[t>>2]=I;J=c[D+(I<<2)>>2]|0;do{if((J|0)==-1){K=I}else{L=c[q>>2]|0;if(+g[E>>2]- +g[L+(J*36&-1)+8>>2]>0.0|+g[F>>2]- +g[L+(J*36&-1)+12>>2]>0.0|+g[L+(J*36&-1)>>2]- +g[G>>2]>0.0|+g[L+(J*36&-1)+4>>2]- +g[H>>2]>0.0){K=I;break}M=L+(J*36&-1)+24|0;if((c[M>>2]|0)==-1){N=c[o>>2]|0;if((N|0)==(J|0)){K=I;break}O=c[k>>2]|0;if((O|0)==(c[w>>2]|0)){P=c[x>>2]|0;c[w>>2]=O<<1;Q=cZ(O*24&-1)|0;c[x>>2]=Q;R=P;c0(Q|0,R|0,(c[k>>2]|0)*12&-1|0);c_(R);S=c[o>>2]|0;T=c[k>>2]|0}else{S=N;T=O}c[(c[x>>2]|0)+(T*12&-1)>>2]=(S|0)>(J|0)?J:S;O=c[o>>2]|0;c[(c[x>>2]|0)+((c[k>>2]|0)*12&-1)+4>>2]=(O|0)<(J|0)?J:O;c[k>>2]=(c[k>>2]|0)+1|0;K=c[t>>2]|0;break}do{if((I|0)==(c[u>>2]|0)){c[u>>2]=I<<1;O=cZ(I<<3)|0;c[s>>2]=O;N=D;c0(O|0,N|0,c[t>>2]<<2|0);if((D|0)==(r|0)){break}c_(N)}}while(0);c[(c[s>>2]|0)+(c[t>>2]<<2)>>2]=c[M>>2]|0;N=(c[t>>2]|0)+1|0;c[t>>2]=N;O=L+(J*36&-1)+28|0;do{if((N|0)==(c[u>>2]|0)){R=c[s>>2]|0;c[u>>2]=N<<1;Q=cZ(N<<3)|0;c[s>>2]=Q;P=R;c0(Q|0,P|0,c[t>>2]<<2|0);if((R|0)==(r|0)){break}c_(P)}}while(0);c[(c[s>>2]|0)+(c[t>>2]<<2)>>2]=c[O>>2]|0;N=(c[t>>2]|0)+1|0;c[t>>2]=N;K=N}}while(0);U=c[s>>2]|0;if((K|0)>0){A=K;D=U}else{break}}if((U|0)!=(r|0)){c_(U);c[s>>2]=0}B=c[l>>2]|0}D=y+1|0;if((D|0)<(B|0)){y=D;z=B}else{C=304;break}}if((C|0)==304){V=c[k>>2]|0;W=x;break}else if((C|0)==355){aM(5245220,159,5247204,5243924)}else if((C|0)==356){aM(5245220,159,5247204,5243924)}}else{V=0;W=d+44|0}}while(0);c[l>>2]=0;l=c[W>>2]|0;c[j>>2]=110;bJ(l,l+(V*12&-1)|0,j);if((c[k>>2]|0)<=0){i=f;return}j=d+12|0;V=d+4|0;d=e+68|0;l=e+76|0;B=e+60|0;U=e+64|0;e=c[W>>2]|0;K=0;S=e;T=c[e>>2]|0;L397:while(1){e=S+(K*12&-1)|0;if((T|0)<=-1){C=357;break}m=c[j>>2]|0;if((m|0)<=(T|0)){C=358;break}h=c[V>>2]|0;z=S+(K*12&-1)+4|0;y=c[z>>2]|0;if(!((y|0)>-1&(m|0)>(y|0))){C=311;break}m=c[h+(T*36&-1)+16>>2]|0;s=c[h+(y*36&-1)+16>>2]|0;y=c[m+16>>2]|0;h=c[s+16>>2]|0;r=c[m+20>>2]|0;m=c[s+20>>2]|0;s=c[y+8>>2]|0;t=c[h+8>>2]|0;L402:do{if((s|0)!=(t|0)){u=c[t+112>>2]|0;L404:do{if((u|0)!=0){o=u;while(1){if((c[o>>2]|0)==(s|0)){w=c[o+4>>2]|0;q=c[w+48>>2]|0;v=c[w+52>>2]|0;p=c[w+56>>2]|0;n=c[w+60>>2]|0;if((q|0)==(y|0)&(v|0)==(h|0)&(p|0)==(r|0)&(n|0)==(m|0)){break L402}if((q|0)==(h|0)&(v|0)==(y|0)&(p|0)==(m|0)&(n|0)==(r|0)){break L402}}n=c[o+12>>2]|0;if((n|0)==0){break L404}else{o=n}}}}while(0);if((c[t>>2]|0)!=2){if((c[s>>2]|0)!=2){break}}u=c[t+108>>2]|0;L415:do{if((u|0)!=0){o=u;while(1){if((c[o>>2]|0)==(s|0)){if((a[(c[o+4>>2]|0)+61|0]&1)<<24>>24==0){break L402}}n=c[o+12>>2]|0;if((n|0)==0){break L415}else{o=n}}}}while(0);u=c[d>>2]|0;if((u|0)!=0){if(!(a_[c[(c[u>>2]|0)+8>>2]&255](u,y,h)|0)){break}}u=c[l>>2]|0;if(!(a[5251084]|0)){c[1312772]=54;c[1312773]=82;a[5251096]=1;c[1312796]=24;c[1312797]=134;a[5251192]=1;c[1312778]=24;c[1312779]=134;a[5251120]=0;c[1312802]=132;c[1312803]=90;a[5251216]=1;c[1312784]=130;c[1312785]=122;a[5251144]=1;c[1312775]=130;c[1312776]=122;a[5251108]=0;c[1312790]=124;c[1312791]=30;a[5251168]=1;c[1312799]=124;c[1312800]=30;a[5251204]=0;c[1312808]=6;c[1312809]=126;a[5251240]=1;c[1312781]=6;c[1312782]=126;a[5251132]=0;c[1312814]=138;c[1312815]=100;a[5251264]=1;c[1312805]=138;c[1312806]=100;a[5251228]=0;a[5251084]=1}o=c[(c[y+12>>2]|0)+4>>2]|0;n=c[(c[h+12>>2]|0)+4>>2]|0;if(o>>>0>=4){C=329;break L397}if(n>>>0>=4){C=331;break L397}p=c[5251088+(o*48&-1)+(n*12&-1)>>2]|0;if((p|0)==0){break}if((a[5251088+(o*48&-1)+(n*12&-1)+8|0]&1)<<24>>24==0){X=aV[p&255](h,m,y,r,u)|0}else{X=aV[p&255](y,r,h,m,u)|0}if((X|0)==0){break}u=c[(c[X+48>>2]|0)+8>>2]|0;p=c[(c[X+52>>2]|0)+8>>2]|0;c[X+8>>2]=0;c[X+12>>2]=c[B>>2]|0;n=c[B>>2]|0;if((n|0)!=0){c[n+8>>2]=X}c[B>>2]=X;n=X+16|0;c[X+20>>2]=X;c[n>>2]=p;c[X+24>>2]=0;o=u+112|0;c[X+28>>2]=c[o>>2]|0;v=c[o>>2]|0;if((v|0)!=0){c[v+8>>2]=n}c[o>>2]=n;n=X+32|0;c[X+36>>2]=X;c[n>>2]=u;c[X+40>>2]=0;o=p+112|0;c[X+44>>2]=c[o>>2]|0;v=c[o>>2]|0;if((v|0)!=0){c[v+8>>2]=n}c[o>>2]=n;n=u+4|0;o=b[n>>1]|0;if((o&2)<<16>>16==0){b[n>>1]=o|2;g[u+144>>2]=0.0}u=p+4|0;o=b[u>>1]|0;if((o&2)<<16>>16==0){b[u>>1]=o|2;g[p+144>>2]=0.0}c[U>>2]=(c[U>>2]|0)+1|0}}while(0);m=c[k>>2]|0;h=K;while(1){r=h+1|0;if((r|0)>=(m|0)){C=354;break L397}y=c[W>>2]|0;s=c[y+(r*12&-1)>>2]|0;if((s|0)!=(c[e>>2]|0)){K=r;S=y;T=s;continue L397}if((c[y+(r*12&-1)+4>>2]|0)==(c[z>>2]|0)){h=r}else{K=r;S=y;T=s;continue L397}}}if((C|0)==311){aM(5245220,153,5247156,5243924)}else if((C|0)==329){aM(5244888,80,5247572,5245732)}else if((C|0)==331){aM(5244888,81,5247572,5245012)}else if((C|0)==354){i=f;return}else if((C|0)==357){aM(5245220,153,5247156,5243924)}else if((C|0)==358){aM(5245220,153,5247156,5243924)}}function bJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0;e=i;i=i+360|0;f=e|0;g=e+12|0;h=e+24|0;j=e+36|0;k=e+48|0;l=e+168|0;m=e+180|0;n=e+192|0;o=e+204|0;p=e+216|0;q=e+228|0;r=e+240|0;s=e+252|0;t=e+264|0;u=e+276|0;v=e+348|0;w=e+120|0;x=e+132|0;y=e+144|0;z=e+156|0;A=e+288|0;B=e+300|0;C=e+324|0;D=e+336|0;E=e+312|0;F=e+60|0;G=e+72|0;H=e+84|0;I=e+96|0;J=e+108|0;K=a;a=b;L464:while(1){b=a;L=a-12|0;M=L;N=K;L466:while(1){O=N;P=b-O|0;Q=(P|0)/12&-1;if((Q|0)==2){R=362;break L464}else if((Q|0)==4){R=372;break L464}else if((Q|0)==3){R=364;break L464}else if((Q|0)==5){R=373;break L464}else if((Q|0)==0|(Q|0)==1){R=448;break L464}if((P|0)<372){R=379;break L464}Q=(P|0)/24&-1;S=N+(Q*12&-1)|0;do{if((P|0)>11988){T=(P|0)/48&-1;U=N+(T*12&-1)|0;V=N+((T+Q|0)*12&-1)|0;T=bK(N,U,S,V,d)|0;if(!(a3[c[d>>2]&255](L,V)|0)){W=T;break}X=V;c0(z|0,X|0,12);c0(X|0,M|0,12);c0(M|0,z|0,12);if(!(a3[c[d>>2]&255](V,S)|0)){W=T+1|0;break}V=S;c0(x|0,V|0,12);c0(V|0,X|0,12);c0(X|0,x|0,12);if(!(a3[c[d>>2]&255](S,U)|0)){W=T+2|0;break}X=U;c0(w|0,X|0,12);c0(X|0,V|0,12);c0(V|0,w|0,12);if(!(a3[c[d>>2]&255](U,N)|0)){W=T+3|0;break}U=N;c0(y|0,U|0,12);c0(U|0,X|0,12);c0(X|0,y|0,12);W=T+4|0}else{T=a3[c[d>>2]&255](S,N)|0;X=a3[c[d>>2]&255](L,S)|0;if(!T){if(!X){W=0;break}T=S;c0(J|0,T|0,12);c0(T|0,M|0,12);c0(M|0,J|0,12);if(!(a3[c[d>>2]&255](S,N)|0)){W=1;break}U=N;c0(H|0,U|0,12);c0(U|0,T|0,12);c0(T|0,H|0,12);W=2;break}T=N;if(X){c0(F|0,T|0,12);c0(T|0,M|0,12);c0(M|0,F|0,12);W=1;break}c0(G|0,T|0,12);X=S;c0(T|0,X|0,12);c0(X|0,G|0,12);if(!(a3[c[d>>2]&255](L,S)|0)){W=1;break}c0(I|0,X|0,12);c0(X|0,M|0,12);c0(M|0,I|0,12);W=2}}while(0);do{if(a3[c[d>>2]&255](N,S)|0){Y=L;Z=W}else{Q=L;while(1){_=Q-12|0;if((N|0)==(_|0)){break}if(a3[c[d>>2]&255](_,S)|0){R=421;break}else{Q=_}}if((R|0)==421){R=0;Q=N;c0(E|0,Q|0,12);P=_;c0(Q|0,P|0,12);c0(P|0,E|0,12);Y=_;Z=W+1|0;break}P=N+12|0;if(a3[c[d>>2]&255](N,L)|0){$=P}else{Q=P;while(1){if((Q|0)==(L|0)){R=457;break L464}aa=Q+12|0;if(a3[c[d>>2]&255](N,Q)|0){break}else{Q=aa}}P=Q;c0(D|0,P|0,12);c0(P|0,M|0,12);c0(M|0,D|0,12);$=aa}if(($|0)==(L|0)){R=441;break L464}else{ab=L;ac=$}while(1){P=ac;while(1){ad=P+12|0;if(a3[c[d>>2]&255](N,P)|0){ae=ab;break}else{P=ad}}while(1){af=ae-12|0;if(a3[c[d>>2]&255](N,af)|0){ae=af}else{break}}if(P>>>0>=af>>>0){N=P;continue L466}X=P;c0(C|0,X|0,12);T=af;c0(X|0,T|0,12);c0(T|0,C|0,12);ab=af;ac=ad}}}while(0);Q=N+12|0;L509:do{if(Q>>>0<Y>>>0){T=Y;X=Q;U=Z;V=S;while(1){ag=X;while(1){ah=ag+12|0;if(a3[c[d>>2]&255](ag,V)|0){ag=ah}else{ai=T;break}}while(1){aj=ai-12|0;if(a3[c[d>>2]&255](aj,V)|0){break}else{ai=aj}}if(ag>>>0>aj>>>0){ak=ag;al=U;am=V;break L509}P=ag;c0(B|0,P|0,12);an=aj;c0(P|0,an|0,12);c0(an|0,B|0,12);T=aj;X=ah;U=U+1|0;V=(V|0)==(ag|0)?aj:V}}else{ak=Q;al=Z;am=S}}while(0);do{if((ak|0)==(am|0)){ao=al}else{if(!(a3[c[d>>2]&255](am,ak)|0)){ao=al;break}S=ak;c0(A|0,S|0,12);Q=am;c0(S|0,Q|0,12);c0(Q|0,A|0,12);ao=al+1|0}}while(0);if((ao|0)==0){ap=bP(N,ak,d)|0;Q=ak+12|0;if(bP(Q,a,d)|0){R=433;break}if(ap){N=Q;continue}}Q=ak;if((Q-O|0)>=(b-Q|0)){R=437;break}bJ(N,ak,d);N=ak+12|0}if((R|0)==437){R=0;bJ(ak+12|0,a,d);K=N;a=ak;continue}else if((R|0)==433){R=0;if(ap){R=452;break}else{K=N;a=ak;continue}}}if((R|0)==362){if(!(a3[c[d>>2]&255](L,N)|0)){i=e;return}ak=v;v=N;c0(ak|0,v|0,12);c0(v|0,M|0,12);c0(M|0,ak|0,12);i=e;return}else if((R|0)==372){bK(N,N+12|0,N+24|0,L,d);i=e;return}else if((R|0)==379){ak=l;v=N+24|0;K=N+12|0;ap=f;f=g;g=h;h=j;j=k;k=a3[c[d>>2]&255](K,N)|0;ao=a3[c[d>>2]&255](v,K)|0;do{if(k){al=N;if(ao){c0(ap|0,al|0,12);A=v;c0(al|0,A|0,12);c0(A|0,ap|0,12);break}c0(f|0,al|0,12);A=K;c0(al|0,A|0,12);c0(A|0,f|0,12);if(!(a3[c[d>>2]&255](v,K)|0)){break}c0(h|0,A|0,12);al=v;c0(A|0,al|0,12);c0(al|0,h|0,12)}else{if(!ao){break}al=K;c0(j|0,al|0,12);A=v;c0(al|0,A|0,12);c0(A|0,j|0,12);if(!(a3[c[d>>2]&255](K,N)|0)){break}A=N;c0(g|0,A|0,12);c0(A|0,al|0,12);c0(al|0,g|0,12)}}while(0);g=N+36|0;if((g|0)==(a|0)){i=e;return}else{aq=v;ar=g}while(1){if(a3[c[d>>2]&255](ar,aq)|0){c0(ak|0,ar|0,12);g=aq;v=ar;while(1){as=g;c0(v|0,as|0,12);if((g|0)==(N|0)){break}K=g-12|0;if(a3[c[d>>2]&255](l,K)|0){v=g;g=K}else{break}}c0(as|0,ak|0,12)}g=ar+12|0;if((g|0)==(a|0)){break}else{aq=ar;ar=g}}i=e;return}else if((R|0)==364){ar=N+12|0;aq=q;q=r;r=s;s=t;t=u;u=a3[c[d>>2]&255](ar,N)|0;a=a3[c[d>>2]&255](L,ar)|0;if(!u){if(!a){i=e;return}u=ar;c0(t|0,u|0,12);c0(u|0,M|0,12);c0(M|0,t|0,12);if(!(a3[c[d>>2]&255](ar,N)|0)){i=e;return}t=N;c0(r|0,t|0,12);c0(t|0,u|0,12);c0(u|0,r|0,12);i=e;return}r=N;if(a){c0(aq|0,r|0,12);c0(r|0,M|0,12);c0(M|0,aq|0,12);i=e;return}c0(q|0,r|0,12);aq=ar;c0(r|0,aq|0,12);c0(aq|0,q|0,12);if(!(a3[c[d>>2]&255](L,ar)|0)){i=e;return}c0(s|0,aq|0,12);c0(aq|0,M|0,12);c0(M|0,s|0,12);i=e;return}else if((R|0)==373){s=N+12|0;aq=N+24|0;ar=N+36|0;q=m;m=n;n=o;o=p;bK(N,s,aq,ar,d);if(!(a3[c[d>>2]&255](L,ar)|0)){i=e;return}L=ar;c0(o|0,L|0,12);c0(L|0,M|0,12);c0(M|0,o|0,12);if(!(a3[c[d>>2]&255](ar,aq)|0)){i=e;return}ar=aq;c0(m|0,ar|0,12);c0(ar|0,L|0,12);c0(L|0,m|0,12);if(!(a3[c[d>>2]&255](aq,s)|0)){i=e;return}aq=s;c0(q|0,aq|0,12);c0(aq|0,ar|0,12);c0(ar|0,q|0,12);if(!(a3[c[d>>2]&255](s,N)|0)){i=e;return}s=N;c0(n|0,s|0,12);c0(s|0,aq|0,12);c0(aq|0,n|0,12);i=e;return}else if((R|0)==441){i=e;return}else if((R|0)==448){i=e;return}else if((R|0)==452){i=e;return}else if((R|0)==457){i=e;return}}function bK(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+96|0;h=g+60|0;j=g+72|0;k=g+84|0;l=g|0;m=g+12|0;n=g+24|0;o=g+36|0;p=g+48|0;q=a3[c[f>>2]&255](b,a)|0;r=a3[c[f>>2]&255](d,b)|0;do{if(q){s=a;if(r){c0(l|0,s|0,12);t=d;c0(s|0,t|0,12);c0(t|0,l|0,12);u=1;break}c0(m|0,s|0,12);t=b;c0(s|0,t|0,12);c0(t|0,m|0,12);if(!(a3[c[f>>2]&255](d,b)|0)){u=1;break}c0(o|0,t|0,12);s=d;c0(t|0,s|0,12);c0(s|0,o|0,12);u=2}else{if(!r){u=0;break}s=b;c0(p|0,s|0,12);t=d;c0(s|0,t|0,12);c0(t|0,p|0,12);if(!(a3[c[f>>2]&255](b,a)|0)){u=1;break}t=a;c0(n|0,t|0,12);c0(t|0,s|0,12);c0(s|0,n|0,12);u=2}}while(0);if(!(a3[c[f>>2]&255](e,d)|0)){v=u;i=g;return v|0}n=k;k=d;c0(n|0,k|0,12);p=e;c0(k|0,p|0,12);c0(p|0,n|0,12);if(!(a3[c[f>>2]&255](d,b)|0)){v=u+1|0;i=g;return v|0}d=h;h=b;c0(d|0,h|0,12);c0(h|0,k|0,12);c0(k|0,d|0,12);if(!(a3[c[f>>2]&255](b,a)|0)){v=u+2|0;i=g;return v|0}b=j;j=a;c0(b|0,j|0,12);c0(j|0,h|0,12);c0(h|0,b|0,12);v=u+3|0;i=g;return v|0}function bL(a,b){a=a|0;b=b|0;return}function bM(a,b){a=a|0;b=b|0;return}function bN(a,b,c){a=a|0;b=b|0;c=c|0;return}function bO(a,b,c){a=a|0;b=b|0;c=c|0;return}function bP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=i;i=i+192|0;f=e|0;g=e+12|0;h=e+24|0;j=e+36|0;k=e+48|0;l=e+60|0;m=e+72|0;n=e+84|0;o=e+96|0;p=e+108|0;q=e+120|0;r=e+132|0;s=e+144|0;t=e+156|0;u=e+168|0;v=e+180|0;w=(b-a|0)/12&-1;if((w|0)==2){x=b-12|0;if(!(a3[c[d>>2]&255](x,a)|0)){y=1;i=e;return y|0}z=u;u=a;c0(z|0,u|0,12);A=x;c0(u|0,A|0,12);c0(A|0,z|0,12);y=1;i=e;return y|0}else if((w|0)==3){z=a+12|0;A=b-12|0;u=p;p=q;q=r;r=s;s=t;t=a3[c[d>>2]&255](z,a)|0;x=a3[c[d>>2]&255](A,z)|0;if(!t){if(!x){y=1;i=e;return y|0}t=z;c0(s|0,t|0,12);B=A;c0(t|0,B|0,12);c0(B|0,s|0,12);if(!(a3[c[d>>2]&255](z,a)|0)){y=1;i=e;return y|0}s=a;c0(q|0,s|0,12);c0(s|0,t|0,12);c0(t|0,q|0,12);y=1;i=e;return y|0}q=a;if(x){c0(u|0,q|0,12);x=A;c0(q|0,x|0,12);c0(x|0,u|0,12);y=1;i=e;return y|0}c0(p|0,q|0,12);u=z;c0(q|0,u|0,12);c0(u|0,p|0,12);if(!(a3[c[d>>2]&255](A,z)|0)){y=1;i=e;return y|0}c0(r|0,u|0,12);z=A;c0(u|0,z|0,12);c0(z|0,r|0,12);y=1;i=e;return y|0}else if((w|0)==5){r=a+12|0;z=a+24|0;u=a+36|0;A=b-12|0;p=l;l=m;m=n;n=o;bK(a,r,z,u,d);if(!(a3[c[d>>2]&255](A,u)|0)){y=1;i=e;return y|0}o=u;c0(n|0,o|0,12);q=A;c0(o|0,q|0,12);c0(q|0,n|0,12);if(!(a3[c[d>>2]&255](u,z)|0)){y=1;i=e;return y|0}u=z;c0(l|0,u|0,12);c0(u|0,o|0,12);c0(o|0,l|0,12);if(!(a3[c[d>>2]&255](z,r)|0)){y=1;i=e;return y|0}z=r;c0(p|0,z|0,12);c0(z|0,u|0,12);c0(u|0,p|0,12);if(!(a3[c[d>>2]&255](r,a)|0)){y=1;i=e;return y|0}r=a;c0(m|0,r|0,12);c0(r|0,z|0,12);c0(z|0,m|0,12);y=1;i=e;return y|0}else if((w|0)==4){bK(a,a+12|0,a+24|0,b-12|0,d);y=1;i=e;return y|0}else if((w|0)==0|(w|0)==1){y=1;i=e;return y|0}else{w=a+24|0;m=a+12|0;z=f;f=g;g=h;h=j;j=k;k=a3[c[d>>2]&255](m,a)|0;r=a3[c[d>>2]&255](w,m)|0;do{if(k){p=a;if(r){c0(z|0,p|0,12);u=w;c0(p|0,u|0,12);c0(u|0,z|0,12);break}c0(f|0,p|0,12);u=m;c0(p|0,u|0,12);c0(u|0,f|0,12);if(!(a3[c[d>>2]&255](w,m)|0)){break}c0(h|0,u|0,12);p=w;c0(u|0,p|0,12);c0(p|0,h|0,12)}else{if(!r){break}p=m;c0(j|0,p|0,12);u=w;c0(p|0,u|0,12);c0(u|0,j|0,12);if(!(a3[c[d>>2]&255](m,a)|0)){break}u=a;c0(g|0,u|0,12);c0(u|0,p|0,12);c0(p|0,g|0,12)}}while(0);g=a+36|0;if((g|0)==(b|0)){y=1;i=e;return y|0}m=v;j=w;w=0;r=g;while(1){if(a3[c[d>>2]&255](r,j)|0){c0(m|0,r|0,12);g=j;h=r;while(1){C=g;c0(h|0,C|0,12);if((g|0)==(a|0)){break}f=g-12|0;if(a3[c[d>>2]&255](v,f)|0){h=g;g=f}else{break}}c0(C|0,m|0,12);g=w+1|0;if((g|0)==8){break}else{D=g}}else{D=w}g=r+12|0;if((g|0)==(b|0)){y=1;E=519;break}else{j=r;w=D;r=g}}if((E|0)==519){i=e;return y|0}y=(r+12|0)==(b|0);i=e;return y|0}return 0}function bQ(a){a=a|0;if((a|0)==0){return}c_(a);return}function bR(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0.0,M=0.0,N=0.0,O=0,P=0.0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0.0,Y=0.0,Z=0,_=0,$=0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0;f=i;i=i+32|0;h=f|0;j=f+16|0;l=a+28|0;if((c[l>>2]|0)<=0){i=f;return}m=a+24|0;n=a+12|0;a=h|0;o=j|0;p=h+4|0;q=j+4|0;r=h+8|0;s=j+8|0;t=h+12|0;u=j+12|0;v=e|0;w=d|0;x=e+4|0;y=d+4|0;z=b|0;A=b+40|0;B=b+36|0;C=b+32|0;D=b+12|0;E=b+4|0;F=b|0;G=b+8|0;H=b+16|0;b=0;L703:while(1){I=c[m>>2]|0;J=c[n>>2]|0;K=I+(b*28&-1)+20|0;a4[c[(c[J>>2]|0)+24>>2]&255](J,h,d,c[K>>2]|0);J=c[n>>2]|0;a4[c[(c[J>>2]|0)+24>>2]&255](J,j,e,c[K>>2]|0);L=+g[a>>2];M=+g[o>>2];N=L<M?L:M;M=+g[p>>2];L=+g[q>>2];K=I+(b*28&-1)|0;J=(g[k>>2]=N,c[k>>2]|0);O=(g[k>>2]=M<L?M:L,c[k>>2]|0)|0;c[K>>2]=0|J;c[K+4>>2]=O;L=+g[r>>2];M=+g[s>>2];P=L>M?L:M;M=+g[t>>2];L=+g[u>>2];O=I+(b*28&-1)+8|0;J=(g[k>>2]=P,c[k>>2]|0);Q=(g[k>>2]=M>L?M:L,c[k>>2]|0)|0;c[O>>2]=0|J;c[O+4>>2]=Q;L=+g[v>>2]- +g[w>>2];M=+g[x>>2]- +g[y>>2];Q=c[I+(b*28&-1)+24>>2]|0;if((Q|0)<=-1){R=581;break}if((c[D>>2]|0)<=(Q|0)){R=582;break}J=c[E>>2]|0;if((c[J+(Q*36&-1)+24>>2]|0)!=-1){R=544;break}do{if(+g[J+(Q*36&-1)>>2]>N){R=549}else{if(+g[J+(Q*36&-1)+4>>2]>+g[I+(b*28&-1)+4>>2]){R=549;break}if(P>+g[J+(Q*36&-1)+8>>2]){R=549;break}if(+g[I+(b*28&-1)+12>>2]>+g[J+(Q*36&-1)+12>>2]){R=549;break}else{break}}}while(0);if((R|0)==549){R=0;L714:do{if((c[F>>2]|0)==(Q|0)){c[F>>2]=-1}else{I=c[J+(Q*36&-1)+20>>2]|0;S=c[J+(I*36&-1)+20>>2]|0;T=c[J+(I*36&-1)+24>>2]|0;if((T|0)==(Q|0)){U=c[J+(I*36&-1)+28>>2]|0}else{U=T}if((S|0)==-1){c[F>>2]=U;c[J+(U*36&-1)+20>>2]=-1;if((I|0)<=-1){R=587;break L703}if((c[D>>2]|0)<=(I|0)){R=588;break L703}if((c[G>>2]|0)<=0){R=568;break L703}c[(c[E>>2]|0)+(I*36&-1)+20>>2]=c[H>>2]|0;c[(c[E>>2]|0)+(I*36&-1)+32>>2]=-1;c[H>>2]=I;c[G>>2]=(c[G>>2]|0)-1|0;break}T=J+(S*36&-1)+24|0;if((c[T>>2]|0)==(I|0)){c[T>>2]=U}else{c[J+(S*36&-1)+28>>2]=U}c[(c[E>>2]|0)+(U*36&-1)+20>>2]=S;if((I|0)<=-1){R=585;break L703}if((c[D>>2]|0)<=(I|0)){R=586;break L703}if((c[G>>2]|0)<=0){R=561;break L703}c[(c[E>>2]|0)+(I*36&-1)+20>>2]=c[H>>2]|0;c[(c[E>>2]|0)+(I*36&-1)+32>>2]=-1;c[H>>2]=I;c[G>>2]=(c[G>>2]|0)-1|0;I=S;while(1){S=b_(z,I)|0;T=c[E>>2]|0;V=c[T+(S*36&-1)+24>>2]|0;W=c[T+(S*36&-1)+28>>2]|0;P=+g[T+(V*36&-1)>>2];N=+g[T+(W*36&-1)>>2];X=+g[T+(V*36&-1)+4>>2];Y=+g[T+(W*36&-1)+4>>2];Z=T+(S*36&-1)|0;_=(g[k>>2]=P<N?P:N,c[k>>2]|0);$=(g[k>>2]=X<Y?X:Y,c[k>>2]|0)|0;c[Z>>2]=0|_;c[Z+4>>2]=$;Y=+g[T+(V*36&-1)+8>>2];X=+g[T+(W*36&-1)+8>>2];N=+g[T+(V*36&-1)+12>>2];P=+g[T+(W*36&-1)+12>>2];$=T+(S*36&-1)+8|0;T=(g[k>>2]=Y>X?Y:X,c[k>>2]|0);Z=(g[k>>2]=N>P?N:P,c[k>>2]|0)|0;c[$>>2]=0|T;c[$+4>>2]=Z;Z=c[E>>2]|0;$=c[Z+(V*36&-1)+32>>2]|0;V=c[Z+(W*36&-1)+32>>2]|0;c[Z+(S*36&-1)+32>>2]=(($|0)>(V|0)?$:V)+1|0;V=c[(c[E>>2]|0)+(S*36&-1)+20>>2]|0;if((V|0)==-1){break L714}else{I=V}}}}while(0);J=c[K+4>>2]|0;P=(c[k>>2]=c[K>>2]|0,+g[k>>2]);N=(c[k>>2]=J,+g[k>>2]);J=c[O+4>>2]|0;X=(c[k>>2]=c[O>>2]|0,+g[k>>2]);Y=P+-.10000000149011612;P=N+-.10000000149011612;N=X+.10000000149011612;X=(c[k>>2]=J,+g[k>>2])+.10000000149011612;aa=L*2.0;ab=M*2.0;if(aa<0.0){ac=N;ad=Y+aa}else{ac=aa+N;ad=Y}if(ab<0.0){ae=X;af=P+ab}else{ae=ab+X;af=P}J=c[E>>2]|0;I=J+(Q*36&-1)|0;V=(g[k>>2]=ad,c[k>>2]|0);S=(g[k>>2]=af,c[k>>2]|0)|0;c[I>>2]=0|V;c[I+4>>2]=S;S=J+(Q*36&-1)+8|0;J=(g[k>>2]=ac,c[k>>2]|0);I=(g[k>>2]=ae,c[k>>2]|0)|0;c[S>>2]=0|J;c[S+4>>2]=I;bZ(z,Q);I=c[A>>2]|0;if((I|0)==(c[B>>2]|0)){S=c[C>>2]|0;c[B>>2]=I<<1;J=cZ(I<<3)|0;c[C>>2]=J;V=S;c0(J|0,V|0,c[A>>2]<<2|0);c_(V);ag=c[A>>2]|0}else{ag=I}c[(c[C>>2]|0)+(ag<<2)>>2]=Q;c[A>>2]=(c[A>>2]|0)+1|0}I=b+1|0;if((I|0)<(c[l>>2]|0)){b=I}else{R=584;break}}if((R|0)==544){aM(5245288,137,5249404,5243380)}else if((R|0)==581){aM(5245288,135,5249404,5243924)}else if((R|0)==582){aM(5245288,135,5249404,5243924)}else if((R|0)==586){aM(5245288,97,5249476,5245112)}else if((R|0)==587){aM(5245288,97,5249476,5245112)}else if((R|0)==588){aM(5245288,97,5249476,5245112)}else if((R|0)==561){aM(5245288,98,5249476,5244284)}else if((R|0)==568){aM(5245288,98,5249476,5244284)}else if((R|0)==584){i=f;return}else if((R|0)==585){aM(5245288,97,5249476,5245112)}}function bS(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=c[b+102952>>2]|0;L760:do{if((d|0)!=0){e=d;L761:while(1){f=c[e+96>>2]|0;g=c[e+100>>2]|0;while(1){if((g|0)==0){break}h=c[g+4>>2]|0;c[g+28>>2]=0;i=g+12|0;j=c[i>>2]|0;k=aZ[c[(c[j>>2]|0)+12>>2]&255](j)|0;j=g+24|0;l=c[j>>2]|0;m=l;n=k*28&-1;do{if((n|0)!=0){if((n|0)<=0){o=596;break L761}if((n|0)>640){c_(m);break}k=a[n+5251280|0]|0;if((k&255)>=14){o=601;break L761}p=b+12+((k&255)<<2)|0;c[l>>2]=c[p>>2]|0;c[p>>2]=l}}while(0);c[j>>2]=0;l=c[i>>2]|0;n=c[l+4>>2]|0;if((n|0)==2){aX[c[c[l>>2]>>2]&255](l);m=a[5251432]|0;if((m&255)>=14){o=617;break L761}p=b+12+((m&255)<<2)|0;c[l>>2]=c[p>>2]|0;c[p>>2]=l}else if((n|0)==3){aX[c[c[l>>2]>>2]&255](l);p=a[5251320]|0;if((p&255)>=14){o=622;break L761}m=b+12+((p&255)<<2)|0;c[l>>2]=c[m>>2]|0;c[m>>2]=l}else if((n|0)==0){aX[c[c[l>>2]>>2]&255](l);m=a[5251300]|0;if((m&255)>=14){o=607;break L761}p=b+12+((m&255)<<2)|0;c[l>>2]=c[p>>2]|0;c[p>>2]=l}else if((n|0)==1){aX[c[c[l>>2]>>2]&255](l);n=a[5251328]|0;if((n&255)>=14){o=612;break L761}p=b+12+((n&255)<<2)|0;c[l>>2]=c[p>>2]|0;c[p>>2]=l}else{o=625;break L761}c[i>>2]=0;g=h}if((f|0)==0){break L760}else{e=f}}if((o|0)==596){aM(5245880,164,5249084,5245152)}else if((o|0)==617){aM(5245880,173,5249084,5244332)}else if((o|0)==625){aM(5243688,115,5247464,5245636)}else if((o|0)==622){aM(5245880,173,5249084,5244332)}else if((o|0)==601){aM(5245880,173,5249084,5244332)}else if((o|0)==607){aM(5245880,173,5249084,5244332)}else if((o|0)==612){aM(5245880,173,5249084,5244332)}}}while(0);c_(c[b+102904>>2]|0);c_(c[b+102916>>2]|0);c_(c[b+102876>>2]|0);if((c[b+102468>>2]|0)!=0){aM(5245076,32,5248824,5245812)}if((c[b+102864>>2]|0)!=0){aM(5245076,33,5248824,5245056)}o=b+4|0;d=b|0;b=c[d>>2]|0;if((c[o>>2]|0)>0){q=0;r=b}else{s=b;t=s;c_(t);return}while(1){c_(c[r+(q<<3)+4>>2]|0);b=q+1|0;e=c[d>>2]|0;if((b|0)<(c[o>>2]|0)){q=b;r=e}else{s=e;break}}t=s;c_(t);return}function bT(e){e=e|0;var f=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,O=0,Q=0,T=0.0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aZ=0,a0=0,a1=0,a2=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0.0,bu=0.0,bv=0.0,bw=0.0,bx=0.0,by=0.0,bz=0.0,bA=0.0,bB=0.0,bC=0.0,bD=0.0,bE=0.0,bF=0,bH=0.0,bJ=0,bK=0.0,bL=0.0,bM=0.0,bN=0.0,bO=0.0,bP=0.0,bQ=0.0,bS=0.0,bT=0.0,bU=0.0,bV=0.0,bY=0.0,bZ=0.0,b_=0.0,b1=0.0,b2=0.0,b3=0.0,b4=0.0,b6=0.0,b7=0.0,b8=0.0,b9=0.0,ca=0,cb=0,cc=0.0,cd=0.0,ce=0.0,cf=0.0,cg=0,ch=0,ci=0,cj=0.0,ck=0,cl=0,cm=0.0,cn=0.0,cp=0.0,cq=0.0,cr=0.0,cs=0.0,ct=0.0,cu=0.0,cv=0.0,cw=0.0,cx=0.0,cy=0.0,cz=0.0,cA=0.0,cB=0.0,cC=0.0,cD=0,cE=0,cF=0.0,cG=0,cH=0.0,cK=0,cL=0,cM=0,cN=0,cO=0,cR=0,cS=0,cT=0,cU=0,cV=0,cW=0,cX=0,cY=0,c_=0,c$=0,c2=0,c3=0,c4=0,c5=0,c6=0.0,c7=0,c8=0,c9=0,da=0,db=0.0,dc=0,dd=0,de=0,df=0,dg=0,dh=0,di=0,dj=0,dk=0,dl=0,dm=0,dn=0.0,dp=0,dq=0.0,dr=0,ds=0,dt=0,du=0.0,dv=0.0,dw=0.0,dx=0.0,dy=0.0,dz=0.0,dA=0.0,dB=0.0,dC=0.0,dD=0.0,dE=0.0,dF=0.0,dG=0.0,dH=0.0,dI=0.0,dJ=0.0,dK=0.0,dL=0,dM=0,dN=0,dO=0.0,dP=0.0,dQ=0.0,dR=0.0,dS=0,dT=0,dU=0.0,dV=0,dW=0,dX=0,dY=0,dZ=0,d_=0,d$=0,d0=0.0,d1=0,d2=0.0,d3=0.0,d4=0.0,d5=0,d6=0.0,d7=0.0,d8=0.0,d9=0.0,ea=0,eb=0.0,ec=0.0,ed=0.0,ee=0,ef=0,eg=0,eh=0,ei=0,ej=0,ek=0,el=0,em=0,en=0,eo=0.0,ep=0.0,eq=0.0,er=0.0,es=0.0,et=0.0,eu=0.0,ev=0.0,ew=0.0,ex=0.0,ey=0.0,ez=0.0,eA=0.0,eB=0.0,eC=0.0,eD=0,eE=0,eF=0,eG=0,eH=0,eI=0,eJ=0;f=i;i=i+988|0;h=f|0;j=f+16|0;l=f+32|0;m=f+52|0;n=f+72|0;o=f+116|0;p=f+168|0;q=f+180|0;r=f+272|0;s=f+296|0;t=f+396|0;u=f+412|0;v=f+464|0;w=f+596|0;x=f+632|0;y=f+668|0;z=f+676|0;A=f+712|0;B=f+716|0;C=f+732|0;D=f+748|0;E=f+768|0;F=f+788|0;G=f+820|0;H=f+864|0;I=f+916|0;J=f+932|0;K=f+984|0;L=e+102868|0;M=c[L>>2]|0;O=e+102872|0;if((M&1|0)==0){Q=M}else{bI(O|0,O);M=c[L>>2]&-2;c[L>>2]=M;Q=M}c[L>>2]=Q|2;Q=e+102988|0;T=+g[Q>>2]*.01666666753590107;M=a[e+102992|0]&1;U=e+102932|0;V=c[U>>2]|0;L823:do{if((V|0)!=0){W=e+102884|0;X=e+102876|0;Y=e+102944|0;Z=e+102940|0;_=V;L825:while(1){$=c[_+48>>2]|0;aa=c[_+52>>2]|0;ab=c[_+56>>2]|0;ac=c[_+60>>2]|0;ad=c[$+8>>2]|0;ae=c[aa+8>>2]|0;af=_+4|0;ag=c[af>>2]|0;L827:do{if((ag&8|0)==0){ah=670}else{do{if((c[ae>>2]|0)==2){ah=659}else{if((c[ad>>2]|0)==2){ah=659;break}else{break}}}while(0);L831:do{if((ah|0)==659){ah=0;ai=c[ae+108>>2]|0;L833:do{if((ai|0)!=0){aj=ai;while(1){if((c[aj>>2]|0)==(ad|0)){if((a[(c[aj+4>>2]|0)+61|0]&1)<<24>>24==0){break L831}}ak=c[aj+12>>2]|0;if((ak|0)==0){break L833}else{aj=ak}}}}while(0);ai=c[Z>>2]|0;do{if((ai|0)==0){al=ag}else{if(a_[c[(c[ai>>2]|0)+8>>2]&255](ai,$,aa)|0){al=c[af>>2]|0;break}else{aj=c[_+12>>2]|0;bG(O,_);am=aj;break L827}}}while(0);c[af>>2]=al&-9;ah=670;break L827}}while(0);ai=c[_+12>>2]|0;bG(O,_);am=ai;break}}while(0);do{if((ah|0)==670){ah=0;if((b[ad+4>>1]&2)<<16>>16==0){an=0}else{an=(c[ad>>2]|0)!=0}if((b[ae+4>>1]&2)<<16>>16==0){ao=0}else{ao=(c[ae>>2]|0)!=0}if(!(an|ao)){am=c[_+12>>2]|0;break}af=c[(c[$+24>>2]|0)+(ab*28&-1)+24>>2]|0;ag=c[(c[aa+24>>2]|0)+(ac*28&-1)+24>>2]|0;if((af|0)<=-1){ah=1122;break L825}ai=c[W>>2]|0;if((ai|0)<=(af|0)){ah=1123;break L825}aj=c[X>>2]|0;if(!((ag|0)>-1&(ai|0)>(ag|0))){ah=680;break L825}if(+g[aj+(ag*36&-1)>>2]- +g[aj+(af*36&-1)+8>>2]>0.0|+g[aj+(ag*36&-1)+4>>2]- +g[aj+(af*36&-1)+12>>2]>0.0|+g[aj+(af*36&-1)>>2]- +g[aj+(ag*36&-1)+8>>2]>0.0|+g[aj+(af*36&-1)+4>>2]- +g[aj+(ag*36&-1)+12>>2]>0.0){ag=c[_+12>>2]|0;bG(O,_);am=ag;break}else{b5(_,c[Y>>2]|0);am=c[_+12>>2]|0;break}}}while(0);if((am|0)==0){break L823}else{_=am}}if((ah|0)==680){aM(5245220,159,5247204,5243924)}else if((ah|0)==1122){aM(5245220,159,5247204,5243924)}else if((ah|0)==1123){aM(5245220,159,5247204,5243924)}}}while(0);g[e+103e3>>2]=0.0;am=e+102995|0;if((a[am]&1)<<24>>24!=0){ao=e+103008|0;g[ao>>2]=0.0;an=e+103012|0;g[an>>2]=0.0;al=e+103016|0;g[al>>2]=0.0;V=e+102960|0;_=e+68|0;co(J,c[V>>2]|0,c[e+102936>>2]|0,c[e+102964>>2]|0,_,c[e+102944>>2]|0);Y=e+102952|0;X=c[Y>>2]|0;L872:do{if((X|0)!=0){W=X;while(1){Z=W+4|0;b[Z>>1]=b[Z>>1]&-2;Z=c[W+96>>2]|0;if((Z|0)==0){break L872}else{W=Z}}}}while(0);X=c[U>>2]|0;L876:do{if((X|0)!=0){W=X;while(1){Z=W+4|0;c[Z>>2]=c[Z>>2]&-2;Z=c[W+12>>2]|0;if((Z|0)==0){break L876}else{W=Z}}}}while(0);X=c[e+102956>>2]|0;L880:do{if((X|0)!=0){W=X;while(1){a[W+60|0]=0;Z=c[W+12>>2]|0;if((Z|0)==0){break L880}else{W=Z}}}}while(0);X=c[V>>2]|0;V=X<<2;W=e+102864|0;Z=c[W>>2]|0;if((Z|0)>=32){aM(5245076,38,5248864,5244248)}ac=e+102480+(Z*12&-1)|0;c[e+102480+(Z*12&-1)+4>>2]=V;aa=e+102468|0;ab=c[aa>>2]|0;if((ab+V|0)>102400){c[ac>>2]=cZ(V)|0;a[e+102480+(Z*12&-1)+8|0]=1}else{c[ac>>2]=ab+(e+68)|0;a[e+102480+(Z*12&-1)+8|0]=0;c[aa>>2]=(c[aa>>2]|0)+V|0}aa=e+102472|0;Z=(c[aa>>2]|0)+V|0;c[aa>>2]=Z;aa=e+102476|0;V=c[aa>>2]|0;c[aa>>2]=(V|0)>(Z|0)?V:Z;c[W>>2]=(c[W>>2]|0)+1|0;W=c[ac>>2]|0;ac=W;Z=c[Y>>2]|0;L892:do{if((Z|0)!=0){V=J+28|0;aa=J+36|0;ab=J+32|0;$=J+40|0;ae=J+8|0;ad=J+48|0;ag=J+16|0;aj=J+44|0;af=J+12|0;ai=e+102976|0;ak=e+102968|0;ap=e+102972|0;aq=J+20|0;ar=J+24|0;as=F|0;at=F+4|0;au=F+8|0;av=F+12|0;aw=F+16|0;ax=F+20|0;ay=F+21|0;az=K|0;aA=F+24|0;aB=F+28|0;aC=G|0;aD=G+4|0;aE=G+8|0;aF=G+12|0;aG=G+16|0;aH=G+20|0;aI=G+21|0;aJ=G+24|0;aK=G+28|0;aL=G+32|0;aN=G+36|0;aO=J|0;aP=G+40|0;aQ=M<<24>>24==0;aR=H+48|0;aS=H+40|0;aT=H+44|0;aU=H+36|0;aV=H+24|0;aW=B+8|0;aX=B+12|0;aZ=C+8|0;a0=C+12|0;a1=B;a2=C;a4=D;a5=D+8|0;a6=D+16|0;a7=J+4|0;a8=H+32|0;a9=E+16|0;ba=H+28|0;bb=Z;L894:while(1){bc=bb+4|0;L896:do{if((b[bc>>1]&35)<<16>>16==34){if((c[bb>>2]|0)==0){break}c[V>>2]=0;c[aa>>2]=0;c[ab>>2]=0;c[ac>>2]=bb;b[bc>>1]=b[bc>>1]|1;bd=1;while(1){be=bd-1|0;bf=c[ac+(be<<2)>>2]|0;bg=bf+4|0;if((b[bg>>1]&32)<<16>>16==0){ah=711;break L894}bh=c[V>>2]|0;if((bh|0)>=(c[$>>2]|0)){ah=714;break L894}c[bf+8>>2]=bh;c[(c[ae>>2]|0)+(c[V>>2]<<2)>>2]=bf;c[V>>2]=(c[V>>2]|0)+1|0;bh=b[bg>>1]|0;if((bh&2)<<16>>16==0){b[bg>>1]=bh|2;g[bf+144>>2]=0.0}L906:do{if((c[bf>>2]|0)==0){bi=be}else{bh=c[bf+112>>2]|0;L908:do{if((bh|0)==0){bj=be}else{bg=be;bk=bh;while(1){bl=c[bk+4>>2]|0;bm=bl+4|0;do{if((c[bm>>2]&7|0)==6){if((a[(c[bl+48>>2]|0)+38|0]&1)<<24>>24!=0){bn=bg;break}if((a[(c[bl+52>>2]|0)+38|0]&1)<<24>>24!=0){bn=bg;break}bo=c[aa>>2]|0;if((bo|0)>=(c[aj>>2]|0)){ah=725;break L894}c[aa>>2]=bo+1|0;c[(c[af>>2]|0)+(bo<<2)>>2]=bl;c[bm>>2]=c[bm>>2]|1;bo=c[bk>>2]|0;bp=bo+4|0;if((b[bp>>1]&1)<<16>>16!=0){bn=bg;break}if((bg|0)>=(X|0)){ah=729;break L894}c[ac+(bg<<2)>>2]=bo;b[bp>>1]=b[bp>>1]|1;bn=bg+1|0}else{bn=bg}}while(0);bm=c[bk+12>>2]|0;if((bm|0)==0){bj=bn;break L908}else{bg=bn;bk=bm}}}}while(0);bh=c[bf+108>>2]|0;if((bh|0)==0){bi=bj;break}else{bq=bj;br=bh}while(1){bh=br+4|0;bk=c[bh>>2]|0;do{if((a[bk+60|0]&1)<<24>>24==0){bg=c[br>>2]|0;bm=bg+4|0;if((b[bm>>1]&32)<<16>>16==0){bs=bq;break}bl=c[ab>>2]|0;if((bl|0)>=(c[ad>>2]|0)){ah=737;break L894}c[ab>>2]=bl+1|0;c[(c[ag>>2]|0)+(bl<<2)>>2]=bk;a[(c[bh>>2]|0)+60|0]=1;if((b[bm>>1]&1)<<16>>16!=0){bs=bq;break}if((bq|0)>=(X|0)){ah=741;break L894}c[ac+(bq<<2)>>2]=bg;b[bm>>1]=b[bm>>1]|1;bs=bq+1|0}else{bs=bq}}while(0);bh=c[br+12>>2]|0;if((bh|0)==0){bi=bs;break L906}else{bq=bs;br=bh}}}}while(0);if((bi|0)>0){bd=bi}else{break}}bd=(a[ai]&1)<<24>>24==0;L931:do{if((c[V>>2]|0)>0){bf=0;while(1){be=c[(c[ae>>2]|0)+(bf<<2)>>2]|0;bh=be+44|0;bk=c[bh>>2]|0;bm=c[bh+4>>2]|0;bt=+g[be+56>>2];bh=be+64|0;bg=c[bh+4>>2]|0;bu=(c[k>>2]=c[bh>>2]|0,+g[k>>2]);bv=(c[k>>2]=bg,+g[k>>2]);bw=+g[be+72>>2];bg=be+36|0;c[bg>>2]=bk;c[bg+4>>2]=bm;g[be+52>>2]=bt;if((c[be>>2]|0)==2){bx=+g[be+140>>2];by=+g[be+120>>2];bz=1.0- +g[be+132>>2]*.01666666753590107;bA=bz<1.0?bz:1.0;bz=bA<0.0?0.0:bA;bA=1.0- +g[be+136>>2]*.01666666753590107;bB=bA<1.0?bA:1.0;bC=(bw+ +g[be+128>>2]*.01666666753590107*+g[be+84>>2])*(bB<0.0?0.0:bB);bD=(bu+(bx*+g[ak>>2]+by*+g[be+76>>2])*.01666666753590107)*bz;bE=(bv+(bx*+g[ap>>2]+by*+g[be+80>>2])*.01666666753590107)*bz}else{bC=bw;bD=bu;bE=bv}be=(c[aq>>2]|0)+(bf*12&-1)|0;c[be>>2]=bk;c[be+4>>2]=bm;g[(c[aq>>2]|0)+(bf*12&-1)+8>>2]=bt;bm=(c[ar>>2]|0)+(bf*12&-1)|0;be=(g[k>>2]=bD,c[k>>2]|0);bk=(g[k>>2]=bE,c[k>>2]|0)|0;c[bm>>2]=0|be;c[bm+4>>2]=bk;g[(c[ar>>2]|0)+(bf*12&-1)+8>>2]=bC;bk=bf+1|0;if((bk|0)<(c[V>>2]|0)){bf=bk}else{break L931}}}}while(0);g[as>>2]=.01666666753590107;g[at>>2]=59.999996185302734;g[au>>2]=T;c[av>>2]=3;c[aw>>2]=3;a[ax]=M;c0(ay|0,az|0,3);bf=c[aq>>2]|0;c[aA>>2]=bf;bk=c[ar>>2]|0;c[aB>>2]=bk;g[aC>>2]=.01666666753590107;g[aD>>2]=59.999996185302734;g[aE>>2]=T;c[aF>>2]=3;c[aG>>2]=3;a[aH]=M;c0(aI|0,az|0,3);c[aJ>>2]=c[af>>2]|0;c[aK>>2]=c[aa>>2]|0;c[aL>>2]=bf;c[aN>>2]=bk;c[aP>>2]=c[aO>>2]|0;cI(H,G);cJ(H);L940:do{if(!aQ){bk=c[aR>>2]|0;if((bk|0)<=0){break}bf=c[aS>>2]|0;bm=c[ba>>2]|0;be=0;while(1){bg=c[bf+(be*152&-1)+112>>2]|0;bh=c[bf+(be*152&-1)+116>>2]|0;bt=+g[bf+(be*152&-1)+120>>2];bv=+g[bf+(be*152&-1)+128>>2];bu=+g[bf+(be*152&-1)+124>>2];bw=+g[bf+(be*152&-1)+132>>2];bl=c[bf+(be*152&-1)+144>>2]|0;bp=bm+(bg*12&-1)|0;bo=c[bp+4>>2]|0;bz=(c[k>>2]=c[bp>>2]|0,+g[k>>2]);by=(c[k>>2]=bo,+g[k>>2]);bo=bm+(bg*12&-1)+8|0;bx=+g[bo>>2];bg=bm+(bh*12&-1)|0;bF=c[bg+4>>2]|0;bB=(c[k>>2]=c[bg>>2]|0,+g[k>>2]);bA=(c[k>>2]=bF,+g[k>>2]);bF=bm+(bh*12&-1)+8|0;bH=+g[bF>>2];bh=bf+(be*152&-1)+72|0;bJ=c[bh+4>>2]|0;bK=(c[k>>2]=c[bh>>2]|0,+g[k>>2]);bL=(c[k>>2]=bJ,+g[k>>2]);bM=bK*-1.0;L945:do{if((bl|0)>0){bN=by;bO=bz;bP=bA;bQ=bB;bS=bx;bT=bH;bJ=0;while(1){bU=+g[bf+(be*152&-1)+(bJ*36&-1)+16>>2];bV=+g[bf+(be*152&-1)+(bJ*36&-1)+20>>2];bY=bK*bU+bL*bV;bZ=bL*bU+bM*bV;bV=bS-bv*(+g[bf+(be*152&-1)+(bJ*36&-1)>>2]*bZ- +g[bf+(be*152&-1)+(bJ*36&-1)+4>>2]*bY);bU=bO-bt*bY;b_=bN-bt*bZ;b1=bT+bw*(bZ*+g[bf+(be*152&-1)+(bJ*36&-1)+8>>2]-bY*+g[bf+(be*152&-1)+(bJ*36&-1)+12>>2]);b2=bQ+bu*bY;bY=bP+bu*bZ;bh=bJ+1|0;if((bh|0)==(bl|0)){b3=b_;b4=bU;b6=bY;b7=b2;b8=bV;b9=b1;break L945}else{bN=b_;bO=bU;bP=bY;bQ=b2;bS=bV;bT=b1;bJ=bh}}}else{b3=by;b4=bz;b6=bA;b7=bB;b8=bx;b9=bH}}while(0);bl=(g[k>>2]=b4,c[k>>2]|0);bJ=(g[k>>2]=b3,c[k>>2]|0)|0;c[bp>>2]=0|bl;c[bp+4>>2]=bJ;g[bo>>2]=b8;bJ=(g[k>>2]=b7,c[k>>2]|0);bl=(g[k>>2]=b6,c[k>>2]|0)|0;c[bg>>2]=0|bJ;c[bg+4>>2]=bl;g[bF>>2]=b9;bl=be+1|0;if((bl|0)<(bk|0)){be=bl}else{break L940}}}}while(0);be=c[ab>>2]|0;L950:do{if((be|0)>0){bk=0;while(1){bf=c[(c[ag>>2]|0)+(bk<<2)>>2]|0;aY[c[(c[bf>>2]|0)+28>>2]&255](bf,F);bf=bk+1|0;bm=c[ab>>2]|0;if((bf|0)<(bm|0)){bk=bf}else{ca=1;cb=bm;break L950}}}else{ca=1;cb=be}}while(0);while(1){L956:do{if((cb|0)>0){be=0;while(1){bk=c[(c[ag>>2]|0)+(be<<2)>>2]|0;aY[c[(c[bk>>2]|0)+32>>2]&255](bk,F);bk=be+1|0;if((bk|0)<(c[ab>>2]|0)){be=bk}else{break L956}}}}while(0);cP(H);if((ca|0)>=3){break}ca=ca+1|0;cb=c[ab>>2]|0}be=c[aR>>2]|0;bF=(be|0)>0;L964:do{if(bF){bg=c[aS>>2]|0;bo=c[aT>>2]|0;bp=0;while(1){bk=c[bo+(c[bg+(bp*152&-1)+148>>2]<<2)>>2]|0;bm=bg+(bp*152&-1)+144|0;L968:do{if((c[bm>>2]|0)>0){bf=0;while(1){g[bk+64+(bf*20&-1)+8>>2]=+g[bg+(bp*152&-1)+(bf*36&-1)+16>>2];g[bk+64+(bf*20&-1)+12>>2]=+g[bg+(bp*152&-1)+(bf*36&-1)+20>>2];bl=bf+1|0;if((bl|0)<(c[bm>>2]|0)){bf=bl}else{break L968}}}}while(0);bm=bp+1|0;if((bm|0)<(be|0)){bp=bm}else{break L964}}}}while(0);L973:do{if((c[V>>2]|0)>0){bp=0;while(1){bg=c[aq>>2]|0;bo=bg+(bp*12&-1)|0;bm=c[bo+4>>2]|0;bH=(c[k>>2]=c[bo>>2]|0,+g[k>>2]);bx=(c[k>>2]=bm,+g[k>>2]);bB=+g[bg+(bp*12&-1)+8>>2];bg=c[ar>>2]|0;bm=bg+(bp*12&-1)|0;bk=c[bm+4>>2]|0;bA=(c[k>>2]=c[bm>>2]|0,+g[k>>2]);bz=(c[k>>2]=bk,+g[k>>2]);by=+g[bg+(bp*12&-1)+8>>2];bu=bA*.01666666753590107;bw=bz*.01666666753590107;bt=bu*bu+bw*bw;if(bt>4.0){bw=2.0/+P(+bt);cc=bA*bw;cd=bz*bw}else{cc=bA;cd=bz}bz=by*.01666666753590107;if(bz*bz>2.4674012660980225){if(bz>0.0){ce=bz}else{ce=-0.0-bz}cf=by*(1.5707963705062866/ce)}else{cf=by}bg=(g[k>>2]=bH+cc*.01666666753590107,c[k>>2]|0);bk=(g[k>>2]=bx+cd*.01666666753590107,c[k>>2]|0)|0;c[bo>>2]=0|bg;c[bo+4>>2]=bk;g[(c[aq>>2]|0)+(bp*12&-1)+8>>2]=bB+cf*.01666666753590107;bk=(c[ar>>2]|0)+(bp*12&-1)|0;bo=(g[k>>2]=cc,c[k>>2]|0);bg=(g[k>>2]=cd,c[k>>2]|0)|0;c[bk>>2]=0|bo;c[bk+4>>2]=bg;g[(c[ar>>2]|0)+(bp*12&-1)+8>>2]=cf;bg=bp+1|0;if((bg|0)<(c[V>>2]|0)){bp=bg}else{break L973}}}}while(0);bp=c[aU>>2]|0;bg=c[aV>>2]|0;bk=0;while(1){if((bk|0)>=3){cg=1;break}L989:do{if(bF){bo=0;bB=0.0;while(1){bm=bp+(bo*88&-1)|0;bf=c[bp+(bo*88&-1)+32>>2]|0;bl=c[bp+(bo*88&-1)+36>>2]|0;bJ=bp+(bo*88&-1)+48|0;bh=c[bJ+4>>2]|0;bx=(c[k>>2]=c[bJ>>2]|0,+g[k>>2]);bH=(c[k>>2]=bh,+g[k>>2]);by=+g[bp+(bo*88&-1)+40>>2];bz=+g[bp+(bo*88&-1)+64>>2];bh=bp+(bo*88&-1)+56|0;bJ=c[bh+4>>2]|0;bA=(c[k>>2]=c[bh>>2]|0,+g[k>>2]);bw=(c[k>>2]=bJ,+g[k>>2]);bt=+g[bp+(bo*88&-1)+44>>2];bu=+g[bp+(bo*88&-1)+68>>2];bJ=c[bp+(bo*88&-1)+84>>2]|0;bh=bg+(bf*12&-1)|0;ch=c[bh+4>>2]|0;bv=(c[k>>2]=c[bh>>2]|0,+g[k>>2]);bM=(c[k>>2]=ch,+g[k>>2]);ch=bg+(bf*12&-1)+8|0;bL=+g[ch>>2];bf=bg+(bl*12&-1)|0;ci=c[bf+4>>2]|0;bK=(c[k>>2]=c[bf>>2]|0,+g[k>>2]);bT=(c[k>>2]=ci,+g[k>>2]);ci=bg+(bl*12&-1)+8|0;bS=+g[ci>>2];L992:do{if((bJ|0)>0){bQ=by+bt;bP=bM;bO=bv;bN=bT;b1=bK;bl=0;bV=bS;b2=bL;bY=bB;while(1){bU=+S(+b2);g[aW>>2]=bU;b_=+R(+b2);g[aX>>2]=b_;bZ=+S(+bV);g[aZ>>2]=bZ;cj=+R(+bV);g[a0>>2]=cj;ck=(g[k>>2]=bO-(bx*b_-bH*bU),c[k>>2]|0);cl=(g[k>>2]=bP-(bH*b_+bx*bU),c[k>>2]|0)|0;c[a1>>2]=0|ck;c[a1+4>>2]=cl;cl=(g[k>>2]=b1-(bA*cj-bw*bZ),c[k>>2]|0);ck=(g[k>>2]=bN-(bw*cj+bA*bZ),c[k>>2]|0)|0;c[a2>>2]=0|cl;c[a2+4>>2]=ck;cQ(D,bm,B,C,bl);ck=c[a4+4>>2]|0;bZ=(c[k>>2]=c[a4>>2]|0,+g[k>>2]);cj=(c[k>>2]=ck,+g[k>>2]);ck=c[a5+4>>2]|0;bU=(c[k>>2]=c[a5>>2]|0,+g[k>>2]);b_=(c[k>>2]=ck,+g[k>>2]);cm=+g[a6>>2];cn=bU-bO;cp=b_-bP;cq=bU-b1;bU=b_-bN;b_=bY<cm?bY:cm;cr=(cm+.004999999888241291)*.20000000298023224;cm=cr<0.0?cr:0.0;cr=cj*cn-bZ*cp;cs=cj*cq-bZ*bU;ct=cs*bu*cs+(bQ+cr*bz*cr);if(ct>0.0){cu=(-0.0-(cm<-.20000000298023224?-.20000000298023224:cm))/ct}else{cu=0.0}ct=bZ*cu;bZ=cj*cu;cj=bO-by*ct;cm=bP-by*bZ;cr=b2-bz*(cn*bZ-cp*ct);cp=b1+bt*ct;cn=bN+bt*bZ;cs=bV+bu*(cq*bZ-bU*ct);ck=bl+1|0;if((ck|0)==(bJ|0)){cv=cm;cw=cj;cx=cn;cy=cp;cz=cs;cA=cr;cB=b_;break L992}else{bP=cm;bO=cj;bN=cn;b1=cp;bl=ck;bV=cs;b2=cr;bY=b_}}}else{cv=bM;cw=bv;cx=bT;cy=bK;cz=bS;cA=bL;cB=bB}}while(0);bJ=(g[k>>2]=cw,c[k>>2]|0);bm=(g[k>>2]=cv,c[k>>2]|0)|0;c[bh>>2]=0|bJ;c[bh+4>>2]=bm;g[ch>>2]=cA;bm=(g[k>>2]=cy,c[k>>2]|0);bJ=(g[k>>2]=cx,c[k>>2]|0)|0;c[bf>>2]=0|bm;c[bf+4>>2]=bJ;g[ci>>2]=cz;bJ=bo+1|0;if((bJ|0)<(be|0)){bo=bJ;bB=cB}else{cC=cB;break L989}}}else{cC=0.0}}while(0);bo=cC>=-.014999999664723873;L1002:do{if((c[ab>>2]|0)>0){bJ=1;bm=0;while(1){bl=c[(c[ag>>2]|0)+(bm<<2)>>2]|0;ck=bJ&a3[c[(c[bl>>2]|0)+36>>2]&255](bl,F);bl=bm+1|0;if((bl|0)<(c[ab>>2]|0)){bJ=ck;bm=bl}else{cD=ck;break L1002}}}else{cD=1}}while(0);if(bo&cD){cg=0;break}else{bk=bk+1|0}}L1008:do{if((c[V>>2]|0)>0){bk=0;while(1){be=c[(c[ae>>2]|0)+(bk<<2)>>2]|0;bg=(c[aq>>2]|0)+(bk*12&-1)|0;bF=be+44|0;bm=c[bg>>2]|0;bJ=c[bg+4>>2]|0;c[bF>>2]=bm;c[bF+4>>2]=bJ;bB=+g[(c[aq>>2]|0)+(bk*12&-1)+8>>2];g[be+56>>2]=bB;bF=(c[ar>>2]|0)+(bk*12&-1)|0;bg=be+64|0;ck=c[bF+4>>2]|0;c[bg>>2]=c[bF>>2]|0;c[bg+4>>2]=ck;g[be+72>>2]=+g[(c[ar>>2]|0)+(bk*12&-1)+8>>2];bL=+S(+bB);g[be+20>>2]=bL;bS=+R(+bB);g[be+24>>2]=bS;bB=+g[be+28>>2];bK=+g[be+32>>2];bT=(c[k>>2]=bm,+g[k>>2])-(bS*bB-bL*bK);bv=(c[k>>2]=bJ,+g[k>>2])-(bL*bB+bS*bK);bJ=be+12|0;be=(g[k>>2]=bT,c[k>>2]|0);bm=(g[k>>2]=bv,c[k>>2]|0)|0;c[bJ>>2]=0|be;c[bJ+4>>2]=bm;bm=bk+1|0;if((bm|0)<(c[V>>2]|0)){bk=bm}else{break L1008}}}}while(0);bk=c[aS>>2]|0;L1012:do{if((c[a7>>2]|0)!=0){if((c[aa>>2]|0)>0){cE=0}else{break}while(1){bo=c[(c[af>>2]|0)+(cE<<2)>>2]|0;bm=c[bk+(cE*152&-1)+144>>2]|0;c[a9>>2]=bm;L1016:do{if((bm|0)>0){bJ=0;while(1){g[E+(bJ<<2)>>2]=+g[bk+(cE*152&-1)+(bJ*36&-1)+16>>2];g[E+8+(bJ<<2)>>2]=+g[bk+(cE*152&-1)+(bJ*36&-1)+20>>2];be=bJ+1|0;if((be|0)==(bm|0)){break L1016}else{bJ=be}}}}while(0);bm=c[a7>>2]|0;a$[c[(c[bm>>2]|0)+20>>2]&255](bm,bo,E);bm=cE+1|0;if((bm|0)<(c[aa>>2]|0)){cE=bm}else{break L1012}}}}while(0);L1022:do{if(!bd){if((c[V>>2]|0)>0){cF=3.4028234663852886e+38;cG=0}else{break}while(1){bm=c[(c[ae>>2]|0)+(cG<<2)>>2]|0;L1026:do{if((c[bm>>2]|0)==0){cH=cF}else{do{if((b[bm+4>>1]&4)<<16>>16!=0){bv=+g[bm+72>>2];if(bv*bv>.001218469929881394){break}bv=+g[bm+64>>2];bT=+g[bm+68>>2];if(bv*bv+bT*bT>9999999747378752.0e-20){break}bJ=bm+144|0;bT=+g[bJ>>2]+.01666666753590107;g[bJ>>2]=bT;cH=cF<bT?cF:bT;break L1026}}while(0);g[bm+144>>2]=0.0;cH=0.0}}while(0);bm=cG+1|0;cK=c[V>>2]|0;if((bm|0)<(cK|0)){cF=cH;cG=bm}else{break}}if((cK|0)>0&((cH<.5|cg)^1)){cL=0}else{break}while(1){bm=c[(c[ae>>2]|0)+(cL<<2)>>2]|0;bo=bm+4|0;b[bo>>1]=b[bo>>1]&-3;g[bm+144>>2]=0.0;c1(bm+64|0,0,24);bm=cL+1|0;if((bm|0)<(c[V>>2]|0)){cL=bm}else{break L1022}}}}while(0);bd=c[a8>>2]|0;b0(bd,bk);b0(bd,bp);g[ao>>2]=+g[ao>>2]+0.0;g[an>>2]=+g[an>>2]+0.0;g[al>>2]=+g[al>>2]+0.0;bd=c[V>>2]|0;if((bd|0)>0){cM=0;cN=bd}else{break}while(1){bd=c[(c[ae>>2]|0)+(cM<<2)>>2]|0;if((c[bd>>2]|0)==0){bm=bd+4|0;b[bm>>1]=b[bm>>1]&-2;cO=c[V>>2]|0}else{cO=cN}bm=cM+1|0;if((bm|0)<(cO|0)){cM=bm;cN=cO}else{break L896}}}}while(0);bc=c[bb+96>>2]|0;if((bc|0)==0){break L892}else{bb=bc}}if((ah|0)==729){aM(5242944,495,5247868,5243208)}else if((ah|0)==714){aM(5244668,54,5247792,5244412)}else if((ah|0)==741){aM(5242944,524,5247868,5243208)}else if((ah|0)==725){aM(5244668,62,5247728,5244492)}else if((ah|0)==711){aM(5242944,445,5247868,5243512)}else if((ah|0)==737){aM(5244668,68,5247760,5244584)}}}while(0);b0(_,W);W=c[Y>>2]|0;L1061:do{if((W|0)!=0){Y=I+8|0;_=I+12|0;cO=I;cN=W;while(1){L1065:do{if((b[cN+4>>1]&1)<<16>>16!=0){if((c[cN>>2]|0)==0){break}cH=+g[cN+52>>2];cF=+S(+cH);g[Y>>2]=cF;cC=+R(+cH);g[_>>2]=cC;cH=+g[cN+28>>2];cB=+g[cN+32>>2];cz=+g[cN+40>>2]-(cF*cH+cC*cB);cM=(g[k>>2]=+g[cN+36>>2]-(cC*cH-cF*cB),c[k>>2]|0);al=(g[k>>2]=cz,c[k>>2]|0)|0;c[cO>>2]=0|cM;c[cO+4>>2]=al;al=(c[cN+88>>2]|0)+102872|0;cM=c[cN+100>>2]|0;if((cM|0)==0){break}an=cN+12|0;ao=cM;while(1){bR(ao,al,I,an);cM=c[ao+4>>2]|0;if((cM|0)==0){break L1065}else{ao=cM}}}}while(0);ao=c[cN+96>>2]|0;if((ao|0)==0){break L1061}else{cN=ao}}}}while(0);bI(O|0,O);g[e+103020>>2]=0.0;I=J|0;b0(c[I>>2]|0,c[J+20>>2]|0);b0(c[I>>2]|0,c[J+24>>2]|0);b0(c[I>>2]|0,c[J+16>>2]|0);b0(c[I>>2]|0,c[J+12>>2]|0);b0(c[I>>2]|0,c[J+8>>2]|0);g[e+103004>>2]=0.0}do{if((a[e+102993|0]&1)<<24>>24!=0){J=v;I=w;W=x;cN=z;cO=A|0;_=e+102944|0;co(u,64,32,0,e+68|0,c[_>>2]|0);L1078:do{if((a[am]&1)<<24>>24!=0){Y=c[e+102952>>2]|0;L1080:do{if((Y|0)!=0){ao=Y;while(1){an=ao+4|0;b[an>>1]=b[an>>1]&-2;g[ao+60>>2]=0.0;an=c[ao+96>>2]|0;if((an|0)==0){break L1080}else{ao=an}}}}while(0);Y=c[U>>2]|0;if((Y|0)==0){break}else{cR=Y}while(1){Y=cR+4|0;c[Y>>2]=c[Y>>2]&-34;c[cR+128>>2]=0;g[cR+132>>2]=1.0;Y=c[cR+12>>2]|0;if((Y|0)==0){break L1078}else{cR=Y}}}}while(0);Y=u+28|0;ao=u+36|0;an=u+32|0;al=u+40|0;cM=u+8|0;cL=u+44|0;cg=u+12|0;cK=y|0;cG=y+4|0;cE=O|0;E=e+102994|0;cD=t+8|0;F=t+12|0;C=t;B=v+16|0;D=v+20|0;cb=v+24|0;ca=v+44|0;H=v+48|0;G=v+52|0;M=v|0;bi=v+28|0;br=v+56|0;bs=v+92|0;bq=v+128|0;ac=q;X=v+56|0;bj=v+60|0;bn=v+64|0;Z=v+68|0;K=v+72|0;bb=v+76|0;V=v+80|0;ae=v+84|0;a8=v+88|0;aa=v+92|0;a7=v+96|0;a9=v+100|0;af=v+104|0;aS=v+108|0;ar=v+112|0;aq=v+116|0;ab=v+120|0;ag=v+124|0;a6=p+4|0;a5=q+28|0;a4=bi;a2=q+88|0;a1=q+56|0;a0=q+64|0;aZ=q+68|0;aX=q+72|0;aW=q+80|0;aV=q+84|0;aU=r+16|0;aT=s|0;aR=s+4|0;ba=s+8|0;aQ=s+12|0;aO=s+16|0;aP=s+20|0;aN=s+24|0;aL=s+28|0;aK=s+32|0;aJ=s+36|0;az=s+40|0;aI=s+44|0;aH=s+48|0;aG=s+52|0;aF=s+56|0;aE=s+60|0;aD=s+64|0;aC=s+68|0;aB=s+72|0;aA=s+76|0;ay=s+80|0;ax=p+9|0;aw=s+92|0;av=aw;au=s+96|0;at=aw|0;aw=p+10|0;as=s+84|0;ap=s+92|0;ak=s+84|0;ai=s+88|0;ad=u+20|0;aj=u+24|0;$=n+24|0;bc=n+28|0;bp=u|0;bk=n+40|0;bm=n|0;bd=n+4|0;bo=n+8|0;bJ=n+12|0;ci=n+16|0;bf=n+20|0;ch=n+21|0;bh=n+32|0;be=n+36|0;ck=o+48|0;bg=o+36|0;bF=o+24|0;bl=h+8|0;cl=h+12|0;cS=j+8|0;cT=j+12|0;cU=h;cV=j;cW=l;cX=l+8|0;cY=l+16|0;c_=o+40|0;c$=u+4|0;c2=o+32|0;c3=m+16|0;L1087:while(1){c4=c[U>>2]|0;if((c4|0)==0){c5=1;ah=1116;break}else{c6=1.0;c7=0;c8=c4}while(1){c4=c8+4|0;c9=c[c4>>2]|0;do{if((c9&4|0)==0){da=c7;db=c6}else{if((c[c8+128>>2]|0)>8){da=c7;db=c6;break}if((c9&32|0)==0){dc=c[c8+48>>2]|0;dd=c[c8+52>>2]|0;if((a[dc+38|0]&1)<<24>>24!=0){da=c7;db=c6;break}if((a[dd+38|0]&1)<<24>>24!=0){da=c7;db=c6;break}de=c[dc+8>>2]|0;df=c[dd+8>>2]|0;dg=c[de>>2]|0;dh=c[df>>2]|0;if(!((dg|0)==2|(dh|0)==2)){ah=874;break L1087}di=b[de+4>>1]|0;dj=b[df+4>>1]|0;if(!((di&2)<<16>>16!=0&(dg|0)!=0|(dj&2)<<16>>16!=0&(dh|0)!=0)){da=c7;db=c6;break}if(!((di&8)<<16>>16!=0|(dg|0)!=2|((dj&8)<<16>>16!=0|(dh|0)!=2))){da=c7;db=c6;break}dh=de+28|0;dj=de+60|0;cz=+g[dj>>2];dg=df+28|0;di=df+60|0;cB=+g[di>>2];do{if(cz<cB){if(cz>=1.0){ah=880;break L1087}cF=(cB-cz)/(1.0-cz);dk=de+36|0;cH=1.0-cF;cC=cH*+g[de+40>>2]+cF*+g[de+48>>2];dl=dk;dm=(g[k>>2]=+g[dk>>2]*cH+cF*+g[de+44>>2],c[k>>2]|0);dk=(g[k>>2]=cC,c[k>>2]|0)|0;c[dl>>2]=0|dm;c[dl+4>>2]=dk;dk=de+52|0;g[dk>>2]=cH*+g[dk>>2]+cF*+g[de+56>>2];g[dj>>2]=cB;dn=cB}else{if(cB>=cz){dn=cz;break}if(cB>=1.0){ah=885;break L1087}cF=(cz-cB)/(1.0-cB);dk=df+36|0;cH=1.0-cF;cC=cH*+g[df+40>>2]+cF*+g[df+48>>2];dl=dk;dm=(g[k>>2]=+g[dk>>2]*cH+cF*+g[df+44>>2],c[k>>2]|0);dk=(g[k>>2]=cC,c[k>>2]|0)|0;c[dl>>2]=0|dm;c[dl+4>>2]=dk;dk=df+52|0;g[dk>>2]=cH*+g[dk>>2]+cF*+g[df+56>>2];g[di>>2]=cz;dn=cz}}while(0);if(dn>=1.0){ah=889;break L1087}di=c[c8+56>>2]|0;df=c[c8+60>>2]|0;c[B>>2]=0;c[D>>2]=0;g[cb>>2]=0.0;c[ca>>2]=0;c[H>>2]=0;g[G>>2]=0.0;bW(M,c[dc+12>>2]|0,di);bW(bi,c[dd+12>>2]|0,df);c0(br|0,dh|0,36);c0(bs|0,dg|0,36);g[bq>>2]=1.0;c[1310730]=(c[1310730]|0)+1|0;cz=+g[X>>2];cB=+g[bj>>2];cF=+g[bn>>2];cH=+g[Z>>2];cC=+g[K>>2];cx=+g[bb>>2];cy=+g[V>>2];cA=+g[ae>>2];cv=+g[a8>>2];cw=+g[aa>>2];cu=+g[a7>>2];cf=+g[a9>>2];cd=+g[af>>2];cc=+g[aS>>2];ce=+g[ar>>2];b9=+g[aq>>2];b6=+g[ab>>2];b7=+g[ag>>2];b8=+N(+(cy/6.2831854820251465))*6.2831854820251465;b3=cy-b8;cy=cA-b8;b8=+N(+(b9/6.2831854820251465))*6.2831854820251465;cA=b9-b8;b9=b6-b8;b8=+g[cb>>2]+ +g[G>>2]+-.014999999664723873;b6=b8<.004999999888241291?.004999999888241291:b8;if(b6<=.0012499999720603228){ah=894;break L1087}b[a6>>1]=0;c0(ac|0,J|0,28);c0(a5|0,a4|0,28);a[a2]=0;b8=b6+.0012499999720603228;b4=b6+-.0012499999720603228;T=0.0;df=0;L1113:while(1){bC=1.0-T;bE=bC*b3+T*cy;bD=+S(+bE);bT=+R(+bE);bE=bC*cF+T*cC-(bT*cz-bD*cB);bv=bC*cH+T*cx-(bD*cz+bT*cB);bK=bC*cA+T*b9;bS=+S(+bK);bB=+R(+bK);bK=bC*cf+T*cc-(bB*cw-bS*cu);bL=bC*cd+T*ce-(bS*cw+bB*cu);di=(g[k>>2]=bE,c[k>>2]|0);dj=(g[k>>2]=bv,c[k>>2]|0)|0;c[a1>>2]=0|di;c[a1+4>>2]=dj;g[a0>>2]=bD;g[aZ>>2]=bT;dj=(g[k>>2]=bK,c[k>>2]|0);di=(g[k>>2]=bL,c[k>>2]|0)|0;c[aX>>2]=0|dj;c[aX+4>>2]=di;g[aW>>2]=bS;g[aV>>2]=bB;bX(r,p,q);bC=+g[aU>>2];if(bC<=0.0){dp=df;dq=0.0;dr=2;break}if(bC<b8){dp=df;dq=T;dr=3;break}c[aT>>2]=M;c[aR>>2]=bi;di=c[a6>>2]|0;dj=di&65535;de=di>>>16;dk=de&255;dl=di>>>24;di=dl&255;if(!(dj<<16>>16!=0&(dj&65535)<3)){ah=901;break L1087}g[ba>>2]=cz;g[aQ>>2]=cB;g[aO>>2]=cF;g[aP>>2]=cH;g[aN>>2]=cC;g[aL>>2]=cx;g[aK>>2]=b3;g[aJ>>2]=cy;g[az>>2]=cv;g[aI>>2]=cw;g[aH>>2]=cu;g[aG>>2]=cf;g[aF>>2]=cd;g[aE>>2]=cc;g[aD>>2]=ce;g[aC>>2]=cA;g[aB>>2]=b9;g[aA>>2]=b7;do{if(dj<<16>>16==1){c[ay>>2]=0;dm=de&255;if((c[D>>2]|0)<=(dm|0)){ah=905;break L1087}ds=(c[B>>2]|0)+(dm<<3)|0;dm=c[ds+4>>2]|0;bC=(c[k>>2]=c[ds>>2]|0,+g[k>>2]);bM=(c[k>>2]=dm,+g[k>>2]);dm=d[ax]|0;if((c[H>>2]|0)<=(dm|0)){ah=908;break L1087}ds=(c[ca>>2]|0)+(dm<<3)|0;dm=c[ds+4>>2]|0;bu=(c[k>>2]=c[ds>>2]|0,+g[k>>2]);bt=(c[k>>2]=dm,+g[k>>2]);bz=bK+(bB*bu-bS*bt)-(bE+(bT*bC-bD*bM));by=bL+(bS*bu+bB*bt)-(bv+(bD*bC+bT*bM));dm=(g[k>>2]=bz,c[k>>2]|0);ds=(g[k>>2]=by,c[k>>2]|0)|0;c[av>>2]=0|dm;c[av+4>>2]=ds;bM=+P(+(bz*bz+by*by));if(bM<1.1920928955078125e-7){dt=1;du=1.0;dv=cF;dw=cH;dx=cC;dy=cx;dz=b3;dA=cy;dB=cz;dC=cB;dD=cf;dE=cd;dF=cc;dG=ce;dH=cA;dI=b9;dJ=cw;dK=cu;dL=0;break}bC=1.0/bM;g[at>>2]=bz*bC;g[au>>2]=by*bC;dt=1;du=1.0;dv=cF;dw=cH;dx=cC;dy=cx;dz=b3;dA=cy;dB=cz;dC=cB;dD=cf;dE=cd;dF=cc;dG=ce;dH=cA;dI=b9;dJ=cw;dK=cu;dL=0;break}else{if(dk<<24>>24==di<<24>>24){c[ay>>2]=2;ds=d[ax]|0;dm=c[H>>2]|0;if((dm|0)<=(ds|0)){ah=914;break L1087}dM=c[ca>>2]|0;dN=dM+(ds<<3)|0;ds=c[dN+4>>2]|0;bC=(c[k>>2]=c[dN>>2]|0,+g[k>>2]);by=(c[k>>2]=ds,+g[k>>2]);ds=d[aw]|0;if((dm|0)<=(ds|0)){ah=917;break L1087}dm=dM+(ds<<3)|0;ds=c[dm+4>>2]|0;bz=(c[k>>2]=c[dm>>2]|0,+g[k>>2]);bM=(c[k>>2]=ds,+g[k>>2]);bt=bM-by;bu=(bz-bC)*-1.0;ds=(g[k>>2]=bt,c[k>>2]|0);dm=(g[k>>2]=bu,c[k>>2]|0)|0;c[av>>2]=0|ds;c[av+4>>2]=dm;bA=+P(+(bt*bt+bu*bu));if(bA<1.1920928955078125e-7){dO=bt;dP=bu}else{bw=1.0/bA;bA=bt*bw;g[at>>2]=bA;bt=bu*bw;g[au>>2]=bt;dO=bA;dP=bt}bt=(bC+bz)*.5;bz=(by+bM)*.5;dm=(g[k>>2]=bt,c[k>>2]|0);ds=(g[k>>2]=bz,c[k>>2]|0)|0;c[as>>2]=0|dm;c[as+4>>2]=ds;ds=de&255;if((c[D>>2]|0)<=(ds|0)){ah=922;break L1087}dm=(c[B>>2]|0)+(ds<<3)|0;ds=c[dm+4>>2]|0;bM=(c[k>>2]=c[dm>>2]|0,+g[k>>2]);by=(c[k>>2]=ds,+g[k>>2]);if((bB*dO-bS*dP)*(bE+(bT*bM-bD*by)-(bK+(bB*bt-bS*bz)))+(bS*dO+bB*dP)*(bv+(bD*bM+bT*by)-(bL+(bS*bt+bB*bz)))>=0.0){dt=1;du=1.0;dv=cF;dw=cH;dx=cC;dy=cx;dz=b3;dA=cy;dB=cz;dC=cB;dD=cf;dE=cd;dF=cc;dG=ce;dH=cA;dI=b9;dJ=cw;dK=cu;dL=2;break}ds=(g[k>>2]=-0.0-dO,c[k>>2]|0);dm=(g[k>>2]=-0.0-dP,c[k>>2]|0)|0;c[av>>2]=0|ds;c[av+4>>2]=dm;dt=1;du=1.0;dv=cF;dw=cH;dx=cC;dy=cx;dz=b3;dA=cy;dB=cz;dC=cB;dD=cf;dE=cd;dF=cc;dG=ce;dH=cA;dI=b9;dJ=cw;dK=cu;dL=2;break}else{c[ay>>2]=1;dm=de&255;ds=c[D>>2]|0;if((ds|0)<=(dm|0)){ah=927;break L1087}dM=c[B>>2]|0;dN=dM+(dm<<3)|0;dm=c[dN+4>>2]|0;bz=(c[k>>2]=c[dN>>2]|0,+g[k>>2]);bt=(c[k>>2]=dm,+g[k>>2]);if((ds|0)<=(dl|0)){ah=930;break L1087}ds=dM+(dl<<3)|0;dM=c[ds+4>>2]|0;by=(c[k>>2]=c[ds>>2]|0,+g[k>>2]);bM=(c[k>>2]=dM,+g[k>>2]);bC=bM-bt;bA=(by-bz)*-1.0;dM=(g[k>>2]=bC,c[k>>2]|0);ds=(g[k>>2]=bA,c[k>>2]|0)|0;c[av>>2]=0|dM;c[av+4>>2]=ds;bw=+P(+(bC*bC+bA*bA));if(bw<1.1920928955078125e-7){dQ=bC;dR=bA}else{bu=1.0/bw;bw=bC*bu;g[at>>2]=bw;bC=bA*bu;g[au>>2]=bC;dQ=bw;dR=bC}bC=(bz+by)*.5;by=(bt+bM)*.5;ds=(g[k>>2]=bC,c[k>>2]|0);dM=(g[k>>2]=by,c[k>>2]|0)|0;c[as>>2]=0|ds;c[as+4>>2]=dM;dM=d[ax]|0;if((c[H>>2]|0)<=(dM|0)){ah=935;break L1087}ds=(c[ca>>2]|0)+(dM<<3)|0;dM=c[ds+4>>2]|0;bM=(c[k>>2]=c[ds>>2]|0,+g[k>>2]);bt=(c[k>>2]=dM,+g[k>>2]);if((bT*dQ-bD*dR)*(bK+(bB*bM-bS*bt)-(bE+(bT*bC-bD*by)))+(bD*dQ+bT*dR)*(bL+(bS*bM+bB*bt)-(bv+(bD*bC+bT*by)))>=0.0){dt=1;du=1.0;dv=cF;dw=cH;dx=cC;dy=cx;dz=b3;dA=cy;dB=cz;dC=cB;dD=cf;dE=cd;dF=cc;dG=ce;dH=cA;dI=b9;dJ=cw;dK=cu;dL=1;break}dM=(g[k>>2]=-0.0-dQ,c[k>>2]|0);ds=(g[k>>2]=-0.0-dR,c[k>>2]|0)|0;c[av>>2]=0|dM;c[av+4>>2]=ds;dt=1;du=1.0;dv=cF;dw=cH;dx=cC;dy=cx;dz=b3;dA=cy;dB=cz;dC=cB;dD=cf;dE=cd;dF=cc;dG=ce;dH=cA;dI=b9;dJ=cw;dK=cu;dL=1;break}}}while(0);while(1){bT=1.0-du;bD=bT*dz+dA*du;bv=+S(+bD);bB=+R(+bD);bD=bT*dv+dx*du-(bB*dB-bv*dC);bS=bT*dw+dy*du-(bv*dB+bB*dC);bL=bT*dH+dI*du;bE=+S(+bL);bK=+R(+bL);bL=bT*dD+dF*du-(bK*dJ-bE*dK);by=bT*dE+dG*du-(bE*dJ+bK*dK);if((dL|0)==0){bT=+g[ap>>2];bC=+g[au>>2];bt=bB*bT+bv*bC;bM=bT*(-0.0-bv)+bB*bC;bz=-0.0-bC;bw=bK*(-0.0-bT)+bE*bz;bu=bE*bT+bK*bz;dl=c[aT>>2]|0;de=c[dl+16>>2]|0;di=c[dl+20>>2]|0;L1146:do{if((di|0)>1){bz=bM*+g[de+4>>2]+bt*+g[de>>2];dl=1;dk=0;while(1){bA=bt*+g[de+(dl<<3)>>2]+bM*+g[de+(dl<<3)+4>>2];dj=bA>bz;ds=dj?dl:dk;dM=dl+1|0;if((dM|0)==(di|0)){dS=ds;break L1146}else{bz=dj?bA:bz;dl=dM;dk=ds}}}else{dS=0}}while(0);dk=c[aR>>2]|0;dl=c[dk+16>>2]|0;ds=c[dk+20>>2]|0;L1151:do{if((ds|0)>1){bM=bu*+g[dl+4>>2]+bw*+g[dl>>2];dk=1;dM=0;while(1){bt=bw*+g[dl+(dk<<3)>>2]+bu*+g[dl+(dk<<3)+4>>2];dj=bt>bM;dm=dj?dk:dM;dN=dk+1|0;if((dN|0)==(ds|0)){dT=dm;break L1151}else{bM=dj?bt:bM;dk=dN;dM=dm}}}else{dT=0}}while(0);if(!((dS|0)>-1&(di|0)>(dS|0))){ah=947;break L1087}dM=de+(dS<<3)|0;dk=c[dM+4>>2]|0;bu=(c[k>>2]=c[dM>>2]|0,+g[k>>2]);bw=(c[k>>2]=dk,+g[k>>2]);if(!((dT|0)>-1&(ds|0)>(dT|0))){ah=950;break L1087}dk=dl+(dT<<3)|0;dM=c[dk+4>>2]|0;bM=(c[k>>2]=c[dk>>2]|0,+g[k>>2]);bt=(c[k>>2]=dM,+g[k>>2]);dU=bT*(bL+(bK*bM-bE*bt)-(bD+(bB*bu-bv*bw)))+bC*(by+(bE*bM+bK*bt)-(bS+(bv*bu+bB*bw)));dV=dS;dW=dT}else if((dL|0)==1){bw=+g[ap>>2];bu=+g[au>>2];bt=bB*bw-bv*bu;bM=bv*bw+bB*bu;bu=+g[ak>>2];bw=+g[ai>>2];bz=bD+(bB*bu-bv*bw);bA=bS+(bv*bu+bB*bw);bw=-0.0-bM;bu=bK*(-0.0-bt)+bE*bw;bx=bE*bt+bK*bw;dM=c[aR>>2]|0;dk=c[dM+16>>2]|0;dm=c[dM+20>>2]|0;if((dm|0)>1){bw=bx*+g[dk+4>>2]+bu*+g[dk>>2];dM=1;dN=0;while(1){bH=bu*+g[dk+(dM<<3)>>2]+bx*+g[dk+(dM<<3)+4>>2];dj=bH>bw;dX=dj?dM:dN;dY=dM+1|0;if((dY|0)==(dm|0)){break}else{bw=dj?bH:bw;dM=dY;dN=dX}}if((dX|0)>-1){dZ=dX}else{ah=958;break L1087}}else{dZ=0}if((dm|0)<=(dZ|0)){ah=958;break L1087}dN=dk+(dZ<<3)|0;dM=c[dN+4>>2]|0;bw=(c[k>>2]=c[dN>>2]|0,+g[k>>2]);bx=(c[k>>2]=dM,+g[k>>2]);dU=bt*(bL+(bK*bw-bE*bx)-bz)+bM*(by+(bE*bw+bK*bx)-bA);dV=-1;dW=dZ}else if((dL|0)==2){bx=+g[ap>>2];bw=+g[au>>2];bu=bK*bx-bE*bw;bC=bE*bx+bK*bw;bw=+g[ak>>2];bx=+g[ai>>2];bT=bL+(bK*bw-bE*bx);bH=by+(bE*bw+bK*bx);bx=-0.0-bC;bw=bB*(-0.0-bu)+bv*bx;bY=bv*bu+bB*bx;dM=c[aT>>2]|0;dN=c[dM+16>>2]|0;dl=c[dM+20>>2]|0;if((dl|0)>1){bx=bY*+g[dN+4>>2]+bw*+g[dN>>2];dM=1;ds=0;while(1){b2=bw*+g[dN+(dM<<3)>>2]+bY*+g[dN+(dM<<3)+4>>2];de=b2>bx;d_=de?dM:ds;di=dM+1|0;if((di|0)==(dl|0)){break}else{bx=de?b2:bx;dM=di;ds=d_}}if((d_|0)>-1){d$=d_}else{ah=966;break L1087}}else{d$=0}if((dl|0)<=(d$|0)){ah=966;break L1087}ds=dN+(d$<<3)|0;dM=c[ds+4>>2]|0;bx=(c[k>>2]=c[ds>>2]|0,+g[k>>2]);bY=(c[k>>2]=dM,+g[k>>2]);dU=bu*(bD+(bB*bx-bv*bY)-bT)+bC*(bS+(bv*bx+bB*bY)-bH);dV=d$;dW=-1}else{ah=969;break L1087}if(dU>b8){d0=1.0;d1=4;ah=986;break L1113}if(dU>b4){d2=du;break}bY=+b$(s,dV,dW,T);if(bY<b4){d0=T;d1=1;ah=986;break L1113}if(bY>b8){d3=du;d4=T;d5=0;d6=bY;d7=dU}else{d0=T;d1=3;ah=986;break L1113}while(1){if((d5&1|0)==0){d8=(d4+d3)*.5}else{d8=d4+(b6-d6)*(d3-d4)/(d7-d6)}bY=+b$(s,dV,dW,d8);bx=bY-b6;if(bx>0.0){d9=bx}else{d9=-0.0-bx}if(d9<.0012499999720603228){ea=d5;eb=d8;break}dM=bY>b6;ds=d5+1|0;c[1310726]=(c[1310726]|0)+1|0;if((ds|0)==50){ea=50;eb=du;break}else{d3=dM?d3:d8;d4=dM?d8:d4;d5=ds;d6=dM?bY:d6;d7=dM?d7:bY}}dN=c[1310727]|0;c[1310727]=(dN|0)>(ea|0)?dN:ea;if((dt|0)==8){d2=T;break}dt=dt+1|0;du=eb;dv=+g[aO>>2];dw=+g[aP>>2];dx=+g[aN>>2];dy=+g[aL>>2];dz=+g[aK>>2];dA=+g[aJ>>2];dB=+g[ba>>2];dC=+g[aQ>>2];dD=+g[aG>>2];dE=+g[aF>>2];dF=+g[aE>>2];dG=+g[aD>>2];dH=+g[aC>>2];dI=+g[aB>>2];dJ=+g[aI>>2];dK=+g[aH>>2];dL=c[ay>>2]|0}dN=df+1|0;c[1310729]=(c[1310729]|0)+1|0;if((dN|0)==20){dp=20;dq=d2;dr=1;break}else{T=d2;df=dN}}if((ah|0)==986){ah=0;c[1310729]=(c[1310729]|0)+1|0;dp=df+1|0;dq=d0;dr=d1}dg=c[1310728]|0;c[1310728]=(dg|0)>(dp|0)?dg:dp;if((dr|0)==3){T=dn+(1.0-dn)*dq;ec=T<1.0?T:1.0}else{ec=1.0}g[c8+132>>2]=ec;c[c4>>2]=c[c4>>2]|32;ed=ec}else{ed=+g[c8+132>>2]}if(ed>=c6){da=c7;db=c6;break}da=c8;db=ed}}while(0);c4=c[c8+12>>2]|0;if((c4|0)==0){break}else{c6=db;c7=da;c8=c4}}if((da|0)==0|db>.9999988079071045){c5=1;ah=1116;break}c4=c[(c[da+48>>2]|0)+8>>2]|0;c9=c[(c[da+52>>2]|0)+8>>2]|0;dg=c4+28|0;c0(I|0,dg|0,36);dh=c9+28|0;c0(W|0,dh|0,36);dd=c4+60|0;T=+g[dd>>2];if(T>=1.0){ah=996;break}b6=(db-T)/(1.0-T);dc=c4+36|0;T=1.0-b6;dN=c4+44|0;dl=c4+48|0;b8=+g[dc>>2]*T+b6*+g[dN>>2];b4=T*+g[c4+40>>2]+b6*+g[dl>>2];dM=dc;dc=(g[k>>2]=b8,c[k>>2]|0);ds=0|dc;dc=(g[k>>2]=b4,c[k>>2]|0)|0;c[dM>>2]=ds;c[dM+4>>2]=dc;dM=c4+52|0;dk=c4+56|0;cu=T*+g[dM>>2]+b6*+g[dk>>2];g[dM>>2]=cu;g[dd>>2]=db;dd=c4+44|0;c[dd>>2]=ds;c[dd+4>>2]=dc;g[dk>>2]=cu;b6=+S(+cu);dc=c4+20|0;g[dc>>2]=b6;T=+R(+cu);dd=c4+24|0;g[dd>>2]=T;ds=c4+28|0;cu=+g[ds>>2];dM=c4+32|0;cw=+g[dM>>2];dm=c4+12|0;di=(g[k>>2]=b8-(T*cu-b6*cw),c[k>>2]|0);de=(g[k>>2]=b4-(b6*cu+T*cw),c[k>>2]|0)|0;c[dm>>2]=0|di;c[dm+4>>2]=de;de=c9+60|0;cw=+g[de>>2];if(cw>=1.0){ah=999;break}T=(db-cw)/(1.0-cw);di=c9+36|0;cw=1.0-T;dY=c9+44|0;dj=c9+48|0;cu=+g[di>>2]*cw+T*+g[dY>>2];b6=cw*+g[c9+40>>2]+T*+g[dj>>2];ee=di;di=(g[k>>2]=cu,c[k>>2]|0);ef=0|di;di=(g[k>>2]=b6,c[k>>2]|0)|0;c[ee>>2]=ef;c[ee+4>>2]=di;ee=c9+52|0;eg=c9+56|0;b4=cw*+g[ee>>2]+T*+g[eg>>2];g[ee>>2]=b4;g[de>>2]=db;de=c9+44|0;c[de>>2]=ef;c[de+4>>2]=di;g[eg>>2]=b4;T=+S(+b4);di=c9+20|0;g[di>>2]=T;cw=+R(+b4);de=c9+24|0;g[de>>2]=cw;ef=c9+28|0;b4=+g[ef>>2];ee=c9+32|0;b8=+g[ee>>2];eh=c9+12|0;ei=(g[k>>2]=cu-(cw*b4-T*b8),c[k>>2]|0);ej=(g[k>>2]=b6-(T*b4+cw*b8),c[k>>2]|0)|0;c[eh>>2]=0|ei;c[eh+4>>2]=ej;b5(da,c[_>>2]|0);ej=da+4|0;ei=c[ej>>2]|0;c[ej>>2]=ei&-33;ek=da+128|0;c[ek>>2]=(c[ek>>2]|0)+1|0;if((ei&6|0)!=6){c[ej>>2]=ei&-37;c0(dg|0,I|0,36);c0(dh|0,W|0,36);b8=+g[dk>>2];cw=+S(+b8);g[dc>>2]=cw;b4=+R(+b8);g[dd>>2]=b4;b8=+g[ds>>2];T=+g[dM>>2];b6=+g[dl>>2]-(cw*b8+b4*T);dl=(g[k>>2]=+g[dN>>2]-(b4*b8-cw*T),c[k>>2]|0);dN=(g[k>>2]=b6,c[k>>2]|0)|0;c[dm>>2]=0|dl;c[dm+4>>2]=dN;b6=+g[eg>>2];T=+S(+b6);g[di>>2]=T;cw=+R(+b6);g[de>>2]=cw;b6=+g[ef>>2];b8=+g[ee>>2];b4=+g[dj>>2]-(T*b6+cw*b8);dj=(g[k>>2]=+g[dY>>2]-(cw*b6-T*b8),c[k>>2]|0);dY=(g[k>>2]=b4,c[k>>2]|0)|0;c[eh>>2]=0|dj;c[eh+4>>2]=dY;continue}dY=c4+4|0;eh=b[dY>>1]|0;if((eh&2)<<16>>16==0){b[dY>>1]=eh|2;g[c4+144>>2]=0.0}eh=c9+4|0;dj=b[eh>>1]|0;if((dj&2)<<16>>16==0){b[eh>>1]=dj|2;g[c9+144>>2]=0.0}c[Y>>2]=0;c[ao>>2]=0;c[an>>2]=0;dj=c[al>>2]|0;if((dj|0)<=0){ah=1009;break}ee=c4+8|0;c[ee>>2]=0;ef=c[cM>>2]|0;c[ef>>2]=c4;c[Y>>2]=1;if((dj|0)<=1){ah=1012;break}dj=c9+8|0;c[dj>>2]=1;c[ef+4>>2]=c9;c[Y>>2]=2;if((c[cL>>2]|0)<=0){ah=1015;break}c[ao>>2]=1;c[c[cg>>2]>>2]=da;b[dY>>1]=b[dY>>1]|1;b[eh>>1]=b[eh>>1]|1;c[ej>>2]=c[ej>>2]|1;c[cK>>2]=c4;c[cG>>2]=c9;c9=1;ej=c4;while(1){L1221:do{if((c[ej>>2]|0)==2){c4=c[ej+112>>2]|0;if((c4|0)==0){break}eh=ej+4|0;dY=c[al>>2]|0;ef=c4;c4=c[Y>>2]|0;while(1){if((c4|0)==(dY|0)){break L1221}de=c[ao>>2]|0;di=c[cL>>2]|0;if((de|0)==(di|0)){break L1221}eg=c[ef+4>>2]|0;dN=eg+4|0;L1228:do{if((c[dN>>2]&1|0)==0){dm=c[ef>>2]|0;dl=dm|0;do{if((c[dl>>2]|0)==2){if((b[eh>>1]&8)<<16>>16!=0){break}if((b[dm+4>>1]&8)<<16>>16==0){el=c4;break L1228}}}while(0);if((a[(c[eg+48>>2]|0)+38|0]&1)<<24>>24!=0){el=c4;break}if((a[(c[eg+52>>2]|0)+38|0]&1)<<24>>24!=0){el=c4;break}dM=dm+28|0;c0(cN|0,dM|0,36);ds=dm+4|0;if((b[ds>>1]&1)<<16>>16==0){dd=dm+60|0;b4=+g[dd>>2];if(b4>=1.0){ah=1031;break L1087}b8=(db-b4)/(1.0-b4);dc=dm+36|0;b4=1.0-b8;T=+g[dc>>2]*b4+b8*+g[dm+44>>2];b6=b4*+g[dm+40>>2]+b8*+g[dm+48>>2];dk=dc;dc=(g[k>>2]=T,c[k>>2]|0);dh=0|dc;dc=(g[k>>2]=b6,c[k>>2]|0)|0;c[dk>>2]=dh;c[dk+4>>2]=dc;dk=dm+52|0;dg=dm+56|0;cw=b4*+g[dk>>2]+b8*+g[dg>>2];g[dk>>2]=cw;g[dd>>2]=db;dd=dm+44|0;c[dd>>2]=dh;c[dd+4>>2]=dc;g[dg>>2]=cw;b8=+S(+cw);g[dm+20>>2]=b8;b4=+R(+cw);g[dm+24>>2]=b4;cw=+g[dm+28>>2];cu=+g[dm+32>>2];dg=dm+12|0;dc=(g[k>>2]=T-(b4*cw-b8*cu),c[k>>2]|0);dd=(g[k>>2]=b6-(b8*cw+b4*cu),c[k>>2]|0)|0;c[dg>>2]=0|dc;c[dg+4>>2]=dd}b5(eg,c[_>>2]|0);dd=c[dN>>2]|0;if((dd&4|0)==0){c0(dM|0,cN|0,36);cu=+g[dm+56>>2];b4=+S(+cu);g[dm+20>>2]=b4;cw=+R(+cu);g[dm+24>>2]=cw;cu=+g[dm+28>>2];b8=+g[dm+32>>2];b6=+g[dm+48>>2]-(b4*cu+cw*b8);dg=dm+12|0;dc=(g[k>>2]=+g[dm+44>>2]-(cw*cu-b4*b8),c[k>>2]|0);dh=(g[k>>2]=b6,c[k>>2]|0)|0;c[dg>>2]=0|dc;c[dg+4>>2]=dh;el=c4;break}if((dd&2|0)==0){c0(dM|0,cN|0,36);b6=+g[dm+56>>2];b8=+S(+b6);g[dm+20>>2]=b8;b4=+R(+b6);g[dm+24>>2]=b4;b6=+g[dm+28>>2];cu=+g[dm+32>>2];cw=+g[dm+48>>2]-(b8*b6+b4*cu);dM=dm+12|0;dh=(g[k>>2]=+g[dm+44>>2]-(b4*b6-b8*cu),c[k>>2]|0);dg=(g[k>>2]=cw,c[k>>2]|0)|0;c[dM>>2]=0|dh;c[dM+4>>2]=dg;el=c4;break}c[dN>>2]=dd|1;if((de|0)>=(di|0)){ah=1040;break L1087}c[ao>>2]=de+1|0;c[(c[cg>>2]|0)+(de<<2)>>2]=eg;dd=b[ds>>1]|0;if((dd&1)<<16>>16!=0){el=c4;break}b[ds>>1]=dd|1;do{if((c[dl>>2]|0)!=0){if((dd&2)<<16>>16!=0){break}b[ds>>1]=dd|3;g[dm+144>>2]=0.0}}while(0);if((c4|0)>=(dY|0)){ah=1047;break L1087}c[dm+8>>2]=c4;c[(c[cM>>2]|0)+(c4<<2)>>2]=dm;dd=c4+1|0;c[Y>>2]=dd;el=dd}else{el=c4}}while(0);eg=c[ef+12>>2]|0;if((eg|0)==0){break L1221}else{ef=eg;c4=el}}}}while(0);if((c9|0)>=2){break}c4=c[y+(c9<<2)>>2]|0;c9=c9+1|0;ej=c4}cw=(1.0-db)*.01666666753590107;cu=1.0/cw;ej=c[ee>>2]|0;c9=c[dj>>2]|0;c4=c[Y>>2]|0;if((c4|0)<=(ej|0)){ah=1054;break}if((c4|0)<=(c9|0)){ah=1060;break}ef=(c4|0)>0;L1260:do{if(ef){dY=c[cM>>2]|0;eh=c[ad>>2]|0;df=c[aj>>2]|0;eg=0;while(1){de=c[dY+(eg<<2)>>2]|0;di=de+44|0;dN=eh+(eg*12&-1)|0;dd=c[di+4>>2]|0;c[dN>>2]=c[di>>2]|0;c[dN+4>>2]=dd;g[eh+(eg*12&-1)+8>>2]=+g[de+56>>2];dd=de+64|0;dN=df+(eg*12&-1)|0;di=c[dd+4>>2]|0;c[dN>>2]=c[dd>>2]|0;c[dN+4>>2]=di;g[df+(eg*12&-1)+8>>2]=+g[de+72>>2];de=eg+1|0;if((de|0)<(c4|0)){eg=de}else{em=eh;en=df;break L1260}}}else{em=c[ad>>2]|0;en=c[aj>>2]|0}}while(0);dj=c[cg>>2]|0;c[$>>2]=dj;ee=c[ao>>2]|0;c[bc>>2]=ee;c[bk>>2]=c[bp>>2]|0;g[bm>>2]=cw;g[bd>>2]=cu;g[bo>>2]=1.0;c[bJ>>2]=3;c[ci>>2]=20;a[bf]=0;c0(ch|0,cO|0,3);c[bh>>2]=em;c[be>>2]=en;cI(o,n);df=c[ck>>2]|0;eh=(df|0)>0;eg=c[bg>>2]|0;dY=c[bF>>2]|0;de=0;while(1){if((de|0)>=20){break}L1270:do{if(eh){di=0;b8=0.0;while(1){dN=eg+(di*88&-1)|0;dd=c[eg+(di*88&-1)+32>>2]|0;ds=c[eg+(di*88&-1)+36>>2]|0;dl=eg+(di*88&-1)+48|0;dg=c[dl+4>>2]|0;b6=(c[k>>2]=c[dl>>2]|0,+g[k>>2]);b4=(c[k>>2]=dg,+g[k>>2]);dg=eg+(di*88&-1)+56|0;dl=c[dg+4>>2]|0;T=(c[k>>2]=c[dg>>2]|0,+g[k>>2]);b9=(c[k>>2]=dl,+g[k>>2]);dl=c[eg+(di*88&-1)+84>>2]|0;if((dd|0)==(ej|0)|(dd|0)==(c9|0)){eo=+g[eg+(di*88&-1)+40>>2];ep=+g[eg+(di*88&-1)+64>>2]}else{eo=0.0;ep=0.0}cA=+g[eg+(di*88&-1)+44>>2];ce=+g[eg+(di*88&-1)+68>>2];dg=dY+(dd*12&-1)|0;dM=c[dg+4>>2]|0;cc=(c[k>>2]=c[dg>>2]|0,+g[k>>2]);cd=(c[k>>2]=dM,+g[k>>2]);dM=dY+(dd*12&-1)+8|0;cf=+g[dM>>2];dd=dY+(ds*12&-1)|0;dh=c[dd+4>>2]|0;cB=(c[k>>2]=c[dd>>2]|0,+g[k>>2]);cz=(c[k>>2]=dh,+g[k>>2]);dh=dY+(ds*12&-1)+8|0;cy=+g[dh>>2];L1276:do{if((dl|0)>0){b3=eo+cA;cx=cd;cC=cc;cH=cz;cF=cB;b7=cf;cv=cy;ds=0;bH=b8;while(1){bB=+S(+b7);g[bl>>2]=bB;bv=+R(+b7);g[cl>>2]=bv;bS=+S(+cv);g[cS>>2]=bS;bC=+R(+cv);g[cT>>2]=bC;dc=(g[k>>2]=cC-(b6*bv-b4*bB),c[k>>2]|0);dk=(g[k>>2]=cx-(b4*bv+b6*bB),c[k>>2]|0)|0;c[cU>>2]=0|dc;c[cU+4>>2]=dk;dk=(g[k>>2]=cF-(T*bC-b9*bS),c[k>>2]|0);dc=(g[k>>2]=cH-(b9*bC+T*bS),c[k>>2]|0)|0;c[cV>>2]=0|dk;c[cV+4>>2]=dc;cQ(l,dN,h,j,ds);dc=c[cW+4>>2]|0;bS=(c[k>>2]=c[cW>>2]|0,+g[k>>2]);bC=(c[k>>2]=dc,+g[k>>2]);dc=c[cX+4>>2]|0;bB=(c[k>>2]=c[cX>>2]|0,+g[k>>2]);bv=(c[k>>2]=dc,+g[k>>2]);bT=+g[cY>>2];bD=bB-cC;bu=bv-cx;bY=bB-cF;bB=bv-cH;bv=bH<bT?bH:bT;bx=(bT+.004999999888241291)*.75;bT=bx<0.0?bx:0.0;bx=bC*bD-bS*bu;bw=bC*bY-bS*bB;bK=bw*ce*bw+(b3+bx*ep*bx);if(bK>0.0){eq=(-0.0-(bT<-.20000000298023224?-.20000000298023224:bT))/bK}else{eq=0.0}bK=bS*eq;bS=bC*eq;bC=cC-eo*bK;bT=cx-eo*bS;bx=b7-ep*(bD*bS-bu*bK);bu=cF+cA*bK;bD=cH+cA*bS;bw=cv+ce*(bY*bS-bB*bK);dc=ds+1|0;if((dc|0)==(dl|0)){er=bT;es=bC;et=bD;eu=bu;ev=bx;ew=bw;ex=bv;break L1276}else{cx=bT;cC=bC;cH=bD;cF=bu;b7=bx;cv=bw;ds=dc;bH=bv}}}else{er=cd;es=cc;et=cz;eu=cB;ev=cf;ew=cy;ex=b8}}while(0);dl=(g[k>>2]=es,c[k>>2]|0);dN=(g[k>>2]=er,c[k>>2]|0)|0;c[dg>>2]=0|dl;c[dg+4>>2]=dN;g[dM>>2]=ev;dN=(g[k>>2]=eu,c[k>>2]|0);dl=(g[k>>2]=et,c[k>>2]|0)|0;c[dd>>2]=0|dN;c[dd+4>>2]=dl;g[dh>>2]=ew;dl=di+1|0;if((dl|0)<(df|0)){di=dl;b8=ex}else{ey=ex;break L1270}}}else{ey=0.0}}while(0);if(ey<-.007499999832361937){de=de+1|0}else{break}}de=c[cM>>2]|0;df=de+(ej<<2)|0;dY=em+(ej*12&-1)|0;eg=(c[df>>2]|0)+36|0;eh=c[dY+4>>2]|0;c[eg>>2]=c[dY>>2]|0;c[eg+4>>2]=eh;g[(c[df>>2]|0)+52>>2]=+g[em+(ej*12&-1)+8>>2];df=de+(c9<<2)|0;eh=em+(c9*12&-1)|0;eg=(c[df>>2]|0)+36|0;dY=c[eh+4>>2]|0;c[eg>>2]=c[eh>>2]|0;c[eg+4>>2]=dY;g[(c[df>>2]|0)+52>>2]=+g[em+(c9*12&-1)+8>>2];cJ(o);df=0;while(1){cP(o);dY=df+1|0;if((dY|0)<3){df=dY}else{break}}L1291:do{if(ef){df=0;c9=em;ej=en;while(1){dY=c9+(df*12&-1)|0;eg=c[dY+4>>2]|0;cu=(c[k>>2]=c[dY>>2]|0,+g[k>>2]);b8=(c[k>>2]=eg,+g[k>>2]);cy=+g[c9+(df*12&-1)+8>>2];eg=ej+(df*12&-1)|0;eh=c[eg+4>>2]|0;cf=(c[k>>2]=c[eg>>2]|0,+g[k>>2]);cB=(c[k>>2]=eh,+g[k>>2]);cz=+g[ej+(df*12&-1)+8>>2];cc=cw*cf;cd=cw*cB;ce=cc*cc+cd*cd;if(ce>4.0){cd=2.0/+P(+ce);ez=cf*cd;eA=cB*cd}else{ez=cf;eA=cB}cB=cw*cz;if(cB*cB>2.4674012660980225){if(cB>0.0){eB=cB}else{eB=-0.0-cB}eC=cz*(1.5707963705062866/eB)}else{eC=cz}cz=cu+cw*ez;cu=b8+cw*eA;b8=cy+cw*eC;eh=(g[k>>2]=cz,c[k>>2]|0);eg=0|eh;eh=(g[k>>2]=cu,c[k>>2]|0)|0;c[dY>>2]=eg;c[dY+4>>2]=eh;dY=c[ad>>2]|0;g[dY+(df*12&-1)+8>>2]=b8;di=c[aj>>2]|0;dl=di+(df*12&-1)|0;dN=(g[k>>2]=ez,c[k>>2]|0);ds=0|dN;dN=(g[k>>2]=eA,c[k>>2]|0)|0;c[dl>>2]=ds;c[dl+4>>2]=dN;g[di+(df*12&-1)+8>>2]=eC;dl=c[cM>>2]|0;dm=c[dl+(df<<2)>>2]|0;dc=dm+44|0;c[dc>>2]=eg;c[dc+4>>2]=eh;g[dm+56>>2]=b8;eh=dm+64|0;c[eh>>2]=ds;c[eh+4>>2]=dN;g[dm+72>>2]=eC;cy=+S(+b8);g[dm+20>>2]=cy;cB=+R(+b8);g[dm+24>>2]=cB;b8=+g[dm+28>>2];cf=+g[dm+32>>2];dN=dm+12|0;dm=(g[k>>2]=cz-(cB*b8-cy*cf),c[k>>2]|0);eh=(g[k>>2]=cu-(cy*b8+cB*cf),c[k>>2]|0)|0;c[dN>>2]=0|dm;c[dN+4>>2]=eh;eh=df+1|0;dN=c[Y>>2]|0;if((eh|0)<(dN|0)){df=eh;c9=dY;ej=di}else{eD=dN;eE=dl;break L1291}}}else{eD=c4;eE=de}}while(0);de=c[c_>>2]|0;c4=c[c$>>2]|0;L1304:do{if((c4|0)!=0&(ee|0)>0){ef=0;while(1){ej=c[dj+(ef<<2)>>2]|0;c9=c[de+(ef*152&-1)+144>>2]|0;c[c3>>2]=c9;L1307:do{if((c9|0)>0){df=0;while(1){g[m+(df<<2)>>2]=+g[de+(ef*152&-1)+(df*36&-1)+16>>2];g[m+8+(df<<2)>>2]=+g[de+(ef*152&-1)+(df*36&-1)+20>>2];dl=df+1|0;if((dl|0)==(c9|0)){break L1307}else{df=dl}}}}while(0);a$[c[(c[c4>>2]|0)+20>>2]&255](c4,ej,m);c9=ef+1|0;if((c9|0)<(ee|0)){ef=c9}else{break L1304}}}}while(0);ee=c[c2>>2]|0;b0(ee,de);b0(ee,c[bg>>2]|0);L1315:do{if((eD|0)>0){ee=0;while(1){c4=c[eE+(ee<<2)>>2]|0;dj=c4+4|0;b[dj>>1]=b[dj>>1]&-2;L1318:do{if((c[c4>>2]|0)==2){cw=+g[c4+52>>2];cf=+S(+cw);g[cD>>2]=cf;cB=+R(+cw);g[F>>2]=cB;cw=+g[c4+28>>2];b8=+g[c4+32>>2];cy=+g[c4+40>>2]-(cf*cw+cB*b8);dj=(g[k>>2]=+g[c4+36>>2]-(cB*cw-cf*b8),c[k>>2]|0);ef=(g[k>>2]=cy,c[k>>2]|0)|0;c[C>>2]=0|dj;c[C+4>>2]=ef;ef=(c[c4+88>>2]|0)+102872|0;dj=c[c4+100>>2]|0;L1320:do{if((dj|0)!=0){c9=c4+12|0;df=dj;while(1){bR(df,ef,t,c9);dh=c[df+4>>2]|0;if((dh|0)==0){break L1320}else{df=dh}}}}while(0);ef=c[c4+112>>2]|0;if((ef|0)==0){break}else{eF=ef}while(1){ef=(c[eF+4>>2]|0)+4|0;c[ef>>2]=c[ef>>2]&-34;ef=c[eF+12>>2]|0;if((ef|0)==0){break L1318}else{eF=ef}}}}while(0);c4=ee+1|0;if((c4|0)<(eD|0)){ee=c4}else{break L1315}}}}while(0);bI(cE,O);if((a[E]&1)<<24>>24!=0){c5=0;ah=1116;break}}if((ah|0)==874){aM(5242944,641,5247824,5243080)}else if((ah|0)==880){aM(5244864,723,5247956,5243016)}else if((ah|0)==885){aM(5244864,723,5247956,5243016)}else if((ah|0)==889){aM(5242944,676,5247824,5243016)}else if((ah|0)==894){aM(5245164,280,5250016,5245860)}else if((ah|0)==901){aM(5245164,50,5248664,5243356)}else if((ah|0)==905){aM(5244300,103,5246912,5244008)}else if((ah|0)==908){aM(5244300,103,5246912,5244008)}else if((ah|0)==914){aM(5244300,103,5246912,5244008)}else if((ah|0)==917){aM(5244300,103,5246912,5244008)}else if((ah|0)==922){aM(5244300,103,5246912,5244008)}else if((ah|0)==927){aM(5244300,103,5246912,5244008)}else if((ah|0)==930){aM(5244300,103,5246912,5244008)}else if((ah|0)==935){aM(5244300,103,5246912,5244008)}else if((ah|0)==947){aM(5244300,103,5246912,5244008)}else if((ah|0)==950){aM(5244300,103,5246912,5244008)}else if((ah|0)==958){aM(5244300,103,5246912,5244008)}else if((ah|0)==966){aM(5244300,103,5246912,5244008)}else if((ah|0)==969){aM(5245164,183,5246828,5245636)}else if((ah|0)==996){aM(5244864,723,5247956,5243016)}else if((ah|0)==999){aM(5244864,723,5247956,5243016)}else if((ah|0)==1009){aM(5244668,54,5247792,5244412)}else if((ah|0)==1012){aM(5244668,54,5247792,5244412)}else if((ah|0)==1015){aM(5244668,62,5247728,5244492)}else if((ah|0)==1031){aM(5244864,723,5247956,5243016)}else if((ah|0)==1040){aM(5244668,62,5247728,5244492)}else if((ah|0)==1047){aM(5244668,54,5247792,5244412)}else if((ah|0)==1054){aM(5244136,386,5247668,5245580)}else if((ah|0)==1060){aM(5244136,387,5247668,5244928)}else if((ah|0)==1116){a[am]=c5;E=c[bp>>2]|0;b0(E,c[ad>>2]|0);b0(E,c[aj>>2]|0);b0(E,c[u+16>>2]|0);b0(E,c[cg>>2]|0);b0(E,c[cM>>2]|0);g[e+103024>>2]=0.0;break}}}while(0);g[Q>>2]=59.999996185302734;Q=c[L>>2]|0;if((Q&4|0)==0){eG=Q;eH=eG&-3;c[L>>2]=eH;eI=e+102996|0;g[eI>>2]=0.0;i=f;return}u=c[e+102952>>2]|0;if((u|0)==0){eG=Q;eH=eG&-3;c[L>>2]=eH;eI=e+102996|0;g[eI>>2]=0.0;i=f;return}else{eJ=u}while(1){g[eJ+76>>2]=0.0;g[eJ+80>>2]=0.0;g[eJ+84>>2]=0.0;u=c[eJ+96>>2]|0;if((u|0)==0){break}else{eJ=u}}eG=c[L>>2]|0;eH=eG&-3;c[L>>2]=eH;eI=e+102996|0;g[eI>>2]=0.0;i=f;return}function bU(a,c,d){a=a|0;c=c|0;d=d|0;var e=0;a=b[c+36>>1]|0;if(!(a<<16>>16!=(b[d+36>>1]|0)|a<<16>>16==0)){e=a<<16>>16>0;return e|0}if((b[d+32>>1]&b[c+34>>1])<<16>>16==0){e=0;return e|0}e=(b[d+34>>1]&b[c+32>>1])<<16>>16!=0;return e|0}function bV(a){a=a|0;if((a|0)==0){return}c_(a);return}function bW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,i=0,j=0;e=c[b+4>>2]|0;if((e|0)==1){c[a+16>>2]=b+12|0;c[a+20>>2]=2;g[a+24>>2]=+g[b+8>>2];return}else if((e|0)==2){c[a+16>>2]=b+20|0;c[a+20>>2]=c[b+148>>2]|0;g[a+24>>2]=+g[b+8>>2];return}else if((e|0)==0){c[a+16>>2]=b+12|0;c[a+20>>2]=1;g[a+24>>2]=+g[b+8>>2];return}else if((e|0)==3){if((d|0)<=-1){aM(5245356,53,5249128,5245948)}e=b+16|0;if((c[e>>2]|0)<=(d|0)){aM(5245356,53,5249128,5245948)}f=b+12|0;h=(c[f>>2]|0)+(d<<3)|0;i=a;j=c[h+4>>2]|0;c[i>>2]=c[h>>2]|0;c[i+4>>2]=j;j=d+1|0;d=a+8|0;i=c[f>>2]|0;if((j|0)<(c[e>>2]|0)){e=i+(j<<3)|0;j=d;f=c[e+4>>2]|0;c[j>>2]=c[e>>2]|0;c[j+4>>2]=f}else{f=i;i=d;d=c[f+4>>2]|0;c[i>>2]=c[f>>2]|0;c[i+4>>2]=d}c[a+16>>2]=a|0;c[a+20>>2]=2;g[a+24>>2]=+g[b+8>>2];return}else{aM(5245356,81,5249128,5245636)}}function bX(e,f,h){e=e|0;f=f|0;h=h|0;var j=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0.0,M=0.0,N=0.0,O=0.0,Q=0.0,R=0.0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,aq=0.0,ar=0.0,as=0.0,at=0.0,au=0.0,av=0.0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aN=0,aO=0,aP=0,aQ=0,aR=0.0,aS=0.0,aT=0.0,aU=0.0,aV=0,aW=0,aX=0,aY=0.0,aZ=0.0,a_=0.0;j=i;i=i+136|0;l=j|0;m=j+112|0;n=j+124|0;c[1310733]=(c[1310733]|0)+1|0;o=+g[h+56>>2];p=+g[h+60>>2];q=+g[h+64>>2];r=+g[h+68>>2];s=+g[h+72>>2];t=+g[h+76>>2];u=+g[h+80>>2];v=+g[h+84>>2];w=f+4|0;x=b[w>>1]|0;if((x&65535)>=4){aM(5245356,102,5247320,5243408)}y=x&65535;z=l+108|0;c[z>>2]=y;A=l|0;L1440:do{if(x<<16>>16==0){B=y}else{C=h+16|0;D=h+48|0;E=h+44|0;F=c[h+20>>2]|0;G=0;while(1){H=d[G+(f+6)|0]|0;c[A+(G*36&-1)+28>>2]=H;I=d[G+(f+9)|0]|0;c[A+(G*36&-1)+32>>2]=I;if((F|0)<=(H|0)){J=1164;break}K=(c[C>>2]|0)+(H<<3)|0;H=c[K+4>>2]|0;L=(c[k>>2]=c[K>>2]|0,+g[k>>2]);M=(c[k>>2]=H,+g[k>>2]);if((c[D>>2]|0)<=(I|0)){J=1166;break}H=(c[E>>2]|0)+(I<<3)|0;I=c[H+4>>2]|0;N=(c[k>>2]=c[H>>2]|0,+g[k>>2]);O=(c[k>>2]=I,+g[k>>2]);Q=o+(L*r-M*q);I=A+(G*36&-1)|0;H=(g[k>>2]=Q,c[k>>2]|0);K=(g[k>>2]=M*r+L*q+p,c[k>>2]|0)|0;c[I>>2]=0|H;c[I+4>>2]=K;L=s+(N*v-O*u);K=A+(G*36&-1)+8|0;I=(g[k>>2]=L,c[k>>2]|0);H=(g[k>>2]=O*v+N*u+t,c[k>>2]|0)|0;c[K>>2]=0|I;c[K+4>>2]=H;N=+g[A+(G*36&-1)+12>>2]- +g[A+(G*36&-1)+4>>2];H=A+(G*36&-1)+16|0;K=(g[k>>2]=L-Q,c[k>>2]|0);I=(g[k>>2]=N,c[k>>2]|0)|0;c[H>>2]=0|K;c[H+4>>2]=I;g[A+(G*36&-1)+24>>2]=0.0;I=G+1|0;H=c[z>>2]|0;if((I|0)<(H|0)){G=I}else{B=H;break L1440}}if((J|0)==1166){aM(5244300,103,5246912,5244008)}else if((J|0)==1164){aM(5244300,103,5246912,5244008)}}}while(0);do{if((B|0)>1){N=+g[f>>2];if((B|0)==2){Q=+g[l+16>>2]- +g[l+52>>2];L=+g[l+20>>2]- +g[l+56>>2];R=+P(+(Q*Q+L*L))}else if((B|0)==3){L=+g[l+16>>2];Q=+g[l+20>>2];R=(+g[l+52>>2]-L)*(+g[l+92>>2]-Q)-(+g[l+56>>2]-Q)*(+g[l+88>>2]-L)}else{aM(5245356,259,5246616,5245636)}if(R>=N*.5){if(!(N*2.0<R|R<1.1920928955078125e-7)){J=1176;break}}c[z>>2]=0;J=1177;break}else{J=1176}}while(0);do{if((J|0)==1176){if((B|0)==0){J=1177;break}else{S=B}if((S|0)==0){aM(5245356,194,5246716,5245636)}else if((S|0)==1|(S|0)==2|(S|0)==3){T=S;break}else{aM(5245356,207,5246716,5245636)}}}while(0);do{if((J|0)==1177){c[l+28>>2]=0;c[l+32>>2]=0;if((c[h+20>>2]|0)<=0){aM(5244300,103,5246912,5244008)}S=c[h+16>>2]|0;B=c[S+4>>2]|0;R=(c[k>>2]=c[S>>2]|0,+g[k>>2]);N=(c[k>>2]=B,+g[k>>2]);if((c[h+48>>2]|0)>0){B=c[h+44>>2]|0;S=c[B+4>>2]|0;L=(c[k>>2]=c[B>>2]|0,+g[k>>2]);Q=(c[k>>2]=S,+g[k>>2]);O=o+(R*r-N*q);M=N*r+R*q+p;S=l;B=(g[k>>2]=O,c[k>>2]|0);y=(g[k>>2]=M,c[k>>2]|0)|0;c[S>>2]=0|B;c[S+4>>2]=y;R=s+(L*v-Q*u);N=Q*v+L*u+t;y=l+8|0;S=(g[k>>2]=R,c[k>>2]|0);B=(g[k>>2]=N,c[k>>2]|0)|0;c[y>>2]=0|S;c[y+4>>2]=B;B=l+16|0;y=(g[k>>2]=R-O,c[k>>2]|0);S=(g[k>>2]=N-M,c[k>>2]|0)|0;c[B>>2]=0|y;c[B+4>>2]=S;c[z>>2]=1;T=1;break}else{aM(5244300,103,5246912,5244008)}}}while(0);S=l+16|0;B=l+20|0;y=h+16|0;x=h+20|0;M=-0.0-u;G=h+44|0;E=h+48|0;D=l+52|0;C=l+56|0;F=l+16|0;H=l+52|0;I=l+24|0;K=l+60|0;U=l;V=l+36|0;W=l+88|0;X=l+96|0;Y=l+72|0;Z=0;_=T;L1475:while(1){T=(_|0)>0;L1477:do{if(T){$=0;while(1){c[m+($<<2)>>2]=c[A+($*36&-1)+28>>2]|0;c[n+($<<2)>>2]=c[A+($*36&-1)+32>>2]|0;aa=$+1|0;if((aa|0)==(_|0)){break L1477}else{$=aa}}}}while(0);do{if((_|0)==2){$=c[F+4>>2]|0;N=(c[k>>2]=c[F>>2]|0,+g[k>>2]);O=(c[k>>2]=$,+g[k>>2]);$=c[H+4>>2]|0;R=(c[k>>2]=c[H>>2]|0,+g[k>>2]);L=(c[k>>2]=$,+g[k>>2]);Q=R-N;ab=L-O;ac=N*Q+O*ab;if(ac>=-0.0){g[I>>2]=1.0;c[z>>2]=1;J=1209;break}O=R*Q+L*ab;if(O>0.0){ab=1.0/(O-ac);g[I>>2]=O*ab;g[K>>2]=ab*(-0.0-ac);c[z>>2]=2;ad=R;ae=N;J=1210;break}else{g[K>>2]=1.0;c[z>>2]=1;c0(U|0,V|0,36);J=1209;break}}else if((_|0)==3){$=c[F+4>>2]|0;N=(c[k>>2]=c[F>>2]|0,+g[k>>2]);R=(c[k>>2]=$,+g[k>>2]);$=c[H+4>>2]|0;ac=(c[k>>2]=c[H>>2]|0,+g[k>>2]);ab=(c[k>>2]=$,+g[k>>2]);$=c[W+4>>2]|0;O=(c[k>>2]=c[W>>2]|0,+g[k>>2]);L=(c[k>>2]=$,+g[k>>2]);Q=ac-N;af=ab-R;ag=N*Q+R*af;ah=ac*Q+ab*af;ai=O-N;aj=L-R;ak=N*ai+R*aj;al=O*ai+L*aj;am=-0.0-ak;an=O-ac;ao=L-ab;ap=ac*an+ab*ao;aq=O*an+L*ao;ao=-0.0-ap;an=Q*aj-af*ai;ar=(ac*L-ab*O)*an;as=(R*O-N*L)*an;at=(N*ab-R*ac)*an;if(!(ag<-0.0|ak<-0.0)){g[I>>2]=1.0;c[z>>2]=1;J=1209;break}if(!(ag>=-0.0|ah<=0.0|at>0.0)){an=1.0/(ah-ag);g[I>>2]=ah*an;g[K>>2]=an*(-0.0-ag);c[z>>2]=2;ad=ac;ae=N;J=1210;break}if(ak>=-0.0|al<=0.0|as>0.0){if(!(ah>0.0|ap<-0.0)){g[K>>2]=1.0;c[z>>2]=1;c0(U|0,V|0,36);J=1209;break}if(!(al>0.0|aq>0.0)){g[X>>2]=1.0;c[z>>2]=1;c0(U|0,Y|0,36);J=1209;break}if(ap>=-0.0|aq<=0.0|ar>0.0){J=1207;break L1475}ah=1.0/(aq-ap);g[K>>2]=aq*ah;g[X>>2]=ah*ao;c[z>>2]=2;c0(U|0,Y|0,36)}else{ao=1.0/(al-ak);g[I>>2]=al*ao;g[X>>2]=ao*am;c[z>>2]=2;c0(V|0,Y|0,36)}ad=+g[D>>2];ae=+g[S>>2];J=1210;break}else if((_|0)==1){J=1209}else{J=1194;break L1475}}while(0);do{if((J|0)==1209){J=0;au=-0.0- +g[S>>2];av=-0.0- +g[B>>2];aw=1}else if((J|0)==1210){J=0;am=ad-ae;ao=+g[B>>2];al=+g[C>>2]-ao;if(am*(-0.0-ao)-al*(-0.0-ae)>0.0){au=al*-1.0;av=am;aw=2;break}else{au=al;av=am*-1.0;aw=2;break}}}while(0);if(av*av+au*au<1.4210854715202004e-14){ax=Z;ay=aw;J=1235;break}$=A+(aw*36&-1)|0;am=-0.0-av;al=r*(-0.0-au)+q*am;ao=r*am+au*q;aa=c[y>>2]|0;az=c[x>>2]|0;if((az|0)>1){am=ao*+g[aa+4>>2]+al*+g[aa>>2];aA=1;aB=0;while(1){ak=al*+g[aa+(aA<<3)>>2]+ao*+g[aa+(aA<<3)+4>>2];aC=ak>am;aD=aC?aA:aB;aE=aA+1|0;if((aE|0)==(az|0)){break}else{am=aC?ak:am;aA=aE;aB=aD}}aB=A+(aw*36&-1)+28|0;c[aB>>2]=aD;if((aD|0)>-1){aF=aD;aG=aB}else{J=1255;break}}else{aB=A+(aw*36&-1)+28|0;c[aB>>2]=0;aF=0;aG=aB}if((az|0)<=(aF|0)){J=1256;break}am=+g[aa+(aF<<3)>>2];ao=+g[aa+(aF<<3)+4>>2];al=o+(r*am-q*ao);aB=$;aA=(g[k>>2]=al,c[k>>2]|0);aE=(g[k>>2]=am*q+r*ao+p,c[k>>2]|0)|0;c[aB>>2]=0|aA;c[aB+4>>2]=aE;ao=au*v+av*u;am=av*v+au*M;aE=c[G>>2]|0;aB=c[E>>2]|0;if((aB|0)>1){ak=am*+g[aE+4>>2]+ao*+g[aE>>2];aA=1;aC=0;while(1){ah=ao*+g[aE+(aA<<3)>>2]+am*+g[aE+(aA<<3)+4>>2];aH=ah>ak;aI=aH?aA:aC;aJ=aA+1|0;if((aJ|0)==(aB|0)){break}else{ak=aH?ah:ak;aA=aJ;aC=aI}}aC=A+(aw*36&-1)+32|0;c[aC>>2]=aI;if((aI|0)>-1){aK=aI;aL=aC}else{J=1257;break}}else{aC=A+(aw*36&-1)+32|0;c[aC>>2]=0;aK=0;aL=aC}if((aB|0)<=(aK|0)){J=1258;break}ak=+g[aE+(aK<<3)>>2];am=+g[aE+(aK<<3)+4>>2];ao=s+(v*ak-u*am);aC=A+(aw*36&-1)+8|0;aA=(g[k>>2]=ao,c[k>>2]|0);$=(g[k>>2]=ak*u+v*am+t,c[k>>2]|0)|0;c[aC>>2]=0|aA;c[aC+4>>2]=$;am=+g[A+(aw*36&-1)+12>>2]- +g[A+(aw*36&-1)+4>>2];$=A+(aw*36&-1)+16|0;aC=(g[k>>2]=ao-al,c[k>>2]|0);aA=(g[k>>2]=am,c[k>>2]|0)|0;c[$>>2]=0|aC;c[$+4>>2]=aA;aN=Z+1|0;c[1310732]=(c[1310732]|0)+1|0;L1531:do{if(T){aA=c[aG>>2]|0;$=0;while(1){if((aA|0)==(c[m+($<<2)>>2]|0)){if((c[aL>>2]|0)==(c[n+($<<2)>>2]|0)){J=1234;break L1475}}aC=$+1|0;if((aC|0)<(_|0)){$=aC}else{break L1531}}}}while(0);T=(c[z>>2]|0)+1|0;c[z>>2]=T;if((aN|0)<20){Z=aN;_=T}else{ax=aN;ay=T;J=1235;break}}do{if((J|0)==1207){t=1.0/(at+(ar+as));g[I>>2]=ar*t;g[K>>2]=as*t;g[X>>2]=at*t;c[z>>2]=3;_=c[1310731]|0;c[1310731]=(_|0)>(Z|0)?_:Z;aO=3;aP=Z;aQ=e+8|0;J=1239;break}else if((J|0)==1234){ax=aN;ay=c[z>>2]|0;J=1235;break}else if((J|0)==1255){aM(5244300,103,5246912,5244008)}else if((J|0)==1256){aM(5244300,103,5246912,5244008)}else if((J|0)==1257){aM(5244300,103,5246912,5244008)}else if((J|0)==1258){aM(5244300,103,5246912,5244008)}else if((J|0)==1194){aM(5245356,498,5250072,5245636)}}while(0);do{if((J|0)==1235){z=c[1310731]|0;c[1310731]=(z|0)>(ax|0)?z:ax;z=e+8|0;if((ay|0)==0){aM(5245356,217,5246656,5245636)}else if((ay|0)==1){aN=l;Z=e;_=c[aN>>2]|0;n=c[aN+4>>2]|0;c[Z>>2]=_;c[Z+4>>2]=n;Z=l+8|0;aN=z;aL=c[Z>>2]|0;m=c[Z+4>>2]|0;c[aN>>2]=aL;c[aN+4>>2]=m;at=(c[k>>2]=_,+g[k>>2]);as=(c[k>>2]=aL,+g[k>>2]);ar=(c[k>>2]=n,+g[k>>2]);aR=at;aS=as;aT=ar;aU=(c[k>>2]=m,+g[k>>2]);aV=ay;aW=ax;aX=z;break}else if((ay|0)==2){ar=+g[I>>2];as=+g[K>>2];at=ar*+g[l>>2]+as*+g[l+36>>2];t=ar*+g[l+4>>2]+as*+g[l+40>>2];m=e;n=(g[k>>2]=at,c[k>>2]|0);aL=(g[k>>2]=t,c[k>>2]|0)|0;c[m>>2]=0|n;c[m+4>>2]=aL;v=ar*+g[l+8>>2]+as*+g[l+44>>2];u=ar*+g[l+12>>2]+as*+g[l+48>>2];aL=z;m=(g[k>>2]=v,c[k>>2]|0);n=(g[k>>2]=u,c[k>>2]|0)|0;c[aL>>2]=0|m;c[aL+4>>2]=n;aR=at;aS=v;aT=t;aU=u;aV=ay;aW=ax;aX=z;break}else if((ay|0)==3){aO=ay;aP=ax;aQ=z;J=1239;break}else{aM(5245356,236,5246656,5245636)}}}while(0);if((J|0)==1239){u=+g[I>>2];t=+g[K>>2];v=+g[X>>2];at=u*+g[l>>2]+t*+g[l+36>>2]+v*+g[l+72>>2];as=u*+g[l+4>>2]+t*+g[l+40>>2]+v*+g[l+76>>2];X=e;K=(g[k>>2]=at,c[k>>2]|0);I=0|K;K=(g[k>>2]=as,c[k>>2]|0)|0;c[X>>2]=I;c[X+4>>2]=K;X=aQ;c[X>>2]=I;c[X+4>>2]=K;aR=at;aS=at;aT=as;aU=as;aV=aO;aW=aP;aX=aQ}aQ=e|0;aP=aX|0;as=aR-aS;aO=e+4|0;K=e+12|0;aS=aT-aU;X=e+16|0;g[X>>2]=+P(+(as*as+aS*aS));c[e+20>>2]=aW;if((aV|0)==1){aY=0.0}else if((aV|0)==3){aS=+g[S>>2];as=+g[B>>2];aY=(+g[D>>2]-aS)*(+g[l+92>>2]-as)-(+g[C>>2]-as)*(+g[l+88>>2]-aS)}else if((aV|0)==0){aM(5245356,246,5246616,5245636)}else if((aV|0)==2){aS=+g[S>>2]- +g[D>>2];as=+g[B>>2]- +g[C>>2];aY=+P(+(aS*aS+as*as))}else{aM(5245356,259,5246616,5245636)}g[f>>2]=aY;b[w>>1]=aV&65535;w=0;while(1){a[w+(f+6)|0]=c[A+(w*36&-1)+28>>2]&255;a[w+(f+9)|0]=c[A+(w*36&-1)+32>>2]&255;C=w+1|0;if((C|0)<(aV|0)){w=C}else{break}}if((a[h+88|0]&1)<<24>>24==0){i=j;return}aY=+g[h+24>>2];as=+g[h+52>>2];aS=+g[X>>2];aU=aY+as;if(!(aS>aU&aS>1.1920928955078125e-7)){aT=(+g[aO>>2]+ +g[K>>2])*.5;h=e;e=(g[k>>2]=(+g[aQ>>2]+ +g[aP>>2])*.5,c[k>>2]|0);w=0|e;e=(g[k>>2]=aT,c[k>>2]|0)|0;c[h>>2]=w;c[h+4>>2]=e;h=aX;c[h>>2]=w;c[h+4>>2]=e;g[X>>2]=0.0;i=j;return}g[X>>2]=aS-aU;aU=+g[aP>>2];aS=+g[aQ>>2];aT=aU-aS;aR=+g[K>>2];at=+g[aO>>2];v=aR-at;t=+P(+(aT*aT+v*v));if(t<1.1920928955078125e-7){aZ=aT;a_=v}else{u=1.0/t;aZ=aT*u;a_=v*u}g[aQ>>2]=aY*aZ+aS;g[aO>>2]=aY*a_+at;g[aP>>2]=aU-as*aZ;g[K>>2]=aR-as*a_;i=j;return}function bY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=a+16|0;d=c[b>>2]|0;if((d|0)==-1){e=a+8|0;f=c[e>>2]|0;g=a+12|0;if((f|0)!=(c[g>>2]|0)){aM(5245288,61,5249548,5245916);return 0}h=a+4|0;i=c[h>>2]|0;c[g>>2]=f<<1;j=cZ(f*72&-1)|0;c[h>>2]=j;f=i;c0(j|0,f|0,(c[e>>2]|0)*36&-1|0);c_(f);f=c[e>>2]|0;j=(c[g>>2]|0)-1|0;L1584:do{if((f|0)<(j|0)){i=f;while(1){k=i+1|0;c[(c[h>>2]|0)+(i*36&-1)+20>>2]=k;c[(c[h>>2]|0)+(i*36&-1)+32>>2]=-1;l=(c[g>>2]|0)-1|0;if((k|0)<(l|0)){i=k}else{m=l;break L1584}}}else{m=j}}while(0);c[(c[h>>2]|0)+(m*36&-1)+20>>2]=-1;c[(c[h>>2]|0)+(((c[g>>2]|0)-1|0)*36&-1)+32>>2]=-1;g=c[e>>2]|0;c[b>>2]=g;n=g;o=h;p=e}else{n=d;o=a+4|0;p=a+8|0}a=(c[o>>2]|0)+(n*36&-1)+20|0;c[b>>2]=c[a>>2]|0;c[a>>2]=-1;c[(c[o>>2]|0)+(n*36&-1)+24>>2]=-1;c[(c[o>>2]|0)+(n*36&-1)+28>>2]=-1;c[(c[o>>2]|0)+(n*36&-1)+32>>2]=0;c[(c[o>>2]|0)+(n*36&-1)+16>>2]=0;c[p>>2]=(c[p>>2]|0)+1|0;return n|0}function bZ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0.0,j=0.0,l=0.0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0,G=0,H=0;d=a+24|0;c[d>>2]=(c[d>>2]|0)+1|0;d=a|0;e=c[d>>2]|0;if((e|0)==-1){c[d>>2]=b;c[(c[a+4>>2]|0)+(b*36&-1)+20>>2]=-1;return}f=a+4|0;h=c[f>>2]|0;i=+g[h+(b*36&-1)>>2];j=+g[h+(b*36&-1)+4>>2];l=+g[h+(b*36&-1)+8>>2];m=+g[h+(b*36&-1)+12>>2];n=c[h+(e*36&-1)+24>>2]|0;L1594:do{if((n|0)==-1){o=e}else{p=e;q=n;while(1){r=c[h+(p*36&-1)+28>>2]|0;s=+g[h+(p*36&-1)+8>>2];t=+g[h+(p*36&-1)>>2];u=+g[h+(p*36&-1)+12>>2];v=+g[h+(p*36&-1)+4>>2];w=((s>l?s:l)-(t<i?t:i)+((u>m?u:m)-(v<j?v:j)))*2.0;x=w*2.0;y=(w-(s-t+(u-v))*2.0)*2.0;v=+g[h+(q*36&-1)>>2];u=i<v?i:v;t=+g[h+(q*36&-1)+4>>2];s=j<t?j:t;w=+g[h+(q*36&-1)+8>>2];z=l>w?l:w;A=+g[h+(q*36&-1)+12>>2];B=m>A?m:A;if((c[h+(q*36&-1)+24>>2]|0)==-1){C=(z-u+(B-s))*2.0}else{C=(z-u+(B-s))*2.0-(w-v+(A-t))*2.0}t=y+C;A=+g[h+(r*36&-1)>>2];v=i<A?i:A;w=+g[h+(r*36&-1)+4>>2];s=j<w?j:w;B=+g[h+(r*36&-1)+8>>2];u=l>B?l:B;z=+g[h+(r*36&-1)+12>>2];D=m>z?m:z;if((c[h+(r*36&-1)+24>>2]|0)==-1){E=(u-v+(D-s))*2.0}else{E=(u-v+(D-s))*2.0-(B-A+(z-w))*2.0}w=y+E;if(x<t&x<w){o=p;break L1594}F=t<w?q:r;r=c[h+(F*36&-1)+24>>2]|0;if((r|0)==-1){o=F;break L1594}else{p=F;q=r}}}}while(0);n=c[h+(o*36&-1)+20>>2]|0;h=bY(a)|0;c[(c[f>>2]|0)+(h*36&-1)+20>>2]=n;c[(c[f>>2]|0)+(h*36&-1)+16>>2]=0;e=c[f>>2]|0;E=+g[e+(o*36&-1)>>2];C=+g[e+(o*36&-1)+4>>2];q=e+(h*36&-1)|0;p=(g[k>>2]=i<E?i:E,c[k>>2]|0);r=(g[k>>2]=j<C?j:C,c[k>>2]|0)|0;c[q>>2]=0|p;c[q+4>>2]=r;C=+g[e+(o*36&-1)+8>>2];j=+g[e+(o*36&-1)+12>>2];r=e+(h*36&-1)+8|0;e=(g[k>>2]=l>C?l:C,c[k>>2]|0);q=(g[k>>2]=m>j?m:j,c[k>>2]|0)|0;c[r>>2]=0|e;c[r+4>>2]=q;q=c[f>>2]|0;c[q+(h*36&-1)+32>>2]=(c[q+(o*36&-1)+32>>2]|0)+1|0;q=c[f>>2]|0;if((n|0)==-1){c[q+(h*36&-1)+24>>2]=o;c[(c[f>>2]|0)+(h*36&-1)+28>>2]=b;c[(c[f>>2]|0)+(o*36&-1)+20>>2]=h;c[(c[f>>2]|0)+(b*36&-1)+20>>2]=h;c[d>>2]=h}else{d=q+(n*36&-1)+24|0;if((c[d>>2]|0)==(o|0)){c[d>>2]=h}else{c[q+(n*36&-1)+28>>2]=h}c[(c[f>>2]|0)+(h*36&-1)+24>>2]=o;c[(c[f>>2]|0)+(h*36&-1)+28>>2]=b;c[(c[f>>2]|0)+(o*36&-1)+20>>2]=h;c[(c[f>>2]|0)+(b*36&-1)+20>>2]=h}h=c[(c[f>>2]|0)+(b*36&-1)+20>>2]|0;if((h|0)==-1){return}else{G=h}while(1){h=b_(a,G)|0;b=c[f>>2]|0;o=c[b+(h*36&-1)+24>>2]|0;n=c[b+(h*36&-1)+28>>2]|0;if((o|0)==-1){H=1289;break}if((n|0)==-1){H=1291;break}q=c[b+(o*36&-1)+32>>2]|0;d=c[b+(n*36&-1)+32>>2]|0;c[b+(h*36&-1)+32>>2]=((q|0)>(d|0)?q:d)+1|0;d=c[f>>2]|0;j=+g[d+(o*36&-1)>>2];m=+g[d+(n*36&-1)>>2];C=+g[d+(o*36&-1)+4>>2];l=+g[d+(n*36&-1)+4>>2];q=d+(h*36&-1)|0;b=(g[k>>2]=j<m?j:m,c[k>>2]|0);r=(g[k>>2]=C<l?C:l,c[k>>2]|0)|0;c[q>>2]=0|b;c[q+4>>2]=r;l=+g[d+(o*36&-1)+8>>2];C=+g[d+(n*36&-1)+8>>2];m=+g[d+(o*36&-1)+12>>2];j=+g[d+(n*36&-1)+12>>2];n=d+(h*36&-1)+8|0;d=(g[k>>2]=l>C?l:C,c[k>>2]|0);o=(g[k>>2]=m>j?m:j,c[k>>2]|0)|0;c[n>>2]=0|d;c[n+4>>2]=o;o=c[(c[f>>2]|0)+(h*36&-1)+20>>2]|0;if((o|0)==-1){H=1296;break}else{G=o}}if((H|0)==1289){aM(5245288,307,5249584,5243192)}else if((H|0)==1291){aM(5245288,308,5249584,5243032)}else if((H|0)==1296){return}}function b_(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,D=0.0,E=0.0,F=0,G=0,H=0.0,I=0.0,J=0,K=0;if((b|0)==-1){aM(5245288,382,5249512,5243004);return 0}d=a+4|0;e=c[d>>2]|0;f=e+(b*36&-1)|0;h=e+(b*36&-1)+24|0;i=c[h>>2]|0;if((i|0)==-1){j=b;return j|0}l=e+(b*36&-1)+32|0;if((c[l>>2]|0)<2){j=b;return j|0}m=e+(b*36&-1)+28|0;n=c[m>>2]|0;if((i|0)<=-1){aM(5245288,392,5249512,5242972);return 0}o=c[a+12>>2]|0;if((i|0)>=(o|0)){aM(5245288,392,5249512,5242972);return 0}if(!((n|0)>-1&(n|0)<(o|0))){aM(5245288,393,5249512,5246068);return 0}p=e+(i*36&-1)|0;q=e+(n*36&-1)|0;r=e+(n*36&-1)+32|0;s=e+(i*36&-1)+32|0;t=(c[r>>2]|0)-(c[s>>2]|0)|0;if((t|0)>1){u=e+(n*36&-1)+24|0;v=c[u>>2]|0;w=e+(n*36&-1)+28|0;x=c[w>>2]|0;y=e+(v*36&-1)|0;z=e+(x*36&-1)|0;if(!((v|0)>-1&(v|0)<(o|0))){aM(5245288,407,5249512,5246008);return 0}if(!((x|0)>-1&(x|0)<(o|0))){aM(5245288,408,5249512,5245828);return 0}c[u>>2]=b;u=e+(b*36&-1)+20|0;A=e+(n*36&-1)+20|0;c[A>>2]=c[u>>2]|0;c[u>>2]=n;u=c[A>>2]|0;do{if((u|0)==-1){c[a>>2]=n}else{A=c[d>>2]|0;B=A+(u*36&-1)+24|0;if((c[B>>2]|0)==(b|0)){c[B>>2]=n;break}B=A+(u*36&-1)+28|0;if((c[B>>2]|0)==(b|0)){c[B>>2]=n;break}else{aM(5245288,424,5249512,5245604);return 0}}}while(0);u=e+(v*36&-1)+32|0;B=e+(x*36&-1)+32|0;if((c[u>>2]|0)>(c[B>>2]|0)){c[w>>2]=v;c[m>>2]=x;c[e+(x*36&-1)+20>>2]=b;C=+g[p>>2];D=+g[z>>2];E=C<D?C:D;D=+g[e+(i*36&-1)+4>>2];C=+g[e+(x*36&-1)+4>>2];A=f;F=(g[k>>2]=E,c[k>>2]|0);G=(g[k>>2]=D<C?D:C,c[k>>2]|0)|0;c[A>>2]=0|F;c[A+4>>2]=G;C=+g[e+(i*36&-1)+8>>2];D=+g[e+(x*36&-1)+8>>2];H=+g[e+(i*36&-1)+12>>2];I=+g[e+(x*36&-1)+12>>2];G=e+(b*36&-1)+8|0;A=(g[k>>2]=C>D?C:D,c[k>>2]|0);F=(g[k>>2]=H>I?H:I,c[k>>2]|0)|0;c[G>>2]=0|A;c[G+4>>2]=F;I=+g[y>>2];H=+g[e+(b*36&-1)+4>>2];D=+g[e+(v*36&-1)+4>>2];F=q;G=(g[k>>2]=E<I?E:I,c[k>>2]|0);A=(g[k>>2]=H<D?H:D,c[k>>2]|0)|0;c[F>>2]=0|G;c[F+4>>2]=A;D=+g[e+(b*36&-1)+8>>2];H=+g[e+(v*36&-1)+8>>2];I=+g[e+(b*36&-1)+12>>2];E=+g[e+(v*36&-1)+12>>2];A=e+(n*36&-1)+8|0;F=(g[k>>2]=D>H?D:H,c[k>>2]|0);G=(g[k>>2]=I>E?I:E,c[k>>2]|0)|0;c[A>>2]=0|F;c[A+4>>2]=G;G=c[s>>2]|0;A=c[B>>2]|0;F=((G|0)>(A|0)?G:A)+1|0;c[l>>2]=F;A=c[u>>2]|0;J=(F|0)>(A|0)?F:A}else{c[w>>2]=x;c[m>>2]=v;c[e+(v*36&-1)+20>>2]=b;E=+g[p>>2];I=+g[y>>2];H=E<I?E:I;I=+g[e+(i*36&-1)+4>>2];E=+g[e+(v*36&-1)+4>>2];y=f;m=(g[k>>2]=H,c[k>>2]|0);w=(g[k>>2]=I<E?I:E,c[k>>2]|0)|0;c[y>>2]=0|m;c[y+4>>2]=w;E=+g[e+(i*36&-1)+8>>2];I=+g[e+(v*36&-1)+8>>2];D=+g[e+(i*36&-1)+12>>2];C=+g[e+(v*36&-1)+12>>2];v=e+(b*36&-1)+8|0;w=(g[k>>2]=E>I?E:I,c[k>>2]|0);y=(g[k>>2]=D>C?D:C,c[k>>2]|0)|0;c[v>>2]=0|w;c[v+4>>2]=y;C=+g[z>>2];D=+g[e+(b*36&-1)+4>>2];I=+g[e+(x*36&-1)+4>>2];z=q;y=(g[k>>2]=H<C?H:C,c[k>>2]|0);v=(g[k>>2]=D<I?D:I,c[k>>2]|0)|0;c[z>>2]=0|y;c[z+4>>2]=v;I=+g[e+(b*36&-1)+8>>2];D=+g[e+(x*36&-1)+8>>2];C=+g[e+(b*36&-1)+12>>2];H=+g[e+(x*36&-1)+12>>2];x=e+(n*36&-1)+8|0;v=(g[k>>2]=I>D?I:D,c[k>>2]|0);z=(g[k>>2]=C>H?C:H,c[k>>2]|0)|0;c[x>>2]=0|v;c[x+4>>2]=z;z=c[s>>2]|0;x=c[u>>2]|0;u=((z|0)>(x|0)?z:x)+1|0;c[l>>2]=u;x=c[B>>2]|0;J=(u|0)>(x|0)?u:x}c[r>>2]=J+1|0;j=n;return j|0}if((t|0)>=-1){j=b;return j|0}t=e+(i*36&-1)+24|0;J=c[t>>2]|0;x=e+(i*36&-1)+28|0;u=c[x>>2]|0;B=e+(J*36&-1)|0;z=e+(u*36&-1)|0;if(!((J|0)>-1&(J|0)<(o|0))){aM(5245288,467,5249512,5245492);return 0}if(!((u|0)>-1&(u|0)<(o|0))){aM(5245288,468,5249512,5245324);return 0}c[t>>2]=b;t=e+(b*36&-1)+20|0;o=e+(i*36&-1)+20|0;c[o>>2]=c[t>>2]|0;c[t>>2]=i;t=c[o>>2]|0;do{if((t|0)==-1){c[a>>2]=i}else{o=c[d>>2]|0;v=o+(t*36&-1)+24|0;if((c[v>>2]|0)==(b|0)){c[v>>2]=i;break}v=o+(t*36&-1)+28|0;if((c[v>>2]|0)==(b|0)){c[v>>2]=i;break}else{aM(5245288,484,5249512,5245256);return 0}}}while(0);t=e+(J*36&-1)+32|0;d=e+(u*36&-1)+32|0;if((c[t>>2]|0)>(c[d>>2]|0)){c[x>>2]=J;c[h>>2]=u;c[e+(u*36&-1)+20>>2]=b;H=+g[q>>2];C=+g[z>>2];D=H<C?H:C;C=+g[e+(n*36&-1)+4>>2];H=+g[e+(u*36&-1)+4>>2];a=f;v=(g[k>>2]=D,c[k>>2]|0);o=(g[k>>2]=C<H?C:H,c[k>>2]|0)|0;c[a>>2]=0|v;c[a+4>>2]=o;H=+g[e+(n*36&-1)+8>>2];C=+g[e+(u*36&-1)+8>>2];I=+g[e+(n*36&-1)+12>>2];E=+g[e+(u*36&-1)+12>>2];o=e+(b*36&-1)+8|0;a=(g[k>>2]=H>C?H:C,c[k>>2]|0);v=(g[k>>2]=I>E?I:E,c[k>>2]|0)|0;c[o>>2]=0|a;c[o+4>>2]=v;E=+g[B>>2];I=+g[e+(b*36&-1)+4>>2];C=+g[e+(J*36&-1)+4>>2];v=p;o=(g[k>>2]=D<E?D:E,c[k>>2]|0);a=(g[k>>2]=I<C?I:C,c[k>>2]|0)|0;c[v>>2]=0|o;c[v+4>>2]=a;C=+g[e+(b*36&-1)+8>>2];I=+g[e+(J*36&-1)+8>>2];E=+g[e+(b*36&-1)+12>>2];D=+g[e+(J*36&-1)+12>>2];a=e+(i*36&-1)+8|0;v=(g[k>>2]=C>I?C:I,c[k>>2]|0);o=(g[k>>2]=E>D?E:D,c[k>>2]|0)|0;c[a>>2]=0|v;c[a+4>>2]=o;o=c[r>>2]|0;a=c[d>>2]|0;v=((o|0)>(a|0)?o:a)+1|0;c[l>>2]=v;a=c[t>>2]|0;K=(v|0)>(a|0)?v:a}else{c[x>>2]=u;c[h>>2]=J;c[e+(J*36&-1)+20>>2]=b;D=+g[q>>2];E=+g[B>>2];I=D<E?D:E;E=+g[e+(n*36&-1)+4>>2];D=+g[e+(J*36&-1)+4>>2];B=f;f=(g[k>>2]=I,c[k>>2]|0);q=(g[k>>2]=E<D?E:D,c[k>>2]|0)|0;c[B>>2]=0|f;c[B+4>>2]=q;D=+g[e+(n*36&-1)+8>>2];E=+g[e+(J*36&-1)+8>>2];C=+g[e+(n*36&-1)+12>>2];H=+g[e+(J*36&-1)+12>>2];J=e+(b*36&-1)+8|0;n=(g[k>>2]=D>E?D:E,c[k>>2]|0);q=(g[k>>2]=C>H?C:H,c[k>>2]|0)|0;c[J>>2]=0|n;c[J+4>>2]=q;H=+g[z>>2];C=+g[e+(b*36&-1)+4>>2];E=+g[e+(u*36&-1)+4>>2];z=p;p=(g[k>>2]=I<H?I:H,c[k>>2]|0);q=(g[k>>2]=C<E?C:E,c[k>>2]|0)|0;c[z>>2]=0|p;c[z+4>>2]=q;E=+g[e+(b*36&-1)+8>>2];C=+g[e+(u*36&-1)+8>>2];H=+g[e+(b*36&-1)+12>>2];I=+g[e+(u*36&-1)+12>>2];u=e+(i*36&-1)+8|0;e=(g[k>>2]=E>C?E:C,c[k>>2]|0);b=(g[k>>2]=H>I?H:I,c[k>>2]|0)|0;c[u>>2]=0|e;c[u+4>>2]=b;b=c[r>>2]|0;r=c[t>>2]|0;t=((b|0)>(r|0)?b:r)+1|0;c[l>>2]=t;l=c[d>>2]|0;K=(t|0)>(l|0)?t:l}c[s>>2]=K+1|0;j=i;return j|0}function b$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=+e;var f=0.0,h=0.0,i=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0.0;f=1.0-e;h=f*+g[a+16>>2]+ +g[a+24>>2]*e;i=f*+g[a+20>>2]+ +g[a+28>>2]*e;j=f*+g[a+32>>2]+ +g[a+36>>2]*e;l=+S(+j);m=+R(+j);j=+g[a+8>>2];n=+g[a+12>>2];o=h-(m*j-l*n);h=i-(l*j+m*n);n=f*+g[a+52>>2]+ +g[a+60>>2]*e;j=f*+g[a+56>>2]+ +g[a+64>>2]*e;i=f*+g[a+68>>2]+ +g[a+72>>2]*e;e=+S(+i);f=+R(+i);i=+g[a+44>>2];p=+g[a+48>>2];q=n-(f*i-e*p);n=j-(e*i+f*p);r=c[a+80>>2]|0;if((r|0)==0){p=+g[a+92>>2];i=+g[a+96>>2];s=c[a>>2]|0;if((b|0)<=-1){aM(5244300,103,5246912,5244008);return 0.0}if((c[s+20>>2]|0)<=(b|0)){aM(5244300,103,5246912,5244008);return 0.0}t=(c[s+16>>2]|0)+(b<<3)|0;s=c[t+4>>2]|0;j=(c[k>>2]=c[t>>2]|0,+g[k>>2]);u=(c[k>>2]=s,+g[k>>2]);s=c[a+4>>2]|0;if((d|0)<=-1){aM(5244300,103,5246912,5244008);return 0.0}if((c[s+20>>2]|0)<=(d|0)){aM(5244300,103,5246912,5244008);return 0.0}t=(c[s+16>>2]|0)+(d<<3)|0;s=c[t+4>>2]|0;v=(c[k>>2]=c[t>>2]|0,+g[k>>2]);w=(c[k>>2]=s,+g[k>>2]);x=p*(q+(f*v-e*w)-(o+(m*j-l*u)))+i*(n+(e*v+f*w)-(h+(l*j+m*u)));return+x}else if((r|0)==1){u=+g[a+92>>2];j=+g[a+96>>2];w=+g[a+84>>2];v=+g[a+88>>2];s=c[a+4>>2]|0;if((d|0)<=-1){aM(5244300,103,5246912,5244008);return 0.0}if((c[s+20>>2]|0)<=(d|0)){aM(5244300,103,5246912,5244008);return 0.0}t=(c[s+16>>2]|0)+(d<<3)|0;d=c[t+4>>2]|0;i=(c[k>>2]=c[t>>2]|0,+g[k>>2]);p=(c[k>>2]=d,+g[k>>2]);x=(m*u-l*j)*(q+(f*i-e*p)-(o+(m*w-l*v)))+(l*u+m*j)*(n+(e*i+f*p)-(h+(l*w+m*v)));return+x}else if((r|0)==2){v=+g[a+92>>2];w=+g[a+96>>2];p=+g[a+84>>2];i=+g[a+88>>2];r=c[a>>2]|0;if((b|0)<=-1){aM(5244300,103,5246912,5244008);return 0.0}if((c[r+20>>2]|0)<=(b|0)){aM(5244300,103,5246912,5244008);return 0.0}a=(c[r+16>>2]|0)+(b<<3)|0;b=c[a+4>>2]|0;j=(c[k>>2]=c[a>>2]|0,+g[k>>2]);u=(c[k>>2]=b,+g[k>>2]);x=(f*v-e*w)*(o+(m*j-l*u)-(q+(f*p-e*i)))+(e*v+f*w)*(h+(l*j+m*u)-(n+(e*p+f*i)));return+x}else{aM(5245164,242,5246760,5245636);return 0.0}return 0.0}function b0(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b+102796|0;f=c[e>>2]|0;if((f|0)<=0){aM(5245076,63,5248904,5243852)}g=f-1|0;if((c[b+102412+(g*12&-1)>>2]|0)!=(d|0)){aM(5245076,65,5248904,5243336)}if((a[b+102412+(g*12&-1)+8|0]&1)<<24>>24==0){h=b+102412+(g*12&-1)+4|0;i=b+102400|0;c[i>>2]=(c[i>>2]|0)-(c[h>>2]|0)|0;j=f;k=h}else{c_(d);j=c[e>>2]|0;k=b+102412+(g*12&-1)+4|0}g=b+102404|0;c[g>>2]=(c[g>>2]|0)-(c[k>>2]|0)|0;c[e>>2]=j-1|0;return}function b1(a){a=a|0;return}function b2(a){a=a|0;return}function b3(a){a=a|0;return}function b4(a){a=a|0;return}function b5(d,e){d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+192|0;h=f|0;j=f+92|0;k=f+104|0;l=f+128|0;m=d+64|0;c0(l|0,m|0,64);n=d+4|0;o=c[n>>2]|0;c[n>>2]=o|4;p=o>>>1;o=c[d+48>>2]|0;q=c[d+52>>2]|0;r=((a[q+38|0]|a[o+38|0])&1)<<24>>24!=0;s=c[o+8>>2]|0;t=c[q+8>>2]|0;u=s+12|0;v=t+12|0;do{if(r){w=c[o+12>>2]|0;x=c[q+12>>2]|0;y=c[d+56>>2]|0;z=c[d+60>>2]|0;c[h+16>>2]=0;c[h+20>>2]=0;g[h+24>>2]=0.0;c[h+44>>2]=0;c[h+48>>2]=0;g[h+52>>2]=0.0;bW(h|0,w,y);bW(h+28|0,x,z);c0(h+56|0,u|0,16);c0(h+72|0,v|0,16);a[h+88|0]=1;b[j+4>>1]=0;bX(k,j,h);z=+g[k+16>>2]<11920928955078125.0e-22&1;c[d+124>>2]=0;A=z;B=p&1}else{a4[c[c[d>>2]>>2]&255](d,m,u,v);z=d+124|0;x=(c[z>>2]|0)>0;y=x&1;L1744:do{if(x){w=c[l+60>>2]|0;C=0;while(1){D=d+64+(C*20&-1)+8|0;g[D>>2]=0.0;E=d+64+(C*20&-1)+12|0;g[E>>2]=0.0;F=c[d+64+(C*20&-1)+16>>2]|0;G=0;while(1){if((G|0)>=(w|0)){break}if((c[l+(G*20&-1)+16>>2]|0)==(F|0)){H=1394;break}else{G=G+1|0}}if((H|0)==1394){H=0;g[D>>2]=+g[l+(G*20&-1)+8>>2];g[E>>2]=+g[l+(G*20&-1)+12>>2]}F=C+1|0;if((F|0)<(c[z>>2]|0)){C=F}else{break L1744}}}}while(0);z=p&1;if(!(x^(z|0)!=0)){A=y;B=z;break}C=s+4|0;w=b[C>>1]|0;if((w&2)<<16>>16==0){b[C>>1]=w|2;g[s+144>>2]=0.0}w=t+4|0;C=b[w>>1]|0;if((C&2)<<16>>16!=0){A=y;B=z;break}b[w>>1]=C|2;g[t+144>>2]=0.0;A=y;B=z}}while(0);t=A<<24>>24!=0;A=c[n>>2]|0;c[n>>2]=t?A|2:A&-3;A=t^1;n=(e|0)==0;if(!((B|0)!=0|A|n)){aY[c[(c[e>>2]|0)+8>>2]&255](e,d)}if(!(t|(B|0)==0|n)){aY[c[(c[e>>2]|0)+12>>2]&255](e,d)}if(r|A|n){i=f;return}a$[c[(c[e>>2]|0)+16>>2]&255](e,d,l);i=f;return}function b6(a){a=a|0;if((a|0)==0){return}c_(a);return}function b7(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;cp(b,c[(c[a+48>>2]|0)+12>>2]|0,d,c[(c[a+52>>2]|0)+12>>2]|0,e);return}function b8(a){a=a|0;if((a|0)==0){return}c_(a);return}function b9(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+252|0;g=f|0;cq(g,b,c[(c[a+48>>2]|0)+12>>2]|0,d,c[(c[a+52>>2]|0)+12>>2]|0,e);i=f;return}function ca(a){a=a|0;if((a|0)==0){return}c_(a);return}function cb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0,E=0.0;f=c[(c[a+48>>2]|0)+12>>2]|0;h=f;i=c[(c[a+52>>2]|0)+12>>2]|0;a=b+60|0;c[a>>2]=0;j=i+12|0;l=+g[e+12>>2];m=+g[j>>2];n=+g[e+8>>2];o=+g[i+16>>2];p=+g[e>>2]+(l*m-n*o)- +g[d>>2];q=m*n+l*o+ +g[e+4>>2]- +g[d+4>>2];o=+g[d+12>>2];l=+g[d+8>>2];n=p*o+q*l;m=o*q+p*(-0.0-l);l=+g[f+8>>2]+ +g[i+8>>2];i=c[f+148>>2]|0;do{if((i|0)>0){f=0;p=-3.4028234663852886e+38;d=0;while(1){q=(n- +g[h+20+(f<<3)>>2])*+g[h+84+(f<<3)>>2]+(m- +g[h+20+(f<<3)+4>>2])*+g[h+84+(f<<3)+4>>2];if(q>l){r=1446;break}e=q>p;s=e?q:p;t=e?f:d;e=f+1|0;if((e|0)<(i|0)){f=e;p=s;d=t}else{r=1430;break}}if((r|0)==1430){u=s<1.1920928955078125e-7;v=t;break}else if((r|0)==1446){return}}else{u=1;v=0}}while(0);r=v+1|0;t=h+20+(v<<3)|0;d=c[t>>2]|0;f=c[t+4>>2]|0;s=(c[k>>2]=d,+g[k>>2]);t=f;p=(c[k>>2]=t,+g[k>>2]);e=h+20+(((r|0)<(i|0)?r:0)<<3)|0;r=c[e>>2]|0;i=c[e+4>>2]|0;q=(c[k>>2]=r,+g[k>>2]);e=i;o=(c[k>>2]=e,+g[k>>2]);if(u){c[a>>2]=1;c[b+56>>2]=1;u=h+84+(v<<3)|0;w=b+40|0;x=c[u+4>>2]|0;c[w>>2]=c[u>>2]|0;c[w+4>>2]=x;x=b+48|0;w=(g[k>>2]=(s+q)*.5,c[k>>2]|0);u=(g[k>>2]=(p+o)*.5,c[k>>2]|0)|0;c[x>>2]=0|w;c[x+4>>2]=u;u=j;x=b;w=c[u+4>>2]|0;c[x>>2]=c[u>>2]|0;c[x+4>>2]=w;c[b+16>>2]=0;return}y=n-s;z=m-p;A=n-q;B=m-o;if(y*(q-s)+z*(o-p)<=0.0){C=y*y+z*z;if(C>l*l){return}c[a>>2]=1;c[b+56>>2]=1;w=b+40|0;x=w;u=(g[k>>2]=y,c[k>>2]|0);D=(g[k>>2]=z,c[k>>2]|0)|0;c[x>>2]=0|u;c[x+4>>2]=D;E=+P(+C);if(E>=1.1920928955078125e-7){C=1.0/E;g[w>>2]=y*C;g[b+44>>2]=z*C}w=b+48|0;c[w>>2]=0|d&-1;c[w+4>>2]=t|f&0;f=j;t=b;w=c[f+4>>2]|0;c[t>>2]=c[f>>2]|0;c[t+4>>2]=w;c[b+16>>2]=0;return}if(A*(s-q)+B*(p-o)>0.0){C=(s+q)*.5;q=(p+o)*.5;w=h+84+(v<<3)|0;if((n-C)*+g[w>>2]+(m-q)*+g[h+84+(v<<3)+4>>2]>l){return}c[a>>2]=1;c[b+56>>2]=1;v=w;w=b+40|0;h=c[v+4>>2]|0;c[w>>2]=c[v>>2]|0;c[w+4>>2]=h;h=b+48|0;w=(g[k>>2]=C,c[k>>2]|0);v=(g[k>>2]=q,c[k>>2]|0)|0;c[h>>2]=0|w;c[h+4>>2]=v;v=j;h=b;w=c[v+4>>2]|0;c[h>>2]=c[v>>2]|0;c[h+4>>2]=w;c[b+16>>2]=0;return}q=A*A+B*B;if(q>l*l){return}c[a>>2]=1;c[b+56>>2]=1;a=b+40|0;w=a;h=(g[k>>2]=A,c[k>>2]|0);v=(g[k>>2]=B,c[k>>2]|0)|0;c[w>>2]=0|h;c[w+4>>2]=v;l=+P(+q);if(l>=1.1920928955078125e-7){q=1.0/l;g[a>>2]=A*q;g[b+44>>2]=B*q}a=b+48|0;c[a>>2]=0|r&-1;c[a+4>>2]=e|i&0;i=j;j=b;e=c[i+4>>2]|0;c[j>>2]=c[i>>2]|0;c[j+4>>2]=e;c[b+16>>2]=0;return}function cc(a){a=a|0;if((a|0)==0){return}c_(a);return}function cd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0,k=0.0;e=bB(f,144)|0;if((e|0)==0){h=0;i=h|0;return i|0}f=e;c[f>>2]=5250160;c[e+4>>2]=4;c[e+48>>2]=a;c[e+52>>2]=d;c[e+56>>2]=0;c[e+60>>2]=0;c[e+124>>2]=0;c[e+128>>2]=0;c1(e+8|0,0,40);g[e+136>>2]=+P(+(+g[a+16>>2]*+g[d+16>>2]));j=+g[a+20>>2];k=+g[d+20>>2];g[e+140>>2]=j>k?j:k;c[f>>2]=5250280;if((c[(c[a+12>>2]|0)+4>>2]|0)!=1){aM(5244696,41,5248588,5245688);return 0}if((c[(c[d+12>>2]|0)+4>>2]|0)==0){h=e;i=h|0;return i|0}else{aM(5244696,42,5248588,5244776);return 0}return 0}function ce(b,d){b=b|0;d=d|0;var e=0,f=0;aX[c[(c[b>>2]|0)+4>>2]&255](b);e=a[5251424]|0;if((e&255)<14){f=d+12+((e&255)<<2)|0;c[b>>2]=c[f>>2]|0;c[f>>2]=b;return}else{aM(5245880,173,5249084,5244332)}}function cf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0,k=0.0;e=bB(f,144)|0;if((e|0)==0){h=0;i=h|0;return i|0}f=e;c[f>>2]=5250160;c[e+4>>2]=4;c[e+48>>2]=a;c[e+52>>2]=d;c[e+56>>2]=0;c[e+60>>2]=0;c[e+124>>2]=0;c[e+128>>2]=0;c1(e+8|0,0,40);g[e+136>>2]=+P(+(+g[a+16>>2]*+g[d+16>>2]));j=+g[a+20>>2];k=+g[d+20>>2];g[e+140>>2]=j>k?j:k;c[f>>2]=5250232;if((c[(c[a+12>>2]|0)+4>>2]|0)!=1){aM(5244616,41,5248420,5245688);return 0}if((c[(c[d+12>>2]|0)+4>>2]|0)==2){h=e;i=h|0;return i|0}else{aM(5244616,42,5248420,5244820);return 0}return 0}function cg(b,d){b=b|0;d=d|0;var e=0,f=0;aX[c[(c[b>>2]|0)+4>>2]&255](b);e=a[5251424]|0;if((e&255)<14){f=d+12+((e&255)<<2)|0;c[b>>2]=c[f>>2]|0;c[f>>2]=b;return}else{aM(5245880,173,5249084,5244332)}}function ch(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0,k=0.0;e=bB(f,144)|0;if((e|0)==0){h=0;i=h|0;return i|0}f=e;c[f>>2]=5250160;c[e+4>>2]=4;c[e+48>>2]=a;c[e+52>>2]=d;c[e+56>>2]=0;c[e+60>>2]=0;c[e+124>>2]=0;c[e+128>>2]=0;c1(e+8|0,0,40);g[e+136>>2]=+P(+(+g[a+16>>2]*+g[d+16>>2]));j=+g[a+20>>2];k=+g[d+20>>2];g[e+140>>2]=j>k?j:k;c[f>>2]=5250184;if((c[(c[a+12>>2]|0)+4>>2]|0)!=2){aM(5244528,41,5248124,5245644);return 0}if((c[(c[d+12>>2]|0)+4>>2]|0)==0){h=e;i=h|0;return i|0}else{aM(5244528,42,5248124,5244776);return 0}return 0}function ci(b,d){b=b|0;d=d|0;var e=0,f=0;aX[c[(c[b>>2]|0)+4>>2]&255](b);e=a[5251424]|0;if((e&255)<14){f=d+12+((e&255)<<2)|0;c[b>>2]=c[f>>2]|0;c[f>>2]=b;return}else{aM(5245880,173,5249084,5244332)}}function cj(a){a=a|0;return}function ck(a){a=a|0;if((a|0)==0){return}c_(a);return}function cl(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0,k=0.0;e=bB(f,144)|0;if((e|0)==0){h=0;i=h|0;return i|0}f=e;c[f>>2]=5250160;c[e+4>>2]=4;c[e+48>>2]=a;c[e+52>>2]=d;c[e+56>>2]=0;c[e+60>>2]=0;c[e+124>>2]=0;c[e+128>>2]=0;c1(e+8|0,0,40);g[e+136>>2]=+P(+(+g[a+16>>2]*+g[d+16>>2]));j=+g[a+20>>2];k=+g[d+20>>2];g[e+140>>2]=j>k?j:k;c[f>>2]=5250340;if((c[(c[a+12>>2]|0)+4>>2]|0)!=2){aM(5244444,44,5248940,5245644);return 0}if((c[(c[d+12>>2]|0)+4>>2]|0)==2){h=e;i=h|0;return i|0}else{aM(5244444,45,5248940,5244820);return 0}return 0}function cm(b,d){b=b|0;d=d|0;var e=0,f=0;aX[c[(c[b>>2]|0)+4>>2]&255](b);e=a[5251424]|0;if((e&255)<14){f=d+12+((e&255)<<2)|0;c[b>>2]=c[f>>2]|0;c[f>>2]=b;return}else{aM(5245880,173,5249084,5244332)}}function cn(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0,E=0,F=0,G=0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,Q=0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0;h=i;i=i+56|0;j=h|0;l=h+4|0;m=h+8|0;n=h+32|0;o=c[(c[b+48>>2]|0)+12>>2]|0;p=o;q=c[(c[b+52>>2]|0)+12>>2]|0;b=q;r=m;s=n;t=d+60|0;c[t>>2]=0;u=+g[o+8>>2]+ +g[q+8>>2];c[j>>2]=0;v=+cv(j,p,e,b,f);if(v>u){i=h;return}c[l>>2]=0;w=+cv(l,b,f,p,e);if(w>u){i=h;return}if(w>v*.9800000190734863+.0010000000474974513){v=+g[f>>2];w=+g[f+4>>2];x=+g[f+8>>2];y=+g[f+12>>2];z=+g[e>>2];A=+g[e+4>>2];B=+g[e+8>>2];C=+g[e+12>>2];q=c[l>>2]|0;c[d+56>>2]=2;D=b;E=p;F=q;G=1;H=z;I=A;J=B;K=C;L=v;M=w;N=x;O=y}else{y=+g[e>>2];x=+g[e+4>>2];w=+g[e+8>>2];v=+g[e+12>>2];C=+g[f>>2];B=+g[f+4>>2];A=+g[f+8>>2];z=+g[f+12>>2];f=c[j>>2]|0;c[d+56>>2]=1;D=p;E=b;F=f;G=0;H=C;I=B;J=A;K=z;L=y;M=x;N=w;O=v}f=c[E+148>>2]|0;if((F|0)<=-1){aM(5244040,151,5249624,5245524)}b=c[D+148>>2]|0;if((b|0)<=(F|0)){aM(5244040,151,5249624,5245524)}v=+g[D+84+(F<<3)>>2];w=+g[D+84+(F<<3)+4>>2];x=O*v-N*w;y=N*v+O*w;w=K*x+J*y;v=-0.0-J;z=K*y+x*v;L1909:do{if((f|0)>0){p=0;x=3.4028234663852886e+38;j=0;while(1){y=w*+g[E+84+(p<<3)>>2]+z*+g[E+84+(p<<3)+4>>2];e=y<x;q=e?p:j;l=p+1|0;if((l|0)==(f|0)){Q=q;break L1909}else{p=l;x=e?y:x;j=q}}}else{Q=0}}while(0);j=Q+1|0;p=(j|0)<(f|0)?j:0;z=+g[E+20+(Q<<3)>>2];w=+g[E+20+(Q<<3)+4>>2];x=H+(K*z-J*w);y=I+(J*z+K*w);j=(g[k>>2]=x,c[k>>2]|0);f=(g[k>>2]=y,c[k>>2]|0)|0;q=F&255;e=Q&255;w=+g[E+20+(p<<3)>>2];z=+g[E+20+(p<<3)+4>>2];A=H+(K*w-J*z);B=I+(J*w+K*z);E=(g[k>>2]=A,c[k>>2]|0);Q=(g[k>>2]=B,c[k>>2]|0)|0;l=F+1|0;o=(l|0)<(b|0)?l:0;l=D+20+(F<<3)|0;F=c[l+4>>2]|0;z=(c[k>>2]=c[l>>2]|0,+g[k>>2]);w=(c[k>>2]=F,+g[k>>2]);F=D+20+(o<<3)|0;D=c[F+4>>2]|0;C=(c[k>>2]=c[F>>2]|0,+g[k>>2]);R=(c[k>>2]=D,+g[k>>2]);S=C-z;T=R-w;U=+P(+(S*S+T*T));if(U<1.1920928955078125e-7){V=S;W=T}else{X=1.0/U;V=S*X;W=T*X}X=O*V-N*W;T=O*W+N*V;S=X*-1.0;U=L+(O*z-N*w);Y=M+(N*z+O*w);Z=U*T+Y*S;_=u-(U*X+Y*T);Y=u+((L+(O*C-N*R))*X+(M+(N*C+O*R))*T);O=-0.0-X;N=-0.0-T;M=x*O+y*N-_;L=A*O+B*N-_;if(M>0.0){$=0}else{D=m;c[D>>2]=0|j;c[D+4>>2]=f;a[m+8|0]=q;a[r+9|0]=e;a[r+10|0]=1;a[r+11|0]=0;$=1}if(L>0.0){aa=$}else{f=m+($*12&-1)|0;D=f;j=f;c[j>>2]=0|E;c[j+4>>2]=Q;a[m+($*12&-1)+8|0]=q;a[D+9|0]=p&255;a[D+10|0]=1;a[D+11|0]=0;aa=$+1|0}if(M*L<0.0){_=M/(M-L);$=m+(aa*12&-1)|0;D=(g[k>>2]=x+_*(A-x),c[k>>2]|0);p=(g[k>>2]=y+_*(B-y),c[k>>2]|0)|0;c[$>>2]=0|D;c[$+4>>2]=p;p=m+(aa*12&-1)+8|0;$=p;a[p]=q;a[$+1|0]=e;a[$+2|0]=0;a[$+3|0]=1;ab=aa+1|0}else{ab=aa}if((ab|0)<2){i=h;return}y=+g[m>>2];B=+g[m+4>>2];_=X*y+T*B-Y;ab=m+12|0;x=+g[ab>>2];A=+g[m+16>>2];L=X*x+T*A-Y;if(_>0.0){ac=0}else{c0(s|0,r|0,12);ac=1}if(L>0.0){ad=ac}else{c0(n+(ac*12&-1)|0,ab|0,12);ad=ac+1|0}if(_*L<0.0){Y=_/(_-L);ac=n+(ad*12&-1)|0;ab=(g[k>>2]=y+Y*(x-y),c[k>>2]|0);r=(g[k>>2]=B+Y*(A-B),c[k>>2]|0)|0;c[ac>>2]=0|ab;c[ac+4>>2]=r;r=n+(ad*12&-1)+8|0;ac=r;a[r]=o&255;a[ac+1|0]=a[(m+8|0)+1|0]|0;a[ac+2|0]=0;a[ac+3|0]=1;ae=ad+1|0}else{ae=ad}if((ae|0)<2){i=h;return}ae=d+40|0;ad=(g[k>>2]=W,c[k>>2]|0);ac=(g[k>>2]=V*-1.0,c[k>>2]|0)|0;c[ae>>2]=0|ad;c[ae+4>>2]=ac;ac=d+48|0;ae=(g[k>>2]=(z+C)*.5,c[k>>2]|0);ad=(g[k>>2]=(w+R)*.5,c[k>>2]|0)|0;c[ac>>2]=0|ae;c[ac+4>>2]=ad;R=+g[n>>2];w=+g[n+4>>2];ad=T*R+S*w-Z>u;do{if(G<<24>>24==0){if(ad){af=0}else{C=R-H;z=w-I;ac=d;ae=(g[k>>2]=K*C+J*z,c[k>>2]|0);m=(g[k>>2]=C*v+K*z,c[k>>2]|0)|0;c[ac>>2]=0|ae;c[ac+4>>2]=m;c[d+16>>2]=c[n+8>>2]|0;af=1}z=+g[n+12>>2];C=+g[n+16>>2];if(T*z+S*C-Z>u){ag=af;break}V=z-H;z=C-I;m=d+(af*20&-1)|0;ac=(g[k>>2]=K*V+J*z,c[k>>2]|0);ae=(g[k>>2]=V*v+K*z,c[k>>2]|0)|0;c[m>>2]=0|ac;c[m+4>>2]=ae;c[d+(af*20&-1)+16>>2]=c[n+20>>2]|0;ag=af+1|0}else{if(ad){ah=0}else{z=R-H;V=w-I;ae=d;m=(g[k>>2]=K*z+J*V,c[k>>2]|0);ac=(g[k>>2]=z*v+K*V,c[k>>2]|0)|0;c[ae>>2]=0|m;c[ae+4>>2]=ac;ac=d+16|0;ae=c[n+8>>2]|0;c[ac>>2]=ae;m=ac;a[ac]=ae>>>8&255;a[m+1|0]=ae&255;a[m+2|0]=ae>>>24&255;a[m+3|0]=ae>>>16&255;ah=1}V=+g[n+12>>2];z=+g[n+16>>2];if(T*V+S*z-Z>u){ag=ah;break}C=V-H;V=z-I;ae=d+(ah*20&-1)|0;m=(g[k>>2]=K*C+J*V,c[k>>2]|0);ac=(g[k>>2]=C*v+K*V,c[k>>2]|0)|0;c[ae>>2]=0|m;c[ae+4>>2]=ac;ac=d+(ah*20&-1)+16|0;ae=c[n+20>>2]|0;c[ac>>2]=ae;m=ac;a[ac]=ae>>>8&255;a[m+1|0]=ae&255;a[m+2|0]=ae>>>24&255;a[m+3|0]=ae>>>16&255;ag=ah+1|0}}while(0);c[t>>2]=ag;i=h;return}function co(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;i=b+40|0;c[i>>2]=d;c[b+44>>2]=e;c[b+48>>2]=f;c[b+28>>2]=0;c[b+36>>2]=0;c[b+32>>2]=0;j=b|0;c[j>>2]=g;c[b+4>>2]=h;h=d<<2;d=g+102796|0;k=c[d>>2]|0;if((k|0)>=32){aM(5245076,38,5248864,5244248)}l=g+102412+(k*12&-1)|0;c[g+102412+(k*12&-1)+4>>2]=h;m=g+102400|0;n=c[m>>2]|0;if((n+h|0)>102400){c[l>>2]=cZ(h)|0;a[g+102412+(k*12&-1)+8|0]=1}else{c[l>>2]=g+n|0;a[g+102412+(k*12&-1)+8|0]=0;c[m>>2]=(c[m>>2]|0)+h|0}m=g+102404|0;k=(c[m>>2]|0)+h|0;c[m>>2]=k;m=g+102408|0;g=c[m>>2]|0;c[m>>2]=(g|0)>(k|0)?g:k;c[d>>2]=(c[d>>2]|0)+1|0;c[b+8>>2]=c[l>>2]|0;l=c[j>>2]|0;d=e<<2;e=l+102796|0;k=c[e>>2]|0;if((k|0)>=32){aM(5245076,38,5248864,5244248)}g=l+102412+(k*12&-1)|0;c[l+102412+(k*12&-1)+4>>2]=d;m=l+102400|0;h=c[m>>2]|0;if((h+d|0)>102400){c[g>>2]=cZ(d)|0;a[l+102412+(k*12&-1)+8|0]=1}else{c[g>>2]=l+h|0;a[l+102412+(k*12&-1)+8|0]=0;c[m>>2]=(c[m>>2]|0)+d|0}m=l+102404|0;k=(c[m>>2]|0)+d|0;c[m>>2]=k;m=l+102408|0;l=c[m>>2]|0;c[m>>2]=(l|0)>(k|0)?l:k;c[e>>2]=(c[e>>2]|0)+1|0;c[b+12>>2]=c[g>>2]|0;g=c[j>>2]|0;e=f<<2;f=g+102796|0;k=c[f>>2]|0;if((k|0)>=32){aM(5245076,38,5248864,5244248)}l=g+102412+(k*12&-1)|0;c[g+102412+(k*12&-1)+4>>2]=e;m=g+102400|0;d=c[m>>2]|0;if((d+e|0)>102400){c[l>>2]=cZ(e)|0;a[g+102412+(k*12&-1)+8|0]=1}else{c[l>>2]=g+d|0;a[g+102412+(k*12&-1)+8|0]=0;c[m>>2]=(c[m>>2]|0)+e|0}m=g+102404|0;k=(c[m>>2]|0)+e|0;c[m>>2]=k;m=g+102408|0;g=c[m>>2]|0;c[m>>2]=(g|0)>(k|0)?g:k;c[f>>2]=(c[f>>2]|0)+1|0;c[b+16>>2]=c[l>>2]|0;l=c[j>>2]|0;f=(c[i>>2]|0)*12&-1;k=l+102796|0;g=c[k>>2]|0;if((g|0)>=32){aM(5245076,38,5248864,5244248)}m=l+102412+(g*12&-1)|0;c[l+102412+(g*12&-1)+4>>2]=f;e=l+102400|0;d=c[e>>2]|0;if((d+f|0)>102400){c[m>>2]=cZ(f)|0;a[l+102412+(g*12&-1)+8|0]=1}else{c[m>>2]=l+d|0;a[l+102412+(g*12&-1)+8|0]=0;c[e>>2]=(c[e>>2]|0)+f|0}e=l+102404|0;g=(c[e>>2]|0)+f|0;c[e>>2]=g;e=l+102408|0;l=c[e>>2]|0;c[e>>2]=(l|0)>(g|0)?l:g;c[k>>2]=(c[k>>2]|0)+1|0;c[b+24>>2]=c[m>>2]|0;m=c[j>>2]|0;j=(c[i>>2]|0)*12&-1;i=m+102796|0;k=c[i>>2]|0;if((k|0)>=32){aM(5245076,38,5248864,5244248)}g=m+102412+(k*12&-1)|0;c[m+102412+(k*12&-1)+4>>2]=j;l=m+102400|0;e=c[l>>2]|0;if((e+j|0)>102400){c[g>>2]=cZ(j)|0;a[m+102412+(k*12&-1)+8|0]=1;f=m+102404|0;d=c[f>>2]|0;h=d+j|0;c[f>>2]=h;n=m+102408|0;o=c[n>>2]|0;p=(o|0)>(h|0);q=p?o:h;c[n>>2]=q;r=c[i>>2]|0;s=r+1|0;c[i>>2]=s;t=g|0;u=c[t>>2]|0;v=u;w=b+20|0;c[w>>2]=v;return}else{c[g>>2]=m+e|0;a[m+102412+(k*12&-1)+8|0]=0;c[l>>2]=(c[l>>2]|0)+j|0;f=m+102404|0;d=c[f>>2]|0;h=d+j|0;c[f>>2]=h;n=m+102408|0;o=c[n>>2]|0;p=(o|0)>(h|0);q=p?o:h;c[n>>2]=q;r=c[i>>2]|0;s=r+1|0;c[i>>2]=s;t=g|0;u=c[t>>2]|0;v=u;w=b+20|0;c[w>>2]=v;return}}function cp(b,d,e,f,h){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0,j=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0;i=b+60|0;c[i>>2]=0;j=f+12|0;l=+g[h+12>>2];m=+g[j>>2];n=+g[h+8>>2];o=+g[f+16>>2];p=+g[h>>2]+(l*m-n*o)- +g[e>>2];q=m*n+l*o+ +g[h+4>>2]- +g[e+4>>2];o=+g[e+12>>2];l=+g[e+8>>2];n=p*o+q*l;m=o*q+p*(-0.0-l);e=d+12|0;h=c[e>>2]|0;r=c[e+4>>2]|0;l=(c[k>>2]=h,+g[k>>2]);e=r;p=(c[k>>2]=e,+g[k>>2]);s=d+20|0;t=c[s>>2]|0;u=c[s+4>>2]|0;q=(c[k>>2]=t,+g[k>>2]);s=u;o=(c[k>>2]=s,+g[k>>2]);v=q-l;w=o-p;x=v*(q-n)+w*(o-m);y=n-l;z=m-p;A=y*v+z*w;B=+g[d+8>>2]+ +g[f+8>>2];if(A<=0.0){if(y*y+z*z>B*B){return}do{if((a[d+44|0]&1)<<24>>24!=0){f=d+28|0;C=c[f+4>>2]|0;D=(c[k>>2]=c[f>>2]|0,+g[k>>2]);if((l-n)*(l-D)+(p-m)*(p-(c[k>>2]=C,+g[k>>2]))<=0.0){break}return}}while(0);c[i>>2]=1;c[b+56>>2]=0;g[b+40>>2]=0.0;g[b+44>>2]=0.0;C=b+48|0;c[C>>2]=0|h&-1;c[C+4>>2]=e|r&0;C=b+16|0;c[C>>2]=0;f=C;a[C]=0;a[f+1|0]=0;a[f+2|0]=0;a[f+3|0]=0;f=j;C=b;E=c[f+4>>2]|0;c[C>>2]=c[f>>2]|0;c[C+4>>2]=E;return}if(x<=0.0){D=n-q;F=m-o;if(D*D+F*F>B*B){return}do{if((a[d+45|0]&1)<<24>>24!=0){E=d+36|0;C=c[E+4>>2]|0;G=(c[k>>2]=c[E>>2]|0,+g[k>>2]);if(D*(G-q)+F*((c[k>>2]=C,+g[k>>2])-o)<=0.0){break}return}}while(0);c[i>>2]=1;c[b+56>>2]=0;g[b+40>>2]=0.0;g[b+44>>2]=0.0;d=b+48|0;c[d>>2]=0|t&-1;c[d+4>>2]=s|u&0;u=b+16|0;c[u>>2]=0;s=u;a[u]=1;a[s+1|0]=0;a[s+2|0]=0;a[s+3|0]=0;s=j;u=b;d=c[s+4>>2]|0;c[u>>2]=c[s>>2]|0;c[u+4>>2]=d;return}F=v*v+w*w;if(F<=0.0){aM(5244080,127,5249888,5245568)}D=1.0/F;F=n-(l*x+q*A)*D;q=m-(p*x+o*A)*D;if(F*F+q*q>B*B){return}B=-0.0-w;if(v*z+y*B<0.0){H=w;I=-0.0-v}else{H=B;I=v}v=+P(+(I*I+H*H));if(v<1.1920928955078125e-7){J=H;K=I}else{B=1.0/v;J=H*B;K=I*B}c[i>>2]=1;c[b+56>>2]=1;i=b+40|0;d=(g[k>>2]=J,c[k>>2]|0);u=(g[k>>2]=K,c[k>>2]|0)|0;c[i>>2]=0|d;c[i+4>>2]=u;u=b+48|0;c[u>>2]=0|h&-1;c[u+4>>2]=e|r&0;r=b+16|0;c[r>>2]=0;e=r;a[r]=0;a[e+1|0]=0;a[e+2|0]=1;a[e+3|0]=0;e=j;j=b;b=c[e+4>>2]|0;c[j>>2]=c[e>>2]|0;c[j+4>>2]=b;return}function cq(b,d,e,f,h,j){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;var l=0,m=0,n=0,o=0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0,x=0.0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0.0,M=0.0,N=0.0,O=0.0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0,Y=0.0,Z=0.0,_=0,$=0.0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0.0,ap=0.0,aq=0,ar=0,as=0.0,at=0,au=0,av=0.0,aw=0,ax=0,ay=0.0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0.0,aJ=0.0,aK=0.0,aL=0.0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0.0,a2=0,a3=0,a4=0.0;l=i;i=i+48|0;m=l|0;n=l+24|0;o=b+132|0;p=+g[f+12>>2];q=+g[j+8>>2];r=+g[f+8>>2];s=+g[j+12>>2];t=p*q-r*s;u=q*r+p*s;v=(g[k>>2]=t,c[k>>2]|0);w=(g[k>>2]=u,c[k>>2]|0)|0;s=+g[j>>2]- +g[f>>2];q=+g[j+4>>2]- +g[f+4>>2];x=p*s+r*q;y=s*(-0.0-r)+p*q;f=(g[k>>2]=x,c[k>>2]|0);j=(g[k>>2]=y,c[k>>2]|0)|0;z=o;c[z>>2]=0|f;c[z+4>>2]=j;j=b+140|0;c[j>>2]=0|v;c[j+4>>2]=w;w=b+144|0;q=+g[h+12>>2];j=b+140|0;p=+g[h+16>>2];v=o|0;r=x+(u*q-t*p);o=b+136|0;x=q*t+u*p+y;z=b+148|0;f=(g[k>>2]=r,c[k>>2]|0);A=(g[k>>2]=x,c[k>>2]|0)|0;c[z>>2]=0|f;c[z+4>>2]=A;A=e+28|0;z=b+156|0;f=c[A>>2]|0;B=c[A+4>>2]|0;c[z>>2]=f;c[z+4>>2]=B;z=e+12|0;A=b+164|0;C=c[z>>2]|0;D=c[z+4>>2]|0;c[A>>2]=C;c[A+4>>2]=D;z=e+20|0;E=b+172|0;F=c[z>>2]|0;G=c[z+4>>2]|0;c[E>>2]=F;c[E+4>>2]=G;z=e+36|0;H=b+180|0;I=c[z>>2]|0;J=c[z+4>>2]|0;c[H>>2]=I;c[H+4>>2]=J;H=a[e+44|0]&1;z=H<<24>>24!=0;K=a[e+45|0]|0;e=(K&1)<<24>>24!=0;y=(c[k>>2]=F,+g[k>>2]);p=(c[k>>2]=C,+g[k>>2]);u=y-p;t=(c[k>>2]=G,+g[k>>2]);G=b+168|0;q=(c[k>>2]=D,+g[k>>2]);s=t-q;L=+P(+(u*u+s*s));M=(c[k>>2]=f,+g[k>>2]);N=(c[k>>2]=B,+g[k>>2]);O=(c[k>>2]=I,+g[k>>2]);Q=(c[k>>2]=J,+g[k>>2]);if(L<1.1920928955078125e-7){R=u;S=s}else{T=1.0/L;R=u*T;S=s*T}J=b+196|0;T=-0.0-R;I=J|0;g[I>>2]=S;B=b+200|0;g[B>>2]=T;s=(r-p)*S+(x-q)*T;if(z){T=p-M;p=q-N;q=+P(+(T*T+p*p));if(q<1.1920928955078125e-7){U=T;V=p}else{u=1.0/q;U=T*u;V=p*u}u=-0.0-U;g[b+188>>2]=V;g[b+192>>2]=u;W=(r-M)*V+(x-N)*u;X=S*U-R*V>=0.0}else{W=0.0;X=0}L2036:do{if(e){V=O-y;U=Q-t;u=+P(+(V*V+U*U));if(u<1.1920928955078125e-7){Y=V;Z=U}else{N=1.0/u;Y=V*N;Z=U*N}N=-0.0-Y;f=b+204|0;g[f>>2]=Z;D=b+208|0;g[D>>2]=N;C=R*Z-S*Y>0.0;U=(r-y)*Z+(x-t)*N;if((H&K)<<24>>24==0){_=C;$=U;aa=1645;break}if(X&C){do{if(W<0.0&s<0.0){F=U>=0.0;a[b+248|0]=F&1;ab=b+212|0;if(F){ac=ab;break}F=ab;ab=(g[k>>2]=-0.0-S,c[k>>2]|0);ad=0|ab;ab=(g[k>>2]=R,c[k>>2]|0)|0;c[F>>2]=ad;c[F+4>>2]=ab;F=b+228|0;c[F>>2]=ad;c[F+4>>2]=ab;F=b+236|0;c[F>>2]=ad;c[F+4>>2]=ab;break L2036}else{a[b+248|0]=1;ac=b+212|0}}while(0);ab=J;F=ac;ad=c[ab+4>>2]|0;c[F>>2]=c[ab>>2]|0;c[F+4>>2]=ad;ad=b+188|0;F=b+228|0;ab=c[ad+4>>2]|0;c[F>>2]=c[ad>>2]|0;c[F+4>>2]=ab;ab=b+204|0;F=b+236|0;ad=c[ab+4>>2]|0;c[F>>2]=c[ab>>2]|0;c[F+4>>2]=ad;break}if(X){do{if(W<0.0){if(s<0.0){a[b+248|0]=0;ae=b+212|0}else{ad=U>=0.0;a[b+248|0]=ad&1;F=b+212|0;if(ad){af=F;break}else{ae=F}}F=ae;ad=(g[k>>2]=-0.0-S,c[k>>2]|0);ab=(g[k>>2]=R,c[k>>2]|0)|0;c[F>>2]=0|ad;c[F+4>>2]=ab;N=-0.0- +g[D>>2];ab=b+228|0;F=(g[k>>2]=-0.0- +g[f>>2],c[k>>2]|0);ad=(g[k>>2]=N,c[k>>2]|0)|0;c[ab>>2]=0|F;c[ab+4>>2]=ad;N=-0.0- +g[B>>2];ad=b+236|0;ab=(g[k>>2]=-0.0- +g[I>>2],c[k>>2]|0);F=(g[k>>2]=N,c[k>>2]|0)|0;c[ad>>2]=0|ab;c[ad+4>>2]=F;break L2036}else{a[b+248|0]=1;af=b+212|0}}while(0);F=J;ad=af;ab=c[F+4>>2]|0;c[ad>>2]=c[F>>2]|0;c[ad+4>>2]=ab;ab=b+188|0;ad=b+228|0;ag=c[ab+4>>2]|0;c[ad>>2]=c[ab>>2]|0;c[ad+4>>2]=ag;ag=b+236|0;ad=c[F+4>>2]|0;c[ag>>2]=c[F>>2]|0;c[ag+4>>2]=ad;break}if(!C){do{if(W<0.0|s<0.0){a[b+248|0]=0;ah=b+212|0}else{ad=U>=0.0;a[b+248|0]=ad&1;ag=b+212|0;if(!ad){ah=ag;break}ad=J;F=ag;ag=c[ad>>2]|0;ab=c[ad+4>>2]|0;c[F>>2]=ag;c[F+4>>2]=ab;F=b+228|0;c[F>>2]=ag;c[F+4>>2]=ab;F=b+236|0;c[F>>2]=ag;c[F+4>>2]=ab;break L2036}}while(0);C=ah;ab=(g[k>>2]=-0.0-S,c[k>>2]|0);F=(g[k>>2]=R,c[k>>2]|0)|0;c[C>>2]=0|ab;c[C+4>>2]=F;N=-0.0- +g[D>>2];F=b+228|0;C=(g[k>>2]=-0.0- +g[f>>2],c[k>>2]|0);ab=(g[k>>2]=N,c[k>>2]|0)|0;c[F>>2]=0|C;c[F+4>>2]=ab;N=-0.0- +g[b+192>>2];ab=b+236|0;F=(g[k>>2]=-0.0- +g[b+188>>2],c[k>>2]|0);C=(g[k>>2]=N,c[k>>2]|0)|0;c[ab>>2]=0|F;c[ab+4>>2]=C;break}do{if(U<0.0){if(W<0.0){a[b+248|0]=0;ai=b+212|0}else{C=s>=0.0;a[b+248|0]=C&1;ab=b+212|0;if(C){aj=ab;break}else{ai=ab}}ab=ai;C=(g[k>>2]=-0.0-S,c[k>>2]|0);F=(g[k>>2]=R,c[k>>2]|0)|0;c[ab>>2]=0|C;c[ab+4>>2]=F;N=-0.0- +g[B>>2];F=b+228|0;ab=(g[k>>2]=-0.0- +g[I>>2],c[k>>2]|0);C=(g[k>>2]=N,c[k>>2]|0)|0;c[F>>2]=0|ab;c[F+4>>2]=C;N=-0.0- +g[b+192>>2];C=b+236|0;F=(g[k>>2]=-0.0- +g[b+188>>2],c[k>>2]|0);ab=(g[k>>2]=N,c[k>>2]|0)|0;c[C>>2]=0|F;c[C+4>>2]=ab;break L2036}else{a[b+248|0]=1;aj=b+212|0}}while(0);f=J;D=aj;ab=c[f+4>>2]|0;c[D>>2]=c[f>>2]|0;c[D+4>>2]=ab;ab=b+228|0;D=c[f+4>>2]|0;c[ab>>2]=c[f>>2]|0;c[ab+4>>2]=D;D=b+204|0;ab=b+236|0;f=c[D+4>>2]|0;c[ab>>2]=c[D>>2]|0;c[ab+4>>2]=f;break}else{_=0;$=0.0;aa=1645}}while(0);L2077:do{if((aa|0)==1645){if(z){aj=W>=0.0;if(X){do{if(aj){a[b+248|0]=1;ak=b+212|0}else{ai=s>=0.0;a[b+248|0]=ai&1;ah=b+212|0;if(ai){ak=ah;break}ai=ah;ah=(g[k>>2]=-0.0-S,c[k>>2]|0);af=0;ae=(g[k>>2]=R,c[k>>2]|0);c[ai>>2]=af|ah;c[ai+4>>2]=ae|0;ai=J;ah=b+228|0;ac=c[ai>>2]|0;K=c[ai+4>>2]|0;c[ah>>2]=ac;c[ah+4>>2]=K;K=b+236|0;c[K>>2]=af|(g[k>>2]=-0.0-(c[k>>2]=ac,+g[k>>2]),c[k>>2]|0);c[K+4>>2]=ae|0;break L2077}}while(0);ae=J;K=ak;ac=c[ae+4>>2]|0;c[K>>2]=c[ae>>2]|0;c[K+4>>2]=ac;ac=b+188|0;K=b+228|0;ae=c[ac+4>>2]|0;c[K>>2]=c[ac>>2]|0;c[K+4>>2]=ae;t=-0.0- +g[B>>2];ae=b+236|0;K=(g[k>>2]=-0.0- +g[I>>2],c[k>>2]|0);ac=(g[k>>2]=t,c[k>>2]|0)|0;c[ae>>2]=0|K;c[ae+4>>2]=ac;break}else{do{if(aj){ac=s>=0.0;a[b+248|0]=ac&1;ae=b+212|0;if(!ac){al=ae;break}ac=J;K=ae;ae=c[ac>>2]|0;af=c[ac+4>>2]|0;c[K>>2]=ae;c[K+4>>2]=af;K=b+228|0;c[K>>2]=ae;c[K+4>>2]=af;af=b+236|0;K=(g[k>>2]=-0.0-(c[k>>2]=ae,+g[k>>2]),c[k>>2]|0);ae=(g[k>>2]=R,c[k>>2]|0)|0;c[af>>2]=0|K;c[af+4>>2]=ae;break L2077}else{a[b+248|0]=0;al=b+212|0}}while(0);aj=al;ae=(g[k>>2]=-0.0-S,c[k>>2]|0);af=(g[k>>2]=R,c[k>>2]|0)|0;c[aj>>2]=0|ae;c[aj+4>>2]=af;af=J;aj=b+228|0;ae=c[af+4>>2]|0;c[aj>>2]=c[af>>2]|0;c[aj+4>>2]=ae;t=-0.0- +g[b+192>>2];ae=b+236|0;aj=(g[k>>2]=-0.0- +g[b+188>>2],c[k>>2]|0);af=(g[k>>2]=t,c[k>>2]|0)|0;c[ae>>2]=0|aj;c[ae+4>>2]=af;break}}af=s>=0.0;if(!e){a[b+248|0]=af&1;ae=b+212|0;if(af){aj=J;K=ae;ac=c[aj>>2]|0;ah=c[aj+4>>2]|0;c[K>>2]=ac;c[K+4>>2]=ah;ah=b+228|0;K=(g[k>>2]=-0.0-(c[k>>2]=ac,+g[k>>2]),c[k>>2]|0);ac=0|K;K=(g[k>>2]=R,c[k>>2]|0)|0;c[ah>>2]=ac;c[ah+4>>2]=K;ah=b+236|0;c[ah>>2]=ac;c[ah+4>>2]=K;break}else{K=ae;ae=(g[k>>2]=-0.0-S,c[k>>2]|0);ah=(g[k>>2]=R,c[k>>2]|0)|0;c[K>>2]=0|ae;c[K+4>>2]=ah;ah=J;K=b+228|0;ae=c[ah>>2]|0;ac=c[ah+4>>2]|0;c[K>>2]=ae;c[K+4>>2]=ac;K=b+236|0;c[K>>2]=ae;c[K+4>>2]=ac;break}}if(_){do{if(af){a[b+248|0]=1;am=b+212|0}else{ac=$>=0.0;a[b+248|0]=ac&1;K=b+212|0;if(ac){am=K;break}ac=K;K=(g[k>>2]=-0.0-S,c[k>>2]|0);ae=0|K;K=(g[k>>2]=R,c[k>>2]|0)|0;c[ac>>2]=ae;c[ac+4>>2]=K;ac=b+228|0;c[ac>>2]=ae;c[ac+4>>2]=K;K=J;ac=b+236|0;ae=c[K+4>>2]|0;c[ac>>2]=c[K>>2]|0;c[ac+4>>2]=ae;break L2077}}while(0);ae=J;ac=am;K=c[ae+4>>2]|0;c[ac>>2]=c[ae>>2]|0;c[ac+4>>2]=K;t=-0.0- +g[B>>2];K=b+228|0;ac=(g[k>>2]=-0.0- +g[I>>2],c[k>>2]|0);ae=(g[k>>2]=t,c[k>>2]|0)|0;c[K>>2]=0|ac;c[K+4>>2]=ae;ae=b+204|0;K=b+236|0;ac=c[ae+4>>2]|0;c[K>>2]=c[ae>>2]|0;c[K+4>>2]=ac;break}else{do{if(af){ac=$>=0.0;a[b+248|0]=ac&1;K=b+212|0;if(!ac){an=K;break}ac=J;ae=K;K=c[ac>>2]|0;ah=c[ac+4>>2]|0;c[ae>>2]=K;c[ae+4>>2]=ah;ae=b+228|0;ac=(g[k>>2]=-0.0-(c[k>>2]=K,+g[k>>2]),c[k>>2]|0);aj=(g[k>>2]=R,c[k>>2]|0)|0;c[ae>>2]=0|ac;c[ae+4>>2]=aj;aj=b+236|0;c[aj>>2]=K;c[aj+4>>2]=ah;break L2077}else{a[b+248|0]=0;an=b+212|0}}while(0);af=an;ah=(g[k>>2]=-0.0-S,c[k>>2]|0);aj=(g[k>>2]=R,c[k>>2]|0)|0;c[af>>2]=0|ah;c[af+4>>2]=aj;t=-0.0- +g[b+208>>2];aj=b+228|0;af=(g[k>>2]=-0.0- +g[b+204>>2],c[k>>2]|0);ah=(g[k>>2]=t,c[k>>2]|0)|0;c[aj>>2]=0|af;c[aj+4>>2]=ah;ah=J;aj=b+236|0;af=c[ah+4>>2]|0;c[aj>>2]=c[ah>>2]|0;c[aj+4>>2]=af;break}}}while(0);an=h+148|0;am=b+128|0;c[am>>2]=c[an>>2]|0;L2115:do{if((c[an>>2]|0)>0){_=0;while(1){R=+g[w>>2];S=+g[h+20+(_<<3)>>2];$=+g[j>>2];s=+g[h+20+(_<<3)+4>>2];W=S*$+R*s+ +g[o>>2];e=b+(_<<3)|0;al=(g[k>>2]=+g[v>>2]+(R*S-$*s),c[k>>2]|0);ak=(g[k>>2]=W,c[k>>2]|0)|0;c[e>>2]=0|al;c[e+4>>2]=ak;W=+g[w>>2];s=+g[h+84+(_<<3)>>2];$=+g[j>>2];S=+g[h+84+(_<<3)+4>>2];ak=b+64+(_<<3)|0;e=(g[k>>2]=W*s-$*S,c[k>>2]|0);al=(g[k>>2]=s*$+W*S,c[k>>2]|0)|0;c[ak>>2]=0|e;c[ak+4>>2]=al;al=_+1|0;if((al|0)<(c[an>>2]|0)){_=al}else{break L2115}}}}while(0);an=b+244|0;g[an>>2]=.019999999552965164;_=d+60|0;c[_>>2]=0;al=b+248|0;ak=c[am>>2]|0;e=(ak|0)>0;L2119:do{if(e){S=+g[b+164>>2];W=+g[G>>2];$=+g[b+212>>2];s=+g[b+216>>2];X=0;R=3.4028234663852886e+38;while(1){t=$*(+g[b+(X<<3)>>2]-S)+s*(+g[b+(X<<3)+4>>2]-W);x=t<R?t:R;z=X+1|0;if((z|0)==(ak|0)){ao=x;break L2119}else{X=z;R=x}}}else{ao=3.4028234663852886e+38}}while(0);R=+g[an>>2];if(ao>R){i=l;return}X=b+216|0;W=+g[X>>2];z=b+212|0;s=+g[z>>2];do{if(e){S=+g[b+164>>2];$=+g[G>>2];x=+g[b+172>>2];t=+g[b+176>>2];af=b+228|0;aj=b+232|0;ah=b+236|0;K=b+240|0;ae=0;Z=-3.4028234663852886e+38;ac=0;ai=-1;y=-3.4028234663852886e+38;while(1){r=+g[b+64+(ae<<3)>>2];Y=-0.0-r;Q=-0.0- +g[b+64+(ae<<3)+4>>2];O=+g[b+(ae<<3)>>2];U=+g[b+(ae<<3)+4>>2];N=(O-S)*Y+(U-$)*Q;V=(O-x)*Y+(U-t)*Q;U=N<V?N:V;if(U>R){ap=U;aq=ae;ar=2;break}do{if(W*r+s*Q<0.0){if((Y- +g[af>>2])*s+(Q- +g[aj>>2])*W>=-.03490658849477768&U>Z){aa=1684;break}else{as=Z;at=ac;au=ai;av=y;break}}else{if((Y- +g[ah>>2])*s+(Q- +g[K>>2])*W>=-.03490658849477768&U>Z){aa=1684;break}else{as=Z;at=ac;au=ai;av=y;break}}}while(0);if((aa|0)==1684){aa=0;as=U;at=2;au=ae;av=U}H=ae+1|0;if((H|0)<(ak|0)){ae=H;Z=as;ac=at;ai=au;y=av}else{aw=at;ax=au;ay=av;aa=1686;break}}if((aa|0)==1686){if((aw|0)==0){aa=1689;break}else{ap=ay;aq=ax;ar=aw}}if(ap>R){i=l;return}if(ap<=ao*.9800000190734863+.0010000000474974513){aa=1689;break}ai=d+56|0;if((ar|0)==1){az=ai;aa=1691;break}c[ai>>2]=2;ai=c[A>>2]|0;ac=c[A+4>>2]|0;ae=aq&255;K=c[E>>2]|0;ah=c[E+4>>2]|0;aj=aq+1|0;af=(aj|0)<(c[am>>2]|0)?aj:0;aj=b+(aq<<3)|0;H=c[aj>>2]|0;f=c[aj+4>>2]|0;aj=b+(af<<3)|0;ab=c[aj>>2]|0;D=c[aj+4>>2]|0;aj=b+64+(aq<<3)|0;C=c[aj>>2]|0;F=c[aj+4>>2]|0;y=(c[k>>2]=ai,+g[k>>2]);Z=(c[k>>2]=ac,+g[k>>2]);t=(c[k>>2]=K,+g[k>>2]);aA=aq;aB=af&255;aC=C;aD=F;aE=ab;aF=D;aG=H;aH=f;aI=t;aJ=y;aK=(c[k>>2]=ah,+g[k>>2]);aL=Z;aM=0;aN=ac;aO=ai;aP=ae;aQ=ah;aR=K;aS=ae;aT=0;aU=1;break}else{aa=1689}}while(0);do{if((aa|0)==1689){az=d+56|0;aa=1691;break}}while(0);do{if((aa|0)==1691){c[az>>2]=1;aq=c[am>>2]|0;L2150:do{if((aq|0)>1){ao=+g[X>>2];ap=+g[z>>2];ar=0;R=ap*+g[b+64>>2]+ao*+g[b+68>>2];aw=1;while(1){ay=ap*+g[b+64+(aw<<3)>>2]+ao*+g[b+64+(aw<<3)+4>>2];ax=ay<R;au=ax?aw:ar;at=aw+1|0;if((at|0)<(aq|0)){ar=au;R=ax?ay:R;aw=at}else{aV=au;break L2150}}}else{aV=0}}while(0);aw=aV+1|0;ar=(aw|0)<(aq|0)?aw:0;aw=b+(aV<<3)|0;au=c[aw>>2]|0;at=c[aw+4>>2]|0;aw=aV&255;ax=b+(ar<<3)|0;ak=c[ax>>2]|0;G=c[ax+4>>2]|0;ax=ar&255;ar=(a[al]&1)<<24>>24==0;R=(c[k>>2]=au,+g[k>>2]);ao=(c[k>>2]=at,+g[k>>2]);ap=(c[k>>2]=ak,+g[k>>2]);U=(c[k>>2]=G,+g[k>>2]);if(ar){ar=c[E>>2]|0;e=c[E+4>>2]|0;ae=c[A>>2]|0;K=c[A+4>>2]|0;ay=-0.0- +g[B>>2];ah=(g[k>>2]=-0.0- +g[I>>2],c[k>>2]|0);aA=1;aB=0;aC=ah;aD=(g[k>>2]=ay,c[k>>2]|0);aE=ae;aF=K;aG=ar;aH=e;aI=ap;aJ=R;aK=U;aL=ao;aM=1;aN=at;aO=au;aP=aw;aQ=G;aR=ak;aS=ax;aT=1;aU=0;break}else{e=J;aA=0;aB=1;aC=c[e>>2]|0;aD=c[e+4>>2]|0;aE=c[E>>2]|0;aF=c[E+4>>2]|0;aG=c[A>>2]|0;aH=c[A+4>>2]|0;aI=ap;aJ=R;aK=U;aL=ao;aM=1;aN=at;aO=au;aP=aw;aQ=G;aR=ak;aS=ax;aT=1;aU=0;break}}}while(0);ao=(c[k>>2]=aC,+g[k>>2]);U=(c[k>>2]=aD,+g[k>>2]);R=(c[k>>2]=aF,+g[k>>2]);ap=(c[k>>2]=aG,+g[k>>2]);ay=(c[k>>2]=aH,+g[k>>2]);av=-0.0-ao;as=ap*U+ay*av;W=-0.0-U;s=(c[k>>2]=aE,+g[k>>2])*W+R*ao;R=U*aJ+aL*av-as;Z=U*aI+aK*av-as;if(R>0.0){aW=0}else{aE=m;aF=m;c[aF>>2]=aO;c[aF+4>>2]=aN;a[m+8|0]=0;a[aE+9|0]=aP;a[aE+10|0]=aT;a[aE+11|0]=aU;aW=1}if(Z>0.0){aX=aW}else{aE=m+(aW*12&-1)|0;aN=aE;aF=aE;c[aF>>2]=aR;c[aF+4>>2]=aQ;a[m+(aW*12&-1)+8|0]=0;a[aN+9|0]=aS;a[aN+10|0]=aT;a[aN+11|0]=aU;aX=aW+1|0}if(R*Z<0.0){as=R/(R-Z);aW=m+(aX*12&-1)|0;aU=(g[k>>2]=aJ+as*(aI-aJ),c[k>>2]|0);aN=(g[k>>2]=aL+as*(aK-aL),c[k>>2]|0)|0;c[aW>>2]=0|aU;c[aW+4>>2]=aN;aN=m+(aX*12&-1)+8|0;aW=aN;a[aN]=aA&255;a[aW+1|0]=aP;a[aW+2|0]=0;a[aW+3|0]=1;aY=aX+1|0}else{aY=aX}if((aY|0)<2){i=l;return}aL=+g[m>>2];aK=+g[m+4>>2];as=aL*W+ao*aK-s;aY=m+12|0;aJ=+g[aY>>2];aI=+g[m+16>>2];Z=aJ*W+ao*aI-s;if(as>0.0){aZ=0}else{c0(n|0,m|0,12);aZ=1}if(Z>0.0){a_=aZ}else{c0(n+(aZ*12&-1)|0,aY|0,12);a_=aZ+1|0}if(as*Z<0.0){s=as/(as-Z);aZ=n+(a_*12&-1)|0;aY=(g[k>>2]=aL+s*(aJ-aL),c[k>>2]|0);aX=(g[k>>2]=aK+s*(aI-aK),c[k>>2]|0)|0;c[aZ>>2]=0|aY;c[aZ+4>>2]=aX;aX=n+(a_*12&-1)+8|0;aZ=aX;a[aX]=aB;a[aZ+1|0]=a[(m+8|0)+1|0]|0;a[aZ+2|0]=0;a[aZ+3|0]=1;a$=a_+1|0}else{a$=a_}if((a$|0)<2){i=l;return}a$=d+40|0;do{if(aM){a_=a$;c[a_>>2]=0|aC;c[a_+4>>2]=aD|0;a_=d+48|0;c[a_>>2]=0|aG;c[a_+4>>2]=aH|0;aK=+g[n>>2];aI=+g[n+4>>2];s=+g[an>>2];if(ao*(aK-ap)+U*(aI-ay)>s){a0=0;a1=s}else{s=aK- +g[v>>2];aK=aI- +g[o>>2];aI=+g[w>>2];aL=+g[j>>2];a_=d;aZ=(g[k>>2]=s*aI+aK*aL,c[k>>2]|0);m=(g[k>>2]=aI*aK+s*(-0.0-aL),c[k>>2]|0)|0;c[a_>>2]=0|aZ;c[a_+4>>2]=m;c[d+16>>2]=c[n+8>>2]|0;a0=1;a1=+g[an>>2]}aL=+g[n+12>>2];s=+g[n+16>>2];if(ao*(aL-ap)+U*(s-ay)>a1){a2=a0;break}aK=aL- +g[v>>2];aL=s- +g[o>>2];s=+g[w>>2];aI=+g[j>>2];m=d+(a0*20&-1)|0;a_=(g[k>>2]=aK*s+aL*aI,c[k>>2]|0);aZ=(g[k>>2]=s*aL+aK*(-0.0-aI),c[k>>2]|0)|0;c[m>>2]=0|a_;c[m+4>>2]=aZ;c[d+(a0*20&-1)+16>>2]=c[n+20>>2]|0;a2=a0+1|0}else{aZ=h+84+(aA<<3)|0;m=a$;a_=c[aZ+4>>2]|0;c[m>>2]=c[aZ>>2]|0;c[m+4>>2]=a_;a_=h+20+(aA<<3)|0;m=d+48|0;aZ=c[a_+4>>2]|0;c[m>>2]=c[a_>>2]|0;c[m+4>>2]=aZ;aI=+g[an>>2];if(ao*(+g[n>>2]-ap)+U*(+g[n+4>>2]-ay)>aI){a3=0;a4=aI}else{aZ=n;m=d;a_=c[aZ+4>>2]|0;c[m>>2]=c[aZ>>2]|0;c[m+4>>2]=a_;a_=n+8|0;m=a_;aZ=d+16|0;aB=aZ;a[aB+2|0]=a[m+3|0]|0;a[aB+3|0]=a[m+2|0]|0;a[aZ]=a[m+1|0]|0;a[aB+1|0]=a[a_]|0;a3=1;a4=+g[an>>2]}a_=n+12|0;if(ao*(+g[a_>>2]-ap)+U*(+g[n+16>>2]-ay)>a4){a2=a3;break}aB=a_;a_=d+(a3*20&-1)|0;m=c[aB+4>>2]|0;c[a_>>2]=c[aB>>2]|0;c[a_+4>>2]=m;m=n+20|0;a_=m;aB=d+(a3*20&-1)+16|0;aZ=aB;a[aZ+2|0]=a[a_+3|0]|0;a[aZ+3|0]=a[a_+2|0]|0;a[aB]=a[a_+1|0]|0;a[aZ+1|0]=a[m]|0;a2=a3+1|0}}while(0);c[_>>2]=a2;i=l;return}function cr(a){a=a|0;return}function cs(a){a=a|0;return}function ct(a){a=a|0;return}function cu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;f=c[(c[a+48>>2]|0)+12>>2]|0;h=c[(c[a+52>>2]|0)+12>>2]|0;a=b+60|0;c[a>>2]=0;i=f+12|0;j=+g[d+12>>2];k=+g[i>>2];l=+g[d+8>>2];m=+g[f+16>>2];n=h+12|0;o=+g[e+12>>2];p=+g[n>>2];q=+g[e+8>>2];r=+g[h+16>>2];s=+g[e>>2]+(o*p-q*r)-(+g[d>>2]+(j*k-l*m));t=p*q+o*r+ +g[e+4>>2]-(k*l+j*m+ +g[d+4>>2]);m=+g[f+8>>2]+ +g[h+8>>2];if(s*s+t*t>m*m){return}c[b+56>>2]=0;h=i;i=b+48|0;f=c[h+4>>2]|0;c[i>>2]=c[h>>2]|0;c[i+4>>2]=f;g[b+40>>2]=0.0;g[b+44>>2]=0.0;c[a>>2]=1;a=n;n=b;f=c[a+4>>2]|0;c[n>>2]=c[a>>2]|0;c[n+4>>2]=f;c[b+16>>2]=0;return}function cv(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0.0,B=0;h=c[b+148>>2]|0;i=+g[f+12>>2];j=+g[e+12>>2];k=+g[f+8>>2];l=+g[e+16>>2];m=+g[d+12>>2];n=+g[b+12>>2];o=+g[d+8>>2];p=+g[b+16>>2];q=+g[f>>2]+(i*j-k*l)-(+g[d>>2]+(m*n-o*p));r=j*k+i*l+ +g[f+4>>2]-(n*o+m*p+ +g[d+4>>2]);p=m*q+o*r;n=m*r+q*(-0.0-o);L2205:do{if((h|0)>0){s=0;o=-3.4028234663852886e+38;t=0;while(1){q=p*+g[b+84+(s<<3)>>2]+n*+g[b+84+(s<<3)+4>>2];u=q>o;v=u?s:t;w=s+1|0;if((w|0)==(h|0)){x=v;break L2205}else{s=w;o=u?q:o;t=v}}}else{x=0}}while(0);n=+cB(b,d,x,e,f);t=((x|0)>0?x:h)-1|0;p=+cB(b,d,t,e,f);s=x+1|0;v=(s|0)<(h|0)?s:0;o=+cB(b,d,v,e,f);if(p>n&p>o){q=p;s=t;while(1){t=((s|0)>0?s:h)-1|0;p=+cB(b,d,t,e,f);if(p>q){q=p;s=t}else{y=q;z=s;break}}c[a>>2]=z;return+y}if(o>n){A=o;B=v}else{y=n;z=x;c[a>>2]=z;return+y}while(1){x=B+1|0;v=(x|0)<(h|0)?x:0;n=+cB(b,d,v,e,f);if(n>A){A=n;B=v}else{y=A;z=B;break}}c[a>>2]=z;return+y}function cw(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0;f=i;i=i+48|0;h=f|0;j=c[(c[a+48>>2]|0)+12>>2]|0;c[h>>2]=5250456;c[h+4>>2]=1;g[h+8>>2]=.009999999776482582;c1(h+28|0,0,18);cR(j,h,c[a+56>>2]|0);cp(b,h,d,c[(c[a+52>>2]|0)+12>>2]|0,e);i=f;return}function cx(a){a=a|0;if((a|0)==0){return}c_(a);return}function cy(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0;f=i;i=i+300|0;h=f|0;j=f+252|0;k=c[(c[a+48>>2]|0)+12>>2]|0;c[j>>2]=5250456;c[j+4>>2]=1;g[j+8>>2]=.009999999776482582;c1(j+28|0,0,18);cR(k,j,c[a+56>>2]|0);cq(h,b,j,d,c[(c[a+52>>2]|0)+12>>2]|0,e);i=f;return}function cz(a){a=a|0;if((a|0)==0){return}c_(a);return}function cA(a){a=a|0;if((a|0)==0){return}c_(a);return}function cB(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0,t=0.0,u=0,v=0,w=0,x=0;h=c[e+148>>2]|0;if((d|0)<=-1){aM(5244040,32,5249764,5245524);return 0.0}if((c[a+148>>2]|0)<=(d|0)){aM(5244040,32,5249764,5245524);return 0.0}i=+g[b+12>>2];j=+g[a+84+(d<<3)>>2];k=+g[b+8>>2];l=+g[a+84+(d<<3)+4>>2];m=i*j-k*l;n=j*k+i*l;l=+g[f+12>>2];j=+g[f+8>>2];o=l*m+j*n;p=l*n+m*(-0.0-j);L2243:do{if((h|0)>0){q=0;r=3.4028234663852886e+38;s=0;while(1){t=o*+g[e+20+(q<<3)>>2]+p*+g[e+20+(q<<3)+4>>2];u=t<r;v=u?q:s;w=q+1|0;if((w|0)==(h|0)){x=v;break L2243}else{q=w;r=u?t:r;s=v}}}else{x=0}}while(0);p=+g[a+20+(d<<3)>>2];o=+g[a+20+(d<<3)+4>>2];r=+g[e+20+(x<<3)>>2];t=+g[e+20+(x<<3)+4>>2];return+(m*(+g[f>>2]+(l*r-j*t)-(+g[b>>2]+(i*p-k*o)))+n*(r*j+l*t+ +g[f+4>>2]-(p*k+i*o+ +g[b+4>>2])))}function cC(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0.0,l=0.0;h=bB(f,144)|0;if((h|0)==0){i=0;j=i|0;return j|0}f=h;c[f>>2]=5250160;c[h+4>>2]=4;c[h+48>>2]=a;c[h+52>>2]=d;c[h+56>>2]=b;c[h+60>>2]=e;c[h+124>>2]=0;c[h+128>>2]=0;c1(h+8|0,0,40);g[h+136>>2]=+P(+(+g[a+16>>2]*+g[d+16>>2]));k=+g[a+20>>2];l=+g[d+20>>2];g[h+140>>2]=k>l?k:l;c[f>>2]=5250256;if((c[(c[a+12>>2]|0)+4>>2]|0)!=3){aM(5243872,43,5248496,5245448);return 0}if((c[(c[d+12>>2]|0)+4>>2]|0)==0){i=h;j=i|0;return j|0}else{aM(5243872,44,5248496,5244776);return 0}return 0}function cD(b,d){b=b|0;d=d|0;var e=0,f=0;aX[c[(c[b>>2]|0)+4>>2]&255](b);e=a[5251424]|0;if((e&255)<14){f=d+12+((e&255)<<2)|0;c[b>>2]=c[f>>2]|0;c[f>>2]=b;return}else{aM(5245880,173,5249084,5244332)}}function cE(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0.0,l=0.0;h=bB(f,144)|0;if((h|0)==0){i=0;j=i|0;return j|0}f=h;c[f>>2]=5250160;c[h+4>>2]=4;c[h+48>>2]=a;c[h+52>>2]=d;c[h+56>>2]=b;c[h+60>>2]=e;c[h+124>>2]=0;c[h+128>>2]=0;c1(h+8|0,0,40);g[h+136>>2]=+P(+(+g[a+16>>2]*+g[d+16>>2]));k=+g[a+20>>2];l=+g[d+20>>2];g[h+140>>2]=k>l?k:l;c[f>>2]=5250208;if((c[(c[a+12>>2]|0)+4>>2]|0)!=3){aM(5243720,43,5248328,5245448);return 0}if((c[(c[d+12>>2]|0)+4>>2]|0)==2){i=h;j=i|0;return j|0}else{aM(5243720,44,5248328,5244820);return 0}return 0}function cF(b,d){b=b|0;d=d|0;var e=0,f=0;aX[c[(c[b>>2]|0)+4>>2]&255](b);e=a[5251424]|0;if((e&255)<14){f=d+12+((e&255)<<2)|0;c[b>>2]=c[f>>2]|0;c[f>>2]=b;return}else{aM(5245880,173,5249084,5244332)}}function cG(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0,k=0.0;e=bB(f,144)|0;if((e|0)==0){h=0;i=h|0;return i|0}f=e;c[f>>2]=5250160;c[e+4>>2]=4;c[e+48>>2]=a;c[e+52>>2]=d;c[e+56>>2]=0;c[e+60>>2]=0;c[e+124>>2]=0;c[e+128>>2]=0;c1(e+8|0,0,40);g[e+136>>2]=+P(+(+g[a+16>>2]*+g[d+16>>2]));j=+g[a+20>>2];k=+g[d+20>>2];g[e+140>>2]=j>k?j:k;c[f>>2]=5250388;if((c[(c[a+12>>2]|0)+4>>2]|0)!=0){aM(5243644,44,5249344,5245404);return 0}if((c[(c[d+12>>2]|0)+4>>2]|0)==0){h=e;i=h|0;return i|0}else{aM(5243644,45,5249344,5244776);return 0}return 0}function cH(b,d){b=b|0;d=d|0;var e=0,f=0;aX[c[(c[b>>2]|0)+4>>2]&255](b);e=a[5251424]|0;if((e&255)<14){f=d+12+((e&255)<<2)|0;c[b>>2]=c[f>>2]|0;c[f>>2]=b;return}else{aM(5245880,173,5249084,5244332)}}function cI(b,d){b=b|0;d=d|0;var e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0;c0(b|0,d|0,24);e=c[d+40>>2]|0;f=b+32|0;c[f>>2]=e;h=c[d+28>>2]|0;i=b+48|0;c[i>>2]=h;j=h*88&-1;h=e+102796|0;k=c[h>>2]|0;if((k|0)>=32){aM(5245076,38,5248864,5244248)}l=e+102412+(k*12&-1)|0;c[e+102412+(k*12&-1)+4>>2]=j;m=e+102400|0;n=c[m>>2]|0;if((n+j|0)>102400){c[l>>2]=cZ(j)|0;a[e+102412+(k*12&-1)+8|0]=1}else{c[l>>2]=e+n|0;a[e+102412+(k*12&-1)+8|0]=0;c[m>>2]=(c[m>>2]|0)+j|0}m=e+102404|0;k=(c[m>>2]|0)+j|0;c[m>>2]=k;m=e+102408|0;e=c[m>>2]|0;c[m>>2]=(e|0)>(k|0)?e:k;c[h>>2]=(c[h>>2]|0)+1|0;h=b+36|0;c[h>>2]=c[l>>2]|0;l=c[f>>2]|0;f=(c[i>>2]|0)*152&-1;k=l+102796|0;e=c[k>>2]|0;if((e|0)>=32){aM(5245076,38,5248864,5244248)}m=l+102412+(e*12&-1)|0;c[l+102412+(e*12&-1)+4>>2]=f;j=l+102400|0;n=c[j>>2]|0;if((n+f|0)>102400){c[m>>2]=cZ(f)|0;a[l+102412+(e*12&-1)+8|0]=1}else{c[m>>2]=l+n|0;a[l+102412+(e*12&-1)+8|0]=0;c[j>>2]=(c[j>>2]|0)+f|0}j=l+102404|0;e=(c[j>>2]|0)+f|0;c[j>>2]=e;j=l+102408|0;l=c[j>>2]|0;c[j>>2]=(l|0)>(e|0)?l:e;c[k>>2]=(c[k>>2]|0)+1|0;k=b+40|0;c[k>>2]=c[m>>2]|0;c[b+24>>2]=c[d+32>>2]|0;c[b+28>>2]=c[d+36>>2]|0;m=c[d+24>>2]|0;d=b+44|0;c[d>>2]=m;if((c[i>>2]|0)<=0){return}e=b+20|0;l=b+8|0;b=0;j=m;while(1){m=c[j+(b<<2)>>2]|0;f=c[m+48>>2]|0;n=c[m+52>>2]|0;o=c[f+8>>2]|0;p=c[n+8>>2]|0;q=c[m+124>>2]|0;if((q|0)<=0){r=1817;break}s=+g[(c[n+12>>2]|0)+8>>2];t=+g[(c[f+12>>2]|0)+8>>2];f=c[k>>2]|0;g[f+(b*152&-1)+136>>2]=+g[m+136>>2];g[f+(b*152&-1)+140>>2]=+g[m+140>>2];n=o+8|0;c[f+(b*152&-1)+112>>2]=c[n>>2]|0;u=p+8|0;c[f+(b*152&-1)+116>>2]=c[u>>2]|0;v=o+120|0;g[f+(b*152&-1)+120>>2]=+g[v>>2];w=p+120|0;g[f+(b*152&-1)+124>>2]=+g[w>>2];x=o+128|0;g[f+(b*152&-1)+128>>2]=+g[x>>2];y=p+128|0;g[f+(b*152&-1)+132>>2]=+g[y>>2];c[f+(b*152&-1)+148>>2]=b;c[f+(b*152&-1)+144>>2]=q;c1(f+(b*152&-1)+80|0,0,32);z=c[h>>2]|0;c[z+(b*88&-1)+32>>2]=c[n>>2]|0;c[z+(b*88&-1)+36>>2]=c[u>>2]|0;g[z+(b*88&-1)+40>>2]=+g[v>>2];g[z+(b*88&-1)+44>>2]=+g[w>>2];w=o+28|0;o=z+(b*88&-1)+48|0;v=c[w+4>>2]|0;c[o>>2]=c[w>>2]|0;c[o+4>>2]=v;v=p+28|0;p=z+(b*88&-1)+56|0;o=c[v+4>>2]|0;c[p>>2]=c[v>>2]|0;c[p+4>>2]=o;g[z+(b*88&-1)+64>>2]=+g[x>>2];g[z+(b*88&-1)+68>>2]=+g[y>>2];y=m+104|0;x=z+(b*88&-1)+16|0;o=c[y+4>>2]|0;c[x>>2]=c[y>>2]|0;c[x+4>>2]=o;o=m+112|0;x=z+(b*88&-1)+24|0;y=c[o+4>>2]|0;c[x>>2]=c[o>>2]|0;c[x+4>>2]=y;c[z+(b*88&-1)+84>>2]=q;g[z+(b*88&-1)+76>>2]=t;g[z+(b*88&-1)+80>>2]=s;c[z+(b*88&-1)+72>>2]=c[m+120>>2]|0;y=0;while(1){if((a[e]&1)<<24>>24==0){g[f+(b*152&-1)+(y*36&-1)+16>>2]=0.0;g[f+(b*152&-1)+(y*36&-1)+20>>2]=0.0}else{g[f+(b*152&-1)+(y*36&-1)+16>>2]=+g[l>>2]*+g[m+64+(y*20&-1)+8>>2];g[f+(b*152&-1)+(y*36&-1)+20>>2]=+g[l>>2]*+g[m+64+(y*20&-1)+12>>2]}g[f+(b*152&-1)+(y*36&-1)+24>>2]=0.0;g[f+(b*152&-1)+(y*36&-1)+28>>2]=0.0;g[f+(b*152&-1)+(y*36&-1)+32>>2]=0.0;x=m+64+(y*20&-1)|0;o=z+(b*88&-1)+(y<<3)|0;c1(f+(b*152&-1)+(y*36&-1)|0,0,16);p=c[x+4>>2]|0;c[o>>2]=c[x>>2]|0;c[o+4>>2]=p;p=y+1|0;if((p|0)==(q|0)){break}else{y=p}}y=b+1|0;if((y|0)>=(c[i>>2]|0)){r=1827;break}b=y;j=c[d>>2]|0}if((r|0)==1817){aM(5243600,71,5249180,5245388)}else if((r|0)==1827){return}}function cJ(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0,C=0.0,D=0.0,E=0.0,F=0.0,G=0,H=0.0,I=0.0,J=0.0,K=0,L=0.0,M=0.0,N=0.0,O=0.0,Q=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,aq=0,ar=0,as=0.0,at=0.0,au=0.0;b=i;i=i+24|0;d=b|0;e=a+48|0;if((c[e>>2]|0)<=0){i=b;return}f=a+40|0;h=a+36|0;j=a+44|0;l=a+24|0;m=a+28|0;a=d;n=d|0;o=d+4|0;p=d+8|0;q=0;while(1){r=c[f>>2]|0;s=c[h>>2]|0;t=c[(c[j>>2]|0)+(c[r+(q*152&-1)+148>>2]<<2)>>2]|0;u=c[r+(q*152&-1)+112>>2]|0;v=c[r+(q*152&-1)+116>>2]|0;w=+g[r+(q*152&-1)+120>>2];x=+g[r+(q*152&-1)+124>>2];y=+g[r+(q*152&-1)+128>>2];z=+g[r+(q*152&-1)+132>>2];A=s+(q*88&-1)+48|0;B=c[A+4>>2]|0;C=(c[k>>2]=c[A>>2]|0,+g[k>>2]);D=(c[k>>2]=B,+g[k>>2]);B=s+(q*88&-1)+56|0;A=c[B+4>>2]|0;E=(c[k>>2]=c[B>>2]|0,+g[k>>2]);F=(c[k>>2]=A,+g[k>>2]);A=c[l>>2]|0;B=A+(u*12&-1)|0;G=c[B+4>>2]|0;H=(c[k>>2]=c[B>>2]|0,+g[k>>2]);I=(c[k>>2]=G,+g[k>>2]);J=+g[A+(u*12&-1)+8>>2];G=c[m>>2]|0;B=G+(u*12&-1)|0;K=c[B+4>>2]|0;L=(c[k>>2]=c[B>>2]|0,+g[k>>2]);M=(c[k>>2]=K,+g[k>>2]);N=+g[G+(u*12&-1)+8>>2];u=A+(v*12&-1)|0;K=c[u+4>>2]|0;O=(c[k>>2]=c[u>>2]|0,+g[k>>2]);Q=(c[k>>2]=K,+g[k>>2]);T=+g[A+(v*12&-1)+8>>2];A=G+(v*12&-1)|0;K=c[A+4>>2]|0;U=(c[k>>2]=c[A>>2]|0,+g[k>>2]);V=(c[k>>2]=K,+g[k>>2]);W=+g[G+(v*12&-1)+8>>2];v=c[t+124>>2]|0;if((v|0)<=0){X=1831;break}Y=+g[s+(q*88&-1)+80>>2];Z=+g[s+(q*88&-1)+76>>2];_=+S(+J);$=+R(+J);J=+S(+T);aa=+R(+T);T=H-(C*$-D*_);ab=I-(D*$+C*_);C=O-(E*aa-F*J);D=Q-(F*aa+E*J);s=c[t+120>>2]|0;L2328:do{if((s|0)==0){g[n>>2]=1.0;g[o>>2]=0.0;E=+g[t+112>>2];F=+g[t+116>>2];ac=T+($*E-_*F);ad=E*_+$*F+ab;F=+g[t+64>>2];E=+g[t+68>>2];ae=C+(aa*F-J*E);af=F*J+aa*E+D;E=ac-ae;F=ad-af;do{if(E*E+F*F>1.4210854715202004e-14){ag=ae-ac;ah=af-ad;G=(g[k>>2]=ag,c[k>>2]|0);K=(g[k>>2]=ah,c[k>>2]|0)|0;c[a>>2]=0|G;c[a+4>>2]=K;ai=+P(+(ag*ag+ah*ah));if(ai<1.1920928955078125e-7){aj=ag;ak=ah;break}al=1.0/ai;ai=ag*al;g[n>>2]=ai;ag=ah*al;g[o>>2]=ag;aj=ai;ak=ag}else{aj=1.0;ak=0.0}}while(0);K=(g[k>>2]=(ac+aj*Z+(ae-aj*Y))*.5,c[k>>2]|0);G=(g[k>>2]=(ad+ak*Z+(af-ak*Y))*.5,c[k>>2]|0)|0;c[p>>2]=0|K;c[p+4>>2]=G}else if((s|0)==2){F=+g[t+104>>2];E=+g[t+108>>2];ag=aa*F-J*E;ai=F*J+aa*E;G=(g[k>>2]=ag,c[k>>2]|0);K=(g[k>>2]=ai,c[k>>2]|0)|0;c[a>>2]=0|G;c[a+4>>2]=K;E=+g[t+112>>2];F=+g[t+116>>2];al=C+(aa*E-J*F);ah=E*J+aa*F+D;K=0;F=ag;ag=ai;while(1){ai=+g[t+64+(K*20&-1)>>2];E=+g[t+64+(K*20&-1)+4>>2];am=T+($*ai-_*E);an=ai*_+$*E+ab;E=Y-(F*(am-al)+(an-ah)*ag);G=d+8+(K<<3)|0;A=(g[k>>2]=(am-F*Z+(am+F*E))*.5,c[k>>2]|0);u=(g[k>>2]=(an-ag*Z+(an+ag*E))*.5,c[k>>2]|0)|0;c[G>>2]=0|A;c[G+4>>2]=u;u=K+1|0;ao=+g[n>>2];ap=+g[o>>2];if((u|0)<(v|0)){K=u;F=ao;ag=ap}else{break}}K=(g[k>>2]=-0.0-ao,c[k>>2]|0);u=(g[k>>2]=-0.0-ap,c[k>>2]|0)|0;c[a>>2]=0|K;c[a+4>>2]=u}else if((s|0)==1){ag=+g[t+104>>2];F=+g[t+108>>2];ah=$*ag-_*F;al=ag*_+$*F;u=(g[k>>2]=ah,c[k>>2]|0);K=(g[k>>2]=al,c[k>>2]|0)|0;c[a>>2]=0|u;c[a+4>>2]=K;F=+g[t+112>>2];ag=+g[t+116>>2];af=T+($*F-_*ag);ad=F*_+$*ag+ab;K=0;ag=ah;ah=al;while(1){al=+g[t+64+(K*20&-1)>>2];F=+g[t+64+(K*20&-1)+4>>2];ae=C+(aa*al-J*F);ac=al*J+aa*F+D;F=Z-(ag*(ae-af)+(ac-ad)*ah);u=d+8+(K<<3)|0;G=(g[k>>2]=(ae-ag*Y+(ae+ag*F))*.5,c[k>>2]|0);A=(g[k>>2]=(ac-ah*Y+(ac+ah*F))*.5,c[k>>2]|0)|0;c[u>>2]=0|G;c[u+4>>2]=A;A=K+1|0;if((A|0)>=(v|0)){break L2328}K=A;ag=+g[n>>2];ah=+g[o>>2]}}}while(0);v=r+(q*152&-1)+72|0;t=v;s=c[a+4>>2]|0;c[t>>2]=c[a>>2]|0;c[t+4>>2]=s;s=r+(q*152&-1)+144|0;t=c[s>>2]|0;do{if((t|0)>0){K=r+(q*152&-1)+76|0;A=v|0;Y=w+x;Z=-0.0-W;D=-0.0-N;u=r+(q*152&-1)+140|0;G=0;while(1){aa=+g[d+8+(G<<3)>>2];J=aa-H;C=+g[d+8+(G<<3)+4>>2];B=r+(q*152&-1)+(G*36&-1)|0;aq=(g[k>>2]=J,c[k>>2]|0);ar=(g[k>>2]=C-I,c[k>>2]|0)|0;c[B>>2]=0|aq;c[B+4>>2]=ar;ab=aa-O;ar=r+(q*152&-1)+(G*36&-1)+8|0;B=(g[k>>2]=ab,c[k>>2]|0);aq=(g[k>>2]=C-Q,c[k>>2]|0)|0;c[ar>>2]=0|B;c[ar+4>>2]=aq;C=+g[K>>2];aa=+g[r+(q*152&-1)+(G*36&-1)+4>>2];$=+g[A>>2];_=J*C-aa*$;T=+g[r+(q*152&-1)+(G*36&-1)+12>>2];ah=C*ab-$*T;$=Y+_*y*_+ah*z*ah;if($>0.0){as=1.0/$}else{as=0.0}g[r+(q*152&-1)+(G*36&-1)+24>>2]=as;$=+g[K>>2];ah=+g[A>>2]*-1.0;_=J*ah-$*aa;C=ah*ab-$*T;$=Y+_*y*_+C*z*C;if($>0.0){at=1.0/$}else{at=0.0}g[r+(q*152&-1)+(G*36&-1)+28>>2]=at;aq=r+(q*152&-1)+(G*36&-1)+32|0;g[aq>>2]=0.0;$=+g[A>>2]*(U+T*Z-L-aa*D)+ +g[K>>2]*(V+W*ab-M-N*J);if($<-1.0){g[aq>>2]=$*(-0.0- +g[u>>2])}aq=G+1|0;if((aq|0)==(t|0)){break}else{G=aq}}if((c[s>>2]|0)!=2){break}D=+g[K>>2];Z=+g[A>>2];$=+g[r+(q*152&-1)>>2]*D- +g[r+(q*152&-1)+4>>2]*Z;J=D*+g[r+(q*152&-1)+8>>2]-Z*+g[r+(q*152&-1)+12>>2];ab=D*+g[r+(q*152&-1)+36>>2]-Z*+g[r+(q*152&-1)+40>>2];aa=D*+g[r+(q*152&-1)+44>>2]-Z*+g[r+(q*152&-1)+48>>2];Z=y*$;D=z*J;T=Y+$*Z+J*D;J=Y+ab*y*ab+aa*z*aa;$=Y+Z*ab+D*aa;aa=T*J-$*$;if(T*T>=aa*1.0e3){c[s>>2]=1;break}g[r+(q*152&-1)+96>>2]=T;g[r+(q*152&-1)+100>>2]=$;g[r+(q*152&-1)+104>>2]=$;g[r+(q*152&-1)+108>>2]=J;if(aa!=0.0){au=1.0/aa}else{au=aa}aa=$*(-0.0-au);g[r+(q*152&-1)+80>>2]=J*au;g[r+(q*152&-1)+84>>2]=aa;g[r+(q*152&-1)+88>>2]=aa;g[r+(q*152&-1)+92>>2]=T*au}}while(0);r=q+1|0;if((r|0)<(c[e>>2]|0)){q=r}else{X=1861;break}}if((X|0)==1831){aM(5243600,168,5249236,5244748)}else if((X|0)==1861){i=b;return}}function cK(a){a=a|0;return}function cL(a){a=a|0;return}function cM(a){a=a|0;return}function cN(a){a=a|0;if((a|0)==0){return}c_(a);return}function cO(a){a=a|0;if((a|0)==0){return}c_(a);return}function cP(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,i=0,j=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0;b=a+48|0;if((c[b>>2]|0)<=0){return}d=a+40|0;e=a+28|0;a=0;L2385:while(1){f=c[d>>2]|0;h=f+(a*152&-1)|0;i=c[f+(a*152&-1)+112>>2]|0;j=c[f+(a*152&-1)+116>>2]|0;l=+g[f+(a*152&-1)+120>>2];m=+g[f+(a*152&-1)+128>>2];n=+g[f+(a*152&-1)+124>>2];o=+g[f+(a*152&-1)+132>>2];p=f+(a*152&-1)+144|0;q=c[p>>2]|0;r=c[e>>2]|0;s=r+(i*12&-1)|0;t=c[s>>2]|0;u=c[s+4>>2]|0;s=r+(j*12&-1)|0;v=c[s>>2]|0;w=c[s+4>>2]|0;s=f+(a*152&-1)+72|0;x=c[s+4>>2]|0;y=(c[k>>2]=c[s>>2]|0,+g[k>>2]);z=(c[k>>2]=x,+g[k>>2]);A=y*-1.0;B=+g[f+(a*152&-1)+136>>2];if((q-1|0)>>>0>=2){C=1879;break}D=+g[r+(j*12&-1)+8>>2];E=(c[k>>2]=w,+g[k>>2]);F=(c[k>>2]=v,+g[k>>2]);G=+g[r+(i*12&-1)+8>>2];H=(c[k>>2]=u,+g[k>>2]);I=H;H=(c[k>>2]=t,+g[k>>2]);J=E;E=F;t=0;F=D;D=G;while(1){G=+g[f+(a*152&-1)+(t*36&-1)+12>>2];K=+g[f+(a*152&-1)+(t*36&-1)+8>>2];L=+g[f+(a*152&-1)+(t*36&-1)+4>>2];M=+g[f+(a*152&-1)+(t*36&-1)>>2];N=B*+g[f+(a*152&-1)+(t*36&-1)+16>>2];u=f+(a*152&-1)+(t*36&-1)+20|0;O=+g[u>>2];P=O+ +g[f+(a*152&-1)+(t*36&-1)+28>>2]*(-0.0-(z*(E+G*(-0.0-F)-H-L*(-0.0-D))+A*(J+F*K-I-D*M)));Q=-0.0-N;R=P<N?P:N;N=R<Q?Q:R;R=N-O;g[u>>2]=N;N=z*R;O=A*R;S=H-l*N;T=I-l*O;U=D-m*(M*O-L*N);V=E+n*N;W=J+n*O;X=F+o*(K*O-G*N);u=t+1|0;if((u|0)==(q|0)){break}else{I=T;H=S;J=W;E=V;t=u;F=X;D=U}}L2391:do{if((c[p>>2]|0)==1){D=+g[f+(a*152&-1)+12>>2];F=+g[f+(a*152&-1)+8>>2];E=+g[f+(a*152&-1)+4>>2];J=+g[h>>2];t=f+(a*152&-1)+16|0;H=+g[t>>2];I=H+(y*(V+D*(-0.0-X)-S-E*(-0.0-U))+z*(W+X*F-T-U*J)- +g[f+(a*152&-1)+32>>2])*(-0.0- +g[f+(a*152&-1)+24>>2]);A=I>0.0?I:0.0;I=A-H;g[t>>2]=A;A=y*I;H=z*I;Y=U-m*(J*H-E*A);Z=X+o*(F*H-D*A);_=V+n*A;$=W+n*H;aa=S-l*A;ab=T-l*H}else{t=f+(a*152&-1)+16|0;H=+g[t>>2];q=f+(a*152&-1)+52|0;A=+g[q>>2];if(H<0.0|A<0.0){C=1884;break L2385}D=-0.0-X;F=+g[f+(a*152&-1)+12>>2];E=+g[f+(a*152&-1)+8>>2];J=-0.0-U;I=+g[f+(a*152&-1)+4>>2];B=+g[h>>2];N=+g[f+(a*152&-1)+48>>2];G=+g[f+(a*152&-1)+44>>2];O=+g[f+(a*152&-1)+40>>2];K=+g[f+(a*152&-1)+36>>2];L=+g[f+(a*152&-1)+104>>2];M=+g[f+(a*152&-1)+100>>2];R=y*(V+F*D-S-I*J)+z*(W+X*E-T-U*B)- +g[f+(a*152&-1)+32>>2]-(H*+g[f+(a*152&-1)+96>>2]+A*L);Q=y*(V+N*D-S-O*J)+z*(W+X*G-T-U*K)- +g[f+(a*152&-1)+68>>2]-(H*M+A*+g[f+(a*152&-1)+108>>2]);J=+g[f+(a*152&-1)+80>>2]*R+ +g[f+(a*152&-1)+88>>2]*Q;D=R*+g[f+(a*152&-1)+84>>2]+Q*+g[f+(a*152&-1)+92>>2];P=-0.0-J;ac=-0.0-D;if(!(J>-0.0|D>-0.0)){D=P-H;J=ac-A;ad=y*D;ae=z*D;D=y*J;af=z*J;J=ad+D;ag=ae+af;g[t>>2]=P;g[q>>2]=ac;Y=U-m*(B*ae-I*ad+(K*af-O*D));Z=X+o*(E*ae-F*ad+(G*af-N*D));_=V+n*J;$=W+n*ag;aa=S-l*J;ab=T-l*ag;break}ag=R*(-0.0- +g[f+(a*152&-1)+24>>2]);do{if(ag>=0.0){if(Q+ag*M<0.0){break}J=ag-H;D=0.0-A;af=y*J;ad=z*J;J=y*D;ae=z*D;D=J+af;ac=ae+ad;g[t>>2]=ag;g[q>>2]=0.0;Y=U-m*(ad*B-af*I+(ae*K-J*O));Z=X+o*(ad*E-af*F+(ae*G-J*N));_=V+n*D;$=W+n*ac;aa=S-l*D;ab=T-l*ac;break L2391}}while(0);ag=Q*(-0.0- +g[f+(a*152&-1)+60>>2]);do{if(ag>=0.0){if(R+ag*L<0.0){break}M=0.0-H;ac=ag-A;D=y*M;J=z*M;M=y*ac;ae=z*ac;ac=D+M;af=J+ae;g[t>>2]=0.0;g[q>>2]=ag;Y=U-m*(J*B-D*I+(ae*K-M*O));Z=X+o*(J*E-D*F+(ae*G-M*N));_=V+n*ac;$=W+n*af;aa=S-l*ac;ab=T-l*af;break L2391}}while(0);if(R<0.0|Q<0.0){Y=U;Z=X;_=V;$=W;aa=S;ab=T;break}ag=0.0-H;L=0.0-A;af=y*ag;ac=z*ag;ag=y*L;M=z*L;L=af+ag;ae=ac+M;g[t>>2]=0.0;g[q>>2]=0.0;Y=U-m*(ac*B-af*I+(M*K-ag*O));Z=X+o*(ac*E-af*F+(M*G-ag*N));_=V+n*L;$=W+n*ae;aa=S-l*L;ab=T-l*ae}}while(0);f=(c[e>>2]|0)+(i*12&-1)|0;h=(g[k>>2]=aa,c[k>>2]|0);p=(g[k>>2]=ab,c[k>>2]|0)|0;c[f>>2]=0|h;c[f+4>>2]=p;g[(c[e>>2]|0)+(i*12&-1)+8>>2]=Y;p=(c[e>>2]|0)+(j*12&-1)|0;f=(g[k>>2]=_,c[k>>2]|0);h=(g[k>>2]=$,c[k>>2]|0)|0;c[p>>2]=0|f;c[p+4>>2]=h;g[(c[e>>2]|0)+(j*12&-1)+8>>2]=Z;h=a+1|0;if((h|0)<(c[b>>2]|0)){a=h}else{C=1898;break}}if((C|0)==1884){aM(5243600,406,5249292,5243572)}else if((C|0)==1879){aM(5243600,311,5249292,5244164)}else if((C|0)==1898){return}}function cQ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,i=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0,y=0,z=0.0;if((c[b+84>>2]|0)<=0){aM(5243600,617,5248204,5243256)}h=c[b+72>>2]|0;if((h|0)==0){i=+g[d+12>>2];j=+g[b+24>>2];l=+g[d+8>>2];m=+g[b+28>>2];n=+g[d>>2]+(i*j-l*m);o=j*l+i*m+ +g[d+4>>2];m=+g[e+12>>2];i=+g[b>>2];l=+g[e+8>>2];j=+g[b+4>>2];p=+g[e>>2]+(m*i-l*j);q=i*l+m*j+ +g[e+4>>2];j=p-n;m=q-o;r=a;s=(g[k>>2]=j,c[k>>2]|0);t=(g[k>>2]=m,c[k>>2]|0)|0;c[r>>2]=0|s;c[r+4>>2]=t;l=+P(+(j*j+m*m));if(l<1.1920928955078125e-7){u=j;v=m}else{i=1.0/l;l=j*i;g[a>>2]=l;w=m*i;g[a+4>>2]=w;u=l;v=w}t=a+8|0;r=(g[k>>2]=(n+p)*.5,c[k>>2]|0);s=(g[k>>2]=(o+q)*.5,c[k>>2]|0)|0;c[t>>2]=0|r;c[t+4>>2]=s;g[a+16>>2]=j*u+m*v- +g[b+76>>2]- +g[b+80>>2];return}else if((h|0)==2){s=e+12|0;v=+g[s>>2];m=+g[b+16>>2];t=e+8|0;u=+g[t>>2];j=+g[b+20>>2];q=v*m-u*j;o=m*u+v*j;r=a;x=(g[k>>2]=q,c[k>>2]|0);y=(g[k>>2]=o,c[k>>2]|0)|0;c[r>>2]=0|x;c[r+4>>2]=y;j=+g[s>>2];v=+g[b+24>>2];u=+g[t>>2];m=+g[b+28>>2];p=+g[d+12>>2];n=+g[b+(f<<3)>>2];w=+g[d+8>>2];l=+g[b+(f<<3)+4>>2];i=+g[d>>2]+(p*n-w*l);z=n*w+p*l+ +g[d+4>>2];g[a+16>>2]=q*(i-(+g[e>>2]+(j*v-u*m)))+(z-(v*u+j*m+ +g[e+4>>2]))*o- +g[b+76>>2]- +g[b+80>>2];t=a+8|0;s=(g[k>>2]=i,c[k>>2]|0);y=(g[k>>2]=z,c[k>>2]|0)|0;c[t>>2]=0|s;c[t+4>>2]=y;y=(g[k>>2]=-0.0-q,c[k>>2]|0);t=(g[k>>2]=-0.0-o,c[k>>2]|0)|0;c[r>>2]=0|y;c[r+4>>2]=t;return}else if((h|0)==1){h=d+12|0;o=+g[h>>2];q=+g[b+16>>2];t=d+8|0;z=+g[t>>2];i=+g[b+20>>2];m=o*q-z*i;j=q*z+o*i;r=a;y=(g[k>>2]=m,c[k>>2]|0);s=(g[k>>2]=j,c[k>>2]|0)|0;c[r>>2]=0|y;c[r+4>>2]=s;i=+g[h>>2];o=+g[b+24>>2];z=+g[t>>2];q=+g[b+28>>2];u=+g[e+12>>2];v=+g[b+(f<<3)>>2];l=+g[e+8>>2];p=+g[b+(f<<3)+4>>2];w=+g[e>>2]+(u*v-l*p);n=v*l+u*p+ +g[e+4>>2];g[a+16>>2]=m*(w-(+g[d>>2]+(i*o-z*q)))+(n-(o*z+i*q+ +g[d+4>>2]))*j- +g[b+76>>2]- +g[b+80>>2];b=a+8|0;a=(g[k>>2]=w,c[k>>2]|0);d=(g[k>>2]=n,c[k>>2]|0)|0;c[b>>2]=0|a;c[b+4>>2]=d;return}else{return}}function cR(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0;if((e|0)<=-1){aM(5243428,89,5247260,5243536)}f=b+16|0;if(((c[f>>2]|0)-1|0)<=(e|0)){aM(5243428,89,5247260,5243536)}c[d+4>>2]=1;g[d+8>>2]=+g[b+8>>2];h=b+12|0;i=(c[h>>2]|0)+(e<<3)|0;j=d+12|0;k=c[i+4>>2]|0;c[j>>2]=c[i>>2]|0;c[j+4>>2]=k;k=(c[h>>2]|0)+(e+1<<3)|0;j=d+20|0;i=c[k+4>>2]|0;c[j>>2]=c[k>>2]|0;c[j+4>>2]=i;i=d+28|0;if((e|0)>0){j=(c[h>>2]|0)+(e-1<<3)|0;k=i;l=c[j+4>>2]|0;c[k>>2]=c[j>>2]|0;c[k+4>>2]=l;a[d+44|0]=1}else{l=b+20|0;k=i;i=c[l+4>>2]|0;c[k>>2]=c[l>>2]|0;c[k+4>>2]=i;a[d+44|0]=a[b+36|0]&1}i=d+36|0;if(((c[f>>2]|0)-2|0)>(e|0)){f=(c[h>>2]|0)+(e+2<<3)|0;e=i;h=c[f+4>>2]|0;c[e>>2]=c[f>>2]|0;c[e+4>>2]=h;a[d+45|0]=1;return}else{h=b+28|0;e=i;i=c[h+4>>2]|0;c[e>>2]=c[h>>2]|0;c[e+4>>2]=i;a[d+45|0]=a[b+37|0]&1;return}}function cS(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function cT(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1|0;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function cU(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function cV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+112|0;f=e|0;g=e+56|0;if((a|0)==(b|0)){h=1;i=e;return h|0}if((b|0)==0){h=0;i=e;return h|0}j=b;k=c[b>>2]|0;b=j+(c[k-8>>2]|0)|0;l=c[k-4>>2]|0;k=l;c[f>>2]=5250920;c[f+4>>2]=j;c[f+8>>2]=5250932;c[f+12>>2]=-1;j=f+16|0;m=f+20|0;n=f+24|0;o=f+28|0;p=f+32|0;q=f+40|0;c1(j|0,0,39);do{if((l|0)==5250920){c[f+48>>2]=1;a2[c[(c[1312730]|0)+20>>2]&255](k,f,b,b,1,0);r=(c[n>>2]|0)==1?b:0}else{aW[c[(c[l>>2]|0)+24>>2]&255](k,f,b,1,0);s=c[f+36>>2]|0;if((s|0)==0){if((c[q>>2]|0)!=1){r=0;break}if((c[o>>2]|0)!=1){r=0;break}r=(c[p>>2]|0)==1?c[m>>2]|0:0;break}else if((s|0)!=1){r=0;break}if((c[n>>2]|0)!=1){if((c[q>>2]|0)!=0){r=0;break}if((c[o>>2]|0)!=1){r=0;break}if((c[p>>2]|0)!=1){r=0;break}}r=c[j>>2]|0}}while(0);j=r;if((r|0)==0){h=0;i=e;return h|0}c1(g|0,0,56);c[g>>2]=j;c[g+8>>2]=a;c[g+12>>2]=-1;c[g+48>>2]=1;a4[c[(c[r>>2]|0)+28>>2]&255](j,g,c[d>>2]|0,1);if((c[g+24>>2]|0)!=1){h=0;i=e;return h|0}c[d>>2]=c[g+16>>2]|0;h=1;i=e;return h|0}function cW(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;a4[c[(c[g>>2]|0)+28>>2]&255](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}
function cX(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;aW[c[(c[h>>2]|0)+24>>2]&255](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;a2[c[(c[l>>2]|0)+20>>2]&255](l,d,e,e,1,g);do{if((a[k]&1)<<24>>24==0){m=0;n=2027}else{if((a[j]&1)<<24>>24==0){m=1;n=2027;break}else{break}}}while(0);L2579:do{if((n|0)==2027){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1|0;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=2030;break}a[d+54|0]=1;if(m){break L2579}else{break}}else{n=2030}}while(0);if((n|0)==2030){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function cY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;a2[c[(c[i>>2]|0)+20>>2]&255](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function cZ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aI=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1311536]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=5246184+(h<<2)|0;j=5246184+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1311536]=e&(1<<g^-1)}else{if(l>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{aw();return 0;return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1311538]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=5246184+(p<<2)|0;m=5246184+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1311536]=e&(1<<r^-1)}else{if(l>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{aw();return 0;return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1311538]|0;if((l|0)!=0){q=c[1311541]|0;d=l>>>3;l=d<<1;f=5246184+(l<<2)|0;k=c[1311536]|0;h=1<<d;do{if((k&h|0)==0){c[1311536]=k|h;s=f;t=5246184+(l+2<<2)|0}else{d=5246184+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1311540]|0)>>>0){s=g;t=d;break}aw();return 0;return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1311538]=m;c[1311541]=e;n=i;return n|0}l=c[1311537]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[5246448+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1311540]|0;if(r>>>0<i>>>0){aw();return 0;return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){aw();return 0;return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L2677:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L2677}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){aw();return 0;return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){aw();return 0;return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){aw();return 0;return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{aw();return 0;return 0}}}while(0);L2699:do{if((e|0)!=0){f=d+28|0;i=5246448+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1311537]=c[1311537]&(1<<c[f>>2]^-1);break L2699}else{if(e>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L2699}}}while(0);if(v>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[1311538]|0;if((f|0)!=0){e=c[1311541]|0;i=f>>>3;f=i<<1;q=5246184+(f<<2)|0;k=c[1311536]|0;g=1<<i;do{if((k&g|0)==0){c[1311536]=k|g;y=q;z=5246184+(f+2<<2)|0}else{i=5246184+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1311540]|0)>>>0){y=l;z=i;break}aw();return 0;return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1311538]=p;c[1311541]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1311537]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[5246448+(A<<2)>>2]|0;L2747:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L2747}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L2747}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[5246448+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L2762:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L2762}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[1311538]|0)-g|0)>>>0){o=g;break}k=K;q=c[1311540]|0;if(k>>>0<q>>>0){aw();return 0;return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){aw();return 0;return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L2775:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L2775}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){aw();return 0;return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){aw();return 0;return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){aw();return 0;return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{aw();return 0;return 0}}}while(0);L2797:do{if((e|0)!=0){i=K+28|0;q=5246448+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[1311537]=c[1311537]&(1<<c[i>>2]^-1);break L2797}else{if(e>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L2797}}}while(0);if(L>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=5246184+(e<<2)|0;r=c[1311536]|0;j=1<<i;do{if((r&j|0)==0){c[1311536]=r|j;O=q;P=5246184+(e+2<<2)|0}else{i=5246184+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1311540]|0)>>>0){O=d;P=i;break}aw();return 0;return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=5246448+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[1311537]|0;l=1<<Q;if((q&l|0)==0){c[1311537]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=2214;break}else{l=l<<1;q=j}}if((T|0)==2214){if(S>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[1311540]|0;if(q>>>0<i>>>0){aw();return 0;return 0}if(j>>>0<i>>>0){aw();return 0;return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[1311538]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1311541]|0;if(S>>>0>15){R=J;c[1311541]=R+o|0;c[1311538]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1311538]=0;c[1311541]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1311539]|0;if(o>>>0<J>>>0){S=J-o|0;c[1311539]=S;J=c[1311542]|0;K=J;c[1311542]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1310720]|0)==0){J=aH(8)|0;if((J-1&J|0)==0){c[1310722]=J;c[1310721]=J;c[1310723]=-1;c[1310724]=2097152;c[1310725]=0;c[1311647]=0;c[1310720]=aT(0)&-16^1431655768;break}else{aw();return 0;return 0}}}while(0);J=o+48|0;S=c[1310722]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1311646]|0;do{if((O|0)!=0){P=c[1311644]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L2889:do{if((c[1311647]&4|0)==0){O=c[1311542]|0;L2891:do{if((O|0)==0){T=2244}else{L=O;P=5246592;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=2244;break L2891}else{P=M}}if((P|0)==0){T=2244;break}L=R-(c[1311539]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=aO(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=2253;break}}while(0);do{if((T|0)==2244){O=aO(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1310721]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[1311644]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[1311646]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=aO($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=2253;break}}while(0);L2911:do{if((T|0)==2253){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=2264;break L2889}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1310722]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aO(O|0)|0)==-1){aO(q|0);W=Y;break L2911}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=2264;break L2889}}}while(0);c[1311647]=c[1311647]|4;ad=W;T=2261;break}else{ad=0;T=2261}}while(0);do{if((T|0)==2261){if(S>>>0>=2147483647){break}W=aO(S|0)|0;Z=aO(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=2264;break}}}while(0);do{if((T|0)==2264){ad=(c[1311644]|0)+aa|0;c[1311644]=ad;if(ad>>>0>(c[1311645]|0)>>>0){c[1311645]=ad}ad=c[1311542]|0;L2931:do{if((ad|0)==0){S=c[1311540]|0;if((S|0)==0|ab>>>0<S>>>0){c[1311540]=ab}c[1311648]=ab;c[1311649]=aa;c[1311651]=0;c[1311545]=c[1310720]|0;c[1311544]=-1;S=0;while(1){Y=S<<1;ac=5246184+(Y<<2)|0;c[5246184+(Y+3<<2)>>2]=ac;c[5246184+(Y+2<<2)>>2]=ac;ac=S+1|0;if((ac|0)==32){break}else{S=ac}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[1311542]=ab+ae|0;c[1311539]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[1311543]=c[1310724]|0}else{S=5246592;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=2276;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==2276){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[1311542]|0;Y=(c[1311539]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1311542]=Z+ai|0;c[1311539]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[1311543]=c[1310724]|0;break L2931}}while(0);if(ab>>>0<(c[1311540]|0)>>>0){c[1311540]=ab}S=ab+aa|0;Y=5246592;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=2286;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==2286){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[1311542]|0)){J=(c[1311539]|0)+K|0;c[1311539]=J;c[1311542]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[1311541]|0)){J=(c[1311538]|0)+K|0;c[1311538]=J;c[1311541]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L2976:do{if(X>>>0<256){U=c[ab+((al|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+al|0)>>2]|0;R=5246184+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}if((c[U+12>>2]|0)==(Z|0)){break}aw();return 0;return 0}}while(0);if((Q|0)==(U|0)){c[1311536]=c[1311536]&(1<<V^-1);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){am=q;break}aw();return 0;return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;q=c[ab+((al|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+al|0)>>2]|0;L2978:do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){an=0;break L2978}else{ao=M;ap=e;break}}else{ao=L;ap=g}}while(0);while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa|0)>>2]|0;if(g>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){aw();return 0;return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;an=P;break}else{aw();return 0;return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+al|0)|0;U=5246448+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[1311537]=c[1311537]&(1<<c[P>>2]^-1);break L2976}else{if(q>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[q+20>>2]=an}if((an|0)==0){break L2976}}}while(0);if(an>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}c[an+24>>2]=q;R=al|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa|0)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=ar|1;c[ab+(ar+W|0)>>2]=ar;J=ar>>>3;if(ar>>>0<256){V=J<<1;X=5246184+(V<<2)|0;P=c[1311536]|0;q=1<<J;do{if((P&q|0)==0){c[1311536]=P|q;as=X;at=5246184+(V+2<<2)|0}else{J=5246184+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1311540]|0)>>>0){as=U;at=J;break}aw();return 0;return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8|0)>>2]=as;c[ab+(W+12|0)>>2]=X;break}V=ac;q=ar>>>8;do{if((q|0)==0){au=0}else{if(ar>>>0>16777215){au=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5246448+(au<<2)|0;c[ab+(W+28|0)>>2]=au;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[1311537]|0;Q=1<<au;if((X&Q|0)==0){c[1311537]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}ax=X+16+(Q>>>31<<2)|0;q=c[ax>>2]|0;if((q|0)==0){T=2359;break}else{Q=Q<<1;X=q}}if((T|0)==2359){if(ax>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[ax>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[1311540]|0;if(X>>>0<$>>>0){aw();return 0;return 0}if(q>>>0<$>>>0){aw();return 0;return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=5246592;while(1){ay=c[W>>2]|0;if(ay>>>0<=Y>>>0){az=c[W+4>>2]|0;aA=ay+az|0;if(aA>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ay+(az-39|0)|0;if((W&7|0)==0){aB=0}else{aB=-W&7}W=ay+((az-47|0)+aB|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aC=0}else{aC=-_&7}_=(aa-40|0)-aC|0;c[1311542]=ab+aC|0;c[1311539]=_;c[ab+(aC+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[1311543]=c[1310724]|0;c[ac+4>>2]=27;c0(W|0,5246592,16);c[1311648]=ab;c[1311649]=aa;c[1311651]=0;c[1311650]=W;W=ac+28|0;c[W>>2]=7;L3095:do{if((ac+32|0)>>>0<aA>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aA>>>0){_=K}else{break L3095}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=5246184+(K<<2)|0;S=c[1311536]|0;q=1<<_;do{if((S&q|0)==0){c[1311536]=S|q;aD=Z;aE=5246184+(K+2<<2)|0}else{_=5246184+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[1311540]|0)>>>0){aD=Q;aE=_;break}aw();return 0;return 0}}while(0);c[aE>>2]=ad;c[aD+12>>2]=ad;c[ad+8>>2]=aD;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aF=0}else{if(W>>>0>16777215){aF=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aF=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5246448+(aF<<2)|0;c[ad+28>>2]=aF;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1311537]|0;Q=1<<aF;if((Z&Q|0)==0){c[1311537]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aF|0)==31){aG=0}else{aG=25-(aF>>>1)|0}Q=W<<aG;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aI=Z+16+(Q>>>31<<2)|0;q=c[aI>>2]|0;if((q|0)==0){T=2394;break}else{Q=Q<<1;Z=q}}if((T|0)==2394){if(aI>>>0<(c[1311540]|0)>>>0){aw();return 0;return 0}else{c[aI>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[1311540]|0;if(Z>>>0<q>>>0){aw();return 0;return 0}if(W>>>0<q>>>0){aw();return 0;return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1311539]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[1311539]=W;ad=c[1311542]|0;Q=ad;c[1311542]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[aQ()>>2]=12;n=0;return n|0}function c_(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1311540]|0;if(b>>>0<e>>>0){aw()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){aw()}h=f&-8;i=a+(h-8|0)|0;j=i;L3148:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){aw()}if((n|0)==(c[1311541]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1311538]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=5246184+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){aw()}if((c[k+12>>2]|0)==(n|0)){break}aw()}}while(0);if((s|0)==(k|0)){c[1311536]=c[1311536]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){aw()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}aw()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L3182:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L3182}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){aw()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){aw()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){aw()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{aw()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=5246448+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1311537]=c[1311537]&(1<<c[v>>2]^-1);q=n;r=o;break L3148}else{if(p>>>0<(c[1311540]|0)>>>0){aw()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L3148}}}while(0);if(A>>>0<(c[1311540]|0)>>>0){aw()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1311540]|0)>>>0){aw()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1311540]|0)>>>0){aw()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){aw()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){aw()}do{if((e&2|0)==0){if((j|0)==(c[1311542]|0)){B=(c[1311539]|0)+r|0;c[1311539]=B;c[1311542]=q;c[q+4>>2]=B|1;if((q|0)==(c[1311541]|0)){c[1311541]=0;c[1311538]=0}if(B>>>0<=(c[1311543]|0)>>>0){return}do{if((c[1310720]|0)==0){B=aH(8)|0;if((B-1&B|0)==0){c[1310722]=B;c[1310721]=B;c[1310723]=-1;c[1310724]=2097152;c[1310725]=0;c[1311647]=0;c[1310720]=aT(0)&-16^1431655768;break}else{aw()}}}while(0);o=c[1311542]|0;if((o|0)==0){return}n=c[1311539]|0;do{if(n>>>0>40){l=c[1310722]|0;B=$(((((n-41|0)+l|0)>>>0)/(l>>>0)>>>0)-1|0,l);C=o;u=5246592;while(1){g=c[u>>2]|0;if(g>>>0<=C>>>0){if((g+(c[u+4>>2]|0)|0)>>>0>C>>>0){D=u;break}}g=c[u+8>>2]|0;if((g|0)==0){D=0;break}else{u=g}}if((c[D+12>>2]&8|0)!=0){break}u=aO(0)|0;C=D+4|0;if((u|0)!=((c[D>>2]|0)+(c[C>>2]|0)|0)){break}g=aO(-(B>>>0>2147483646?-2147483648-l|0:B)|0)|0;b=aO(0)|0;if(!((g|0)!=-1&b>>>0<u>>>0)){break}g=u-b|0;if((u|0)==(b|0)){break}c[C>>2]=(c[C>>2]|0)-g|0;c[1311644]=(c[1311644]|0)-g|0;C=c[1311542]|0;b=(c[1311539]|0)-g|0;g=C;u=C+8|0;if((u&7|0)==0){E=0}else{E=-u&7}u=b-E|0;c[1311542]=g+E|0;c[1311539]=u;c[g+(E+4|0)>>2]=u|1;c[g+(b+4|0)>>2]=40;c[1311543]=c[1310724]|0;return}}while(0);if((c[1311539]|0)>>>0<=(c[1311543]|0)>>>0){return}c[1311543]=-1;return}if((j|0)==(c[1311541]|0)){o=(c[1311538]|0)+r|0;c[1311538]=o;c[1311541]=q;c[q+4>>2]=o|1;c[d+o>>2]=o;return}o=(e&-8)+r|0;n=e>>>3;L3282:do{if(e>>>0<256){b=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;u=5246184+(n<<1<<2)|0;do{if((b|0)!=(u|0)){if(b>>>0<(c[1311540]|0)>>>0){aw()}if((c[b+12>>2]|0)==(j|0)){break}aw()}}while(0);if((g|0)==(b|0)){c[1311536]=c[1311536]&(1<<n^-1);break}do{if((g|0)==(u|0)){F=g+8|0}else{if(g>>>0<(c[1311540]|0)>>>0){aw()}B=g+8|0;if((c[B>>2]|0)==(j|0)){F=B;break}aw()}}while(0);c[b+12>>2]=g;c[F>>2]=b}else{u=i;B=c[a+(h+16|0)>>2]|0;l=c[a+(h|4)>>2]|0;L3303:do{if((l|0)==(u|0)){C=a+(h+12|0)|0;f=c[C>>2]|0;do{if((f|0)==0){t=a+(h+8|0)|0;p=c[t>>2]|0;if((p|0)==0){G=0;break L3303}else{H=p;I=t;break}}else{H=f;I=C}}while(0);while(1){C=H+20|0;f=c[C>>2]|0;if((f|0)!=0){H=f;I=C;continue}C=H+16|0;f=c[C>>2]|0;if((f|0)==0){break}else{H=f;I=C}}if(I>>>0<(c[1311540]|0)>>>0){aw()}else{c[I>>2]=0;G=H;break}}else{C=c[a+h>>2]|0;if(C>>>0<(c[1311540]|0)>>>0){aw()}f=C+12|0;if((c[f>>2]|0)!=(u|0)){aw()}t=l+8|0;if((c[t>>2]|0)==(u|0)){c[f>>2]=l;c[t>>2]=C;G=l;break}else{aw()}}}while(0);if((B|0)==0){break}l=a+(h+20|0)|0;b=5246448+(c[l>>2]<<2)|0;do{if((u|0)==(c[b>>2]|0)){c[b>>2]=G;if((G|0)!=0){break}c[1311537]=c[1311537]&(1<<c[l>>2]^-1);break L3282}else{if(B>>>0<(c[1311540]|0)>>>0){aw()}g=B+16|0;if((c[g>>2]|0)==(u|0)){c[g>>2]=G}else{c[B+20>>2]=G}if((G|0)==0){break L3282}}}while(0);if(G>>>0<(c[1311540]|0)>>>0){aw()}c[G+24>>2]=B;u=c[a+(h+8|0)>>2]|0;do{if((u|0)!=0){if(u>>>0<(c[1311540]|0)>>>0){aw()}else{c[G+16>>2]=u;c[u+24>>2]=G;break}}}while(0);u=c[a+(h+12|0)>>2]|0;if((u|0)==0){break}if(u>>>0<(c[1311540]|0)>>>0){aw()}else{c[G+20>>2]=u;c[u+24>>2]=G;break}}}while(0);c[q+4>>2]=o|1;c[d+o>>2]=o;if((q|0)!=(c[1311541]|0)){J=o;break}c[1311538]=o;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;J=r}}while(0);r=J>>>3;if(J>>>0<256){d=r<<1;e=5246184+(d<<2)|0;A=c[1311536]|0;G=1<<r;do{if((A&G|0)==0){c[1311536]=A|G;K=e;L=5246184+(d+2<<2)|0}else{r=5246184+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1311540]|0)>>>0){K=h;L=r;break}aw()}}while(0);c[L>>2]=q;c[K+12>>2]=q;c[q+8>>2]=K;c[q+12>>2]=e;return}e=q;K=J>>>8;do{if((K|0)==0){M=0}else{if(J>>>0>16777215){M=31;break}L=(K+1048320|0)>>>16&8;d=K<<L;G=(d+520192|0)>>>16&4;A=d<<G;d=(A+245760|0)>>>16&2;r=(14-(G|L|d)|0)+(A<<d>>>15)|0;M=J>>>((r+7|0)>>>0)&1|r<<1}}while(0);K=5246448+(M<<2)|0;c[q+28>>2]=M;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1311537]|0;d=1<<M;do{if((r&d|0)==0){c[1311537]=r|d;c[K>>2]=e;c[q+24>>2]=K;c[q+12>>2]=q;c[q+8>>2]=q}else{if((M|0)==31){N=0}else{N=25-(M>>>1)|0}A=J<<N;L=c[K>>2]|0;while(1){if((c[L+4>>2]&-8|0)==(J|0)){break}O=L+16+(A>>>31<<2)|0;G=c[O>>2]|0;if((G|0)==0){P=2591;break}else{A=A<<1;L=G}}if((P|0)==2591){if(O>>>0<(c[1311540]|0)>>>0){aw()}else{c[O>>2]=e;c[q+24>>2]=L;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=L+8|0;o=c[A>>2]|0;G=c[1311540]|0;if(L>>>0<G>>>0){aw()}if(o>>>0<G>>>0){aw()}else{c[o+12>>2]=e;c[A>>2]=e;c[q+8>>2]=o;c[q+12>>2]=L;c[q+24>>2]=0;break}}}while(0);q=(c[1311544]|0)-1|0;c[1311544]=q;if((q|0)==0){Q=5246600}else{return}while(1){q=c[Q>>2]|0;if((q|0)==0){break}else{Q=q+8|0}}c[1311544]=-1;return}function c$(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function c0(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function c1(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function c2(){aI()}function c3(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return aV[a&255](b|0,c|0,d|0,e|0,f|0)|0}function c4(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aW[a&255](b|0,c|0,d|0,e|0,f|0)}function c5(a,b){a=a|0;b=b|0;aX[a&255](b|0)}function c6(a,b,c){a=a|0;b=b|0;c=c|0;aY[a&255](b|0,c|0)}function c7(a,b){a=a|0;b=b|0;return aZ[a&255](b|0)|0}function c8(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return a_[a&255](b|0,c|0,d|0)|0}function c9(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;a$[a&255](b|0,c|0,d|0)}function da(a){a=a|0;a0[a&255]()}function db(a,b,c,d){a=a|0;b=b|0;c=c|0;d=+d;a1[a&255](b|0,c|0,+d)}function dc(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;a2[a&255](b|0,c|0,d|0,e|0,f|0,g|0)}function dd(a,b,c){a=a|0;b=b|0;c=c|0;return a3[a&255](b|0,c|0)|0}function de(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;a4[a&255](b|0,c|0,d|0,e|0)}function df(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(0);return 0}function dg(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(1)}function dh(a){a=a|0;aa(2)}function di(a,b){a=a|0;b=b|0;aa(3)}function dj(a){a=a|0;aa(4);return 0}function dk(a,b,c){a=a|0;b=b|0;c=c|0;aa(5);return 0}function dl(a,b,c){a=a|0;b=b|0;c=c|0;aa(6)}function dm(){aa(7)}function dn(a,b,c){a=a|0;b=b|0;c=+c;aa(8)}function dp(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aa(9)}function dq(a,b){a=a|0;b=b|0;aa(10);return 0}function dr(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aa(11)}
// EMSCRIPTEN_END_FUNCS
var aV=[df,df,df,df,df,df,cC,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,ch,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,cG,df,df,df,df,df,df,df,df,df,df,df,df,df,br,df,df,df,df,df,df,df,df,df,df,df,bz,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,cf,df,df,df,df,df,cd,df,cl,df,df,df,df,df,cE,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df,df];var aW=[dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,cT,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,cX,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg,dg];var aX=[dh,dh,b3,dh,cz,dh,dh,dh,cc,dh,dh,dh,ca,dh,bV,dh,b2,dh,dh,dh,b8,dh,cs,dh,dh,dh,dh,dh,cN,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,b6,dh,dh,dh,dh,dh,dh,dh,bk,dh,bE,dh,dh,dh,dh,dh,cA,dh,ck,dh,dh,dh,cO,dh,b4,dh,cK,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,cL,dh,ct,dh,dh,dh,dh,dh,dh,dh,dh,dh,bs,dh,dh,dh,dh,dh,dh,dh,by,dh,b1,dh,dh,dh,bj,dh,dh,dh,dh,dh,dh,dh,cj,dh,dh,dh,dh,dh,dh,dh,bD,dh,dh,dh,cM,dh,dh,dh,bQ,dh,dh,dh,cx,dh,cr,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh,dh];var aY=[di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,cg,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,cH,di,bM,di,di,di,di,di,cm,di,di,di,di,di,di,di,di,di,cF,di,di,di,di,di,di,di,di,di,di,di,bL,di,di,di,di,di,di,di,di,di,ce,di,di,di,cD,di,di,di,di,di,di,di,ci,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di,di];var aZ=[dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,bl,dj,dj,dj,dj,dj,dj,dj,bu,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj,dj];var a_=[dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,bm,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,cV,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,bU,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,bv,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk,dk];var a$=[dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,bO,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,bN,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl,dl];var a0=[dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,c2,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm,dm];var a1=[dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,bo,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,bA,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn,dn];var a2=[dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,cY,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,cU,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp,dp];var a3=[dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,bq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,bx,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,bH,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq,dq];var a4=[dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,cu,dr,dr,dr,dr,dr,dr,dr,b9,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,bn,dr,dr,dr,dr,dr,cS,dr,dr,dr,dr,dr,bw,dr,dr,dr,dr,dr,dr,dr,cn,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,cW,dr,dr,dr,b7,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,cy,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,cb,dr,dr,dr,dr,dr,cw,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr,dr];return{_strlen:c$,_free:c_,_main:bt,_memset:c1,_malloc:cZ,_memcpy:c0,stackAlloc:a5,stackSave:a6,stackRestore:a7,setThrew:a8,setTempRet0:a9,setTempRet1:ba,setTempRet2:bb,setTempRet3:bc,setTempRet4:bd,setTempRet5:be,setTempRet6:bf,setTempRet7:bg,setTempRet8:bh,setTempRet9:bi,dynCall_iiiiii:c3,dynCall_viiiii:c4,dynCall_vi:c5,dynCall_vii:c6,dynCall_ii:c7,dynCall_iiii:c8,dynCall_viii:c9,dynCall_v:da,dynCall_viif:db,dynCall_viiiiii:dc,dynCall_iii:dd,dynCall_viiii:de}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, invoke_iiiiii: invoke_iiiiii, invoke_viiiii: invoke_viiiii, invoke_vi: invoke_vi, invoke_vii: invoke_vii, invoke_ii: invoke_ii, invoke_iiii: invoke_iiii, invoke_viii: invoke_viii, invoke_v: invoke_v, invoke_viif: invoke_viif, invoke_viiiiii: invoke_viiiiii, invoke_iii: invoke_iii, invoke_viiii: invoke_viiii, _llvm_lifetime_end: _llvm_lifetime_end, _cosf: _cosf, _floorf: _floorf, _abort: _abort, _fprintf: _fprintf, _printf: _printf, __reallyNegative: __reallyNegative, _sqrtf: _sqrtf, _llvm_stackrestore: _llvm_stackrestore, _clock: _clock, ___setErrNo: ___setErrNo, _fwrite: _fwrite, _write: _write, _exit: _exit, _sysconf: _sysconf, ___cxa_pure_virtual: ___cxa_pure_virtual, __formatString: __formatString, __ZSt9terminatev: __ZSt9terminatev, _sinf: _sinf, ___assert_func: ___assert_func, _pwrite: _pwrite, _sbrk: _sbrk, _llvm_stacksave: _llvm_stacksave, ___errno_location: ___errno_location, ___gxx_personality_v0: ___gxx_personality_v0, _llvm_lifetime_start: _llvm_lifetime_start, _time: _time, __exit: __exit, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, NaN: NaN, Infinity: Infinity, __ZTVN10__cxxabiv120__si_class_type_infoE: __ZTVN10__cxxabiv120__si_class_type_infoE, __ZTVN10__cxxabiv117__class_type_infoE: __ZTVN10__cxxabiv117__class_type_infoE }, buffer);
var _strlen = Module["_strlen"] = asm._strlen;
var _free = Module["_free"] = asm._free;
var _main = Module["_main"] = asm._main;
var _memset = Module["_memset"] = asm._memset;
var _malloc = Module["_malloc"] = asm._malloc;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm.dynCall_iiiiii;
var dynCall_viiiii = Module["dynCall_viiiii"] = asm.dynCall_viiiii;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_vii = Module["dynCall_vii"] = asm.dynCall_vii;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_iiii = Module["dynCall_iiii"] = asm.dynCall_iiii;
var dynCall_viii = Module["dynCall_viii"] = asm.dynCall_viii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
var dynCall_viif = Module["dynCall_viif"] = asm.dynCall_viif;
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm.dynCall_viiiiii;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
var dynCall_viiii = Module["dynCall_viiii"] = asm.dynCall_viiii;
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
