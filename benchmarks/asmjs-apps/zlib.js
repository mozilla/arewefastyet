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
STATICTOP += 14136;
assert(STATICTOP < TOTAL_MEMORY);
/* memory initializer */ allocate([111,107,46,0,12,0,8,0,140,0,8,0,76,0,8,0,204,0,8,0,44,0,8,0,172,0,8,0,108,0,8,0,236,0,8,0,28,0,8,0,156,0,8,0,92,0,8,0,220,0,8,0,60,0,8,0,188,0,8,0,124,0,8,0,252,0,8,0,2,0,8,0,130,0,8,0,66,0,8,0,194,0,8,0,34,0,8,0,162,0,8,0,98,0,8,0,226,0,8,0,18,0,8,0,146,0,8,0,82,0,8,0,210,0,8,0,50,0,8,0,178,0,8,0,114,0,8,0,242,0,8,0,10,0,8,0,138,0,8,0,74,0,8,0,202,0,8,0,42,0,8,0,170,0,8,0,106,0,8,0,234,0,8,0,26,0,8,0,154,0,8,0,90,0,8,0,218,0,8,0,58,0,8,0,186,0,8,0,122,0,8,0,250,0,8,0,6,0,8,0,134,0,8,0,70,0,8,0,198,0,8,0,38,0,8,0,166,0,8,0,102,0,8,0,230,0,8,0,22,0,8,0,150,0,8,0,86,0,8,0,214,0,8,0,54,0,8,0,182,0,8,0,118,0,8,0,246,0,8,0,14,0,8,0,142,0,8,0,78,0,8,0,206,0,8,0,46,0,8,0,174,0,8,0,110,0,8,0,238,0,8,0,30,0,8,0,158,0,8,0,94,0,8,0,222,0,8,0,62,0,8,0,190,0,8,0,126,0,8,0,254,0,8,0,1,0,8,0,129,0,8,0,65,0,8,0,193,0,8,0,33,0,8,0,161,0,8,0,97,0,8,0,225,0,8,0,17,0,8,0,145,0,8,0,81,0,8,0,209,0,8,0,49,0,8,0,177,0,8,0,113,0,8,0,241,0,8,0,9,0,8,0,137,0,8,0,73,0,8,0,201,0,8,0,41,0,8,0,169,0,8,0,105,0,8,0,233,0,8,0,25,0,8,0,153,0,8,0,89,0,8,0,217,0,8,0,57,0,8,0,185,0,8,0,121,0,8,0,249,0,8,0,5,0,8,0,133,0,8,0,69,0,8,0,197,0,8,0,37,0,8,0,165,0,8,0,101,0,8,0,229,0,8,0,21,0,8,0,149,0,8,0,85,0,8,0,213,0,8,0,53,0,8,0,181,0,8,0,117,0,8,0,245,0,8,0,13,0,8,0,141,0,8,0,77,0,8,0,205,0,8,0,45,0,8,0,173,0,8,0,109,0,8,0,237,0,8,0,29,0,8,0,157,0,8,0,93,0,8,0,221,0,8,0,61,0,8,0,189,0,8,0,125,0,8,0,253,0,8,0,19,0,9,0,19,1,9,0,147,0,9,0,147,1,9,0,83,0,9,0,83,1,9,0,211,0,9,0,211,1,9,0,51,0,9,0,51,1,9,0,179,0,9,0,179,1,9,0,115,0,9,0,115,1,9,0,243,0,9,0,243,1,9,0,11,0,9,0,11,1,9,0,139,0,9,0,139,1,9,0,75,0,9,0,75,1,9,0,203,0,9,0,203,1,9,0,43,0,9,0,43,1,9,0,171,0,9,0,171,1,9,0,107,0,9,0,107,1,9,0,235,0,9,0,235,1,9,0,27,0,9,0,27,1,9,0,155,0,9,0,155,1,9,0,91,0,9,0,91,1,9,0,219,0,9,0,219,1,9,0,59,0,9,0,59,1,9,0,187,0,9,0,187,1,9,0,123,0,9,0,123,1,9,0,251,0,9,0,251,1,9,0,7,0,9,0,7,1,9,0,135,0,9,0,135,1,9,0,71,0,9,0,71,1,9,0,199,0,9,0,199,1,9,0,39,0,9,0,39,1,9,0,167,0,9,0,167,1,9,0,103,0,9,0,103,1,9,0,231,0,9,0,231,1,9,0,23,0,9,0,23,1,9,0,151,0,9,0,151,1,9,0,87,0,9,0,87,1,9,0,215,0,9,0,215,1,9,0,55,0,9,0,55,1,9,0,183,0,9,0,183,1,9,0,119,0,9,0,119,1,9,0,247,0,9,0,247,1,9,0,15,0,9,0,15,1,9,0,143,0,9,0,143,1,9,0,79,0,9,0,79,1,9,0,207,0,9,0,207,1,9,0,47,0,9,0,47,1,9,0,175,0,9,0,175,1,9,0,111,0,9,0,111,1,9,0,239,0,9,0,239,1,9,0,31,0,9,0,31,1,9,0,159,0,9,0,159,1,9,0,95,0,9,0,95,1,9,0,223,0,9,0,223,1,9,0,63,0,9,0,63,1,9,0,191,0,9,0,191,1,9,0,127,0,9,0,127,1,9,0,255,0,9,0,255,1,9,0,0,0,7,0,64,0,7,0,32,0,7,0,96,0,7,0,16,0,7,0,80,0,7,0,48,0,7,0,112,0,7,0,8,0,7,0,72,0,7,0,40,0,7,0,104,0,7,0,24,0,7,0,88,0,7,0,56,0,7,0,120,0,7,0,4,0,7,0,68,0,7,0,36,0,7,0,100,0,7,0,20,0,7,0,84,0,7,0,52,0,7,0,116,0,7,0,3,0,8,0,131,0,8,0,67,0,8,0,195,0,8,0,35,0,8,0,163,0,8,0,99,0,8,0,227,0,8,0,4,0,80,0,248,14,80,0,1,1,0,0,30,1,0,0,15,0,0,0,0,0,5,0,16,0,5,0,8,0,5,0,24,0,5,0,4,0,5,0,20,0,5,0,12,0,5,0,28,0,5,0,2,0,5,0,18,0,5,0,10,0,5,0,26,0,5,0,6,0,5,0,22,0,5,0,14,0,5,0,30,0,5,0,1,0,5,0,17,0,5,0,9,0,5,0,25,0,5,0,5,0,5,0,21,0,5,0,13,0,5,0,29,0,5,0,3,0,5,0,19,0,5,0,11,0,5,0,27,0,5,0,7,0,5,0,23,0,5,0,152,4,80,0,108,15,80,0,0,0,0,0,30,0,0,0,15,0,0,0,0,0,0,0,228,15,80,0,0,0,0,0,19,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,17,0,17,0,17,0,17,0,18,0,18,0,18,0,18,0,19,0,19,0,19,0,19,0,20,0,20,0,20,0,20,0,21,0,21,0,21,0,21,0,16,0,73,0,195,0,0,0,3,0,4,0,5,0,6,0,7,0,8,0,9,0,10,0,11,0,13,0,15,0,17,0,19,0,23,0,27,0,31,0,35,0,43,0,51,0,59,0,67,0,83,0,99,0,115,0,131,0,163,0,195,0,227,0,2,1,0,0,0,0,0,0,16,0,16,0,16,0,16,0,17,0,17,0,18,0,18,0,19,0,19,0,20,0,20,0,21,0,21,0,22,0,22,0,23,0,23,0,24,0,24,0,25,0,25,0,26,0,26,0,27,0,27,0,28,0,28,0,29,0,29,0,64,0,64,0,1,0,2,0,3,0,4,0,5,0,7,0,9,0,13,0,17,0,25,0,33,0,49,0,65,0,97,0,129,0,193,0,1,1,129,1,1,2,1,3,1,4,1,6,1,8,1,12,1,16,1,24,1,32,1,48,1,64,1,96,0,0,0,0,16,0,17,0,18,0,0,0,8,0,7,0,9,0,6,0,10,0,5,0,11,0,4,0,12,0,3,0,13,0,2,0,14,0,1,0,15,0,0,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,192,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,160,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,224,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,144,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,208,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,176,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,240,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,200,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,168,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,232,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,152,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,216,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,184,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,248,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,196,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,164,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,228,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,148,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,212,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,180,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,244,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,204,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,172,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,236,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,156,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,220,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,188,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,252,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,194,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,162,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,226,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,146,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,210,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,178,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,242,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,202,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,170,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,234,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,154,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,218,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,186,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,250,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,198,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,166,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,230,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,150,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,214,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,182,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,246,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,206,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,174,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,238,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,158,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,222,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,190,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,254,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,193,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,161,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,225,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,145,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,209,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,177,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,241,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,201,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,169,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,233,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,153,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,217,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,185,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,249,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,197,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,165,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,229,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,149,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,213,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,181,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,245,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,205,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,173,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,237,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,157,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,221,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,189,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,253,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,195,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,163,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,227,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,147,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,211,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,179,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,243,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,203,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,171,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,235,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,155,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,219,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,187,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,251,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,199,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,167,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,231,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,151,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,215,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,183,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,247,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,207,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,175,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,239,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,159,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,223,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,191,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,255,0,16,5,1,0,23,5,1,1,19,5,17,0,27,5,1,16,17,5,5,0,25,5,1,4,21,5,65,0,29,5,1,64,16,5,3,0,24,5,1,2,20,5,33,0,28,5,1,32,18,5,9,0,26,5,1,8,22,5,129,0,64,5,0,0,16,5,2,0,23,5,129,1,19,5,25,0,27,5,1,24,17,5,7,0,25,5,1,6,21,5,97,0,29,5,1,96,16,5,4,0,24,5,1,3,20,5,49,0,28,5,1,48,18,5,13,0,26,5,1,12,22,5,193,0,64,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,7,0,0,0,7,0,0,0,8,0,0,0,8,0,0,0,9,0,0,0,9,0,0,0,10,0,0,0,10,0,0,0,11,0,0,0,11,0,0,0,12,0,0,0,12,0,0,0,13,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,150,48,7,119,44,97,14,238,186,81,9,153,25,196,109,7,143,244,106,112,53,165,99,233,163,149,100,158,50,136,219,14,164,184,220,121,30,233,213,224,136,217,210,151,43,76,182,9,189,124,177,126,7,45,184,231,145,29,191,144,100,16,183,29,242,32,176,106,72,113,185,243,222,65,190,132,125,212,218,26,235,228,221,109,81,181,212,244,199,133,211,131,86,152,108,19,192,168,107,100,122,249,98,253,236,201,101,138,79,92,1,20,217,108,6,99,99,61,15,250,245,13,8,141,200,32,110,59,94,16,105,76,228,65,96,213,114,113,103,162,209,228,3,60,71,212,4,75,253,133,13,210,107,181,10,165,250,168,181,53,108,152,178,66,214,201,187,219,64,249,188,172,227,108,216,50,117,92,223,69,207,13,214,220,89,61,209,171,172,48,217,38,58,0,222,81,128,81,215,200,22,97,208,191,181,244,180,33,35,196,179,86,153,149,186,207,15,165,189,184,158,184,2,40,8,136,5,95,178,217,12,198,36,233,11,177,135,124,111,47,17,76,104,88,171,29,97,193,61,45,102,182,144,65,220,118,6,113,219,1,188,32,210,152,42,16,213,239,137,133,177,113,31,181,182,6,165,228,191,159,51,212,184,232,162,201,7,120,52,249,0,15,142,168,9,150,24,152,14,225,187,13,106,127,45,61,109,8,151,108,100,145,1,92,99,230,244,81,107,107,98,97,108,28,216,48,101,133,78,0,98,242,237,149,6,108,123,165,1,27,193,244,8,130,87,196,15,245,198,217,176,101,80,233,183,18,234,184,190,139,124,136,185,252,223,29,221,98,73,45,218,21,243,124,211,140,101,76,212,251,88,97,178,77,206,81,181,58,116,0,188,163,226,48,187,212,65,165,223,74,215,149,216,61,109,196,209,164,251,244,214,211,106,233,105,67,252,217,110,52,70,136,103,173,208,184,96,218,115,45,4,68,229,29,3,51,95,76,10,170,201,124,13,221,60,113,5,80,170,65,2,39,16,16,11,190,134,32,12,201,37,181,104,87,179,133,111,32,9,212,102,185,159,228,97,206,14,249,222,94,152,201,217,41,34,152,208,176,180,168,215,199,23,61,179,89,129,13,180,46,59,92,189,183,173,108,186,192,32,131,184,237,182,179,191,154,12,226,182,3,154,210,177,116,57,71,213,234,175,119,210,157,21,38,219,4,131,22,220,115,18,11,99,227,132,59,100,148,62,106,109,13,168,90,106,122,11,207,14,228,157,255,9,147,39,174,0,10,177,158,7,125,68,147,15,240,210,163,8,135,104,242,1,30,254,194,6,105,93,87,98,247,203,103,101,128,113,54,108,25,231,6,107,110,118,27,212,254,224,43,211,137,90,122,218,16,204,74,221,103,111,223,185,249,249,239,190,142,67,190,183,23,213,142,176,96,232,163,214,214,126,147,209,161,196,194,216,56,82,242,223,79,241,103,187,209,103,87,188,166,221,6,181,63,75,54,178,72,218,43,13,216,76,27,10,175,246,74,3,54,96,122,4,65,195,239,96,223,85,223,103,168,239,142,110,49,121,190,105,70,140,179,97,203,26,131,102,188,160,210,111,37,54,226,104,82,149,119,12,204,3,71,11,187,185,22,2,34,47,38,5,85,190,59,186,197,40,11,189,178,146,90,180,43,4,106,179,92,167,255,215,194,49,207,208,181,139,158,217,44,29,174,222,91,176,194,100,155,38,242,99,236,156,163,106,117,10,147,109,2,169,6,9,156,63,54,14,235,133,103,7,114,19,87,0,5,130,74,191,149,20,122,184,226,174,43,177,123,56,27,182,12,155,142,210,146,13,190,213,229,183,239,220,124,33,223,219,11,212,210,211,134,66,226,212,241,248,179,221,104,110,131,218,31,205,22,190,129,91,38,185,246,225,119,176,111,119,71,183,24,230,90,8,136,112,106,15,255,202,59,6,102,92,11,1,17,255,158,101,143,105,174,98,248,211,255,107,97,69,207,108,22,120,226,10,160,238,210,13,215,84,131,4,78,194,179,3,57,97,38,103,167,247,22,96,208,77,71,105,73,219,119,110,62,74,106,209,174,220,90,214,217,102,11,223,64,240,59,216,55,83,174,188,169,197,158,187,222,127,207,178,71,233,255,181,48,28,242,189,189,138,194,186,202,48,147,179,83,166,163,180,36,5,54,208,186,147,6,215,205,41,87,222,84,191,103,217,35,46,122,102,179,184,74,97,196,2,27,104,93,148,43,111,42,55,190,11,180,161,142,12,195,27,223,5,90,141,239,2,45,0,0,0,0,65,49,27,25,130,98,54,50,195,83,45,43,4,197,108,100,69,244,119,125,134,167,90,86,199,150,65,79,8,138,217,200,73,187,194,209,138,232,239,250,203,217,244,227,12,79,181,172,77,126,174,181,142,45,131,158,207,28,152,135,81,18,194,74,16,35,217,83,211,112,244,120,146,65,239,97,85,215,174,46,20,230,181,55,215,181,152,28,150,132,131,5,89,152,27,130,24,169,0,155,219,250,45,176,154,203,54,169,93,93,119,230,28,108,108,255,223,63,65,212,158,14,90,205,162,36,132,149,227,21,159,140,32,70,178,167,97,119,169,190,166,225,232,241,231,208,243,232,36,131,222,195,101,178,197,218,170,174,93,93,235,159,70,68,40,204,107,111,105,253,112,118,174,107,49,57,239,90,42,32,44,9,7,11,109,56,28,18,243,54,70,223,178,7,93,198,113,84,112,237,48,101,107,244,247,243,42,187,182,194,49,162,117,145,28,137,52,160,7,144,251,188,159,23,186,141,132,14,121,222,169,37,56,239,178,60,255,121,243,115,190,72,232,106,125,27,197,65,60,42,222,88,5,79,121,240,68,126,98,233,135,45,79,194,198,28,84,219,1,138,21,148,64,187,14,141,131,232,35,166,194,217,56,191,13,197,160,56,76,244,187,33,143,167,150,10,206,150,141,19,9,0,204,92,72,49,215,69,139,98,250,110,202,83,225,119,84,93,187,186,21,108,160,163,214,63,141,136,151,14,150,145,80,152,215,222,17,169,204,199,210,250,225,236,147,203,250,245,92,215,98,114,29,230,121,107,222,181,84,64,159,132,79,89,88,18,14,22,25,35,21,15,218,112,56,36,155,65,35,61,167,107,253,101,230,90,230,124,37,9,203,87,100,56,208,78,163,174,145,1,226,159,138,24,33,204,167,51,96,253,188,42,175,225,36,173,238,208,63,180,45,131,18,159,108,178,9,134,171,36,72,201,234,21,83,208,41,70,126,251,104,119,101,226,246,121,63,47,183,72,36,54,116,27,9,29,53,42,18,4,242,188,83,75,179,141,72,82,112,222,101,121,49,239,126,96,254,243,230,231,191,194,253,254,124,145,208,213,61,160,203,204,250,54,138,131,187,7,145,154,120,84,188,177,57,101,167,168,75,152,131,59,10,169,152,34,201,250,181,9,136,203,174,16,79,93,239,95,14,108,244,70,205,63,217,109,140,14,194,116,67,18,90,243,2,35,65,234,193,112,108,193,128,65,119,216,71,215,54,151,6,230,45,142,197,181,0,165,132,132,27,188,26,138,65,113,91,187,90,104,152,232,119,67,217,217,108,90,30,79,45,21,95,126,54,12,156,45,27,39,221,28,0,62,18,0,152,185,83,49,131,160,144,98,174,139,209,83,181,146,22,197,244,221,87,244,239,196,148,167,194,239,213,150,217,246,233,188,7,174,168,141,28,183,107,222,49,156,42,239,42,133,237,121,107,202,172,72,112,211,111,27,93,248,46,42,70,225,225,54,222,102,160,7,197,127,99,84,232,84,34,101,243,77,229,243,178,2,164,194,169,27,103,145,132,48,38,160,159,41,184,174,197,228,249,159,222,253,58,204,243,214,123,253,232,207,188,107,169,128,253,90,178,153,62,9,159,178,127,56,132,171,176,36,28,44,241,21,7,53,50,70,42,30,115,119,49,7,180,225,112,72,245,208,107,81,54,131,70,122,119,178,93,99,78,215,250,203,15,230,225,210,204,181,204,249,141,132,215,224,74,18,150,175,11,35,141,182,200,112,160,157,137,65,187,132,70,93,35,3,7,108,56,26,196,63,21,49,133,14,14,40,66,152,79,103,3,169,84,126,192,250,121,85,129,203,98,76,31,197,56,129,94,244,35,152,157,167,14,179,220,150,21,170,27,0,84,229,90,49,79,252,153,98,98,215,216,83,121,206,23,79,225,73,86,126,250,80,149,45,215,123,212,28,204,98,19,138,141,45,82,187,150,52,145,232,187,31,208,217,160,6,236,243,126,94,173,194,101,71,110,145,72,108,47,160,83,117,232,54,18,58,169,7,9,35,106,84,36,8,43,101,63,17,228,121,167,150,165,72,188,143,102,27,145,164,39,42,138,189,224,188,203,242,161,141,208,235,98,222,253,192,35,239,230,217,189,225,188,20,252,208,167,13,63,131,138,38,126,178,145,63,185,36,208,112,248,21,203,105,59,70,230,66,122,119,253,91,181,107,101,220,244,90,126,197,55,9,83,238,118,56,72,247,177,174,9,184,240,159,18,161,51,204,63,138,114,253,36,147,0,0,0,0,55,106,194,1,110,212,132,3,89,190,70,2,220,168,9,7,235,194,203,6,178,124,141,4,133,22,79,5,184,81,19,14,143,59,209,15,214,133,151,13,225,239,85,12,100,249,26,9,83,147,216,8,10,45,158,10,61,71,92,11,112,163,38,28,71,201,228,29,30,119,162,31,41,29,96,30,172,11,47,27,155,97,237,26,194,223,171,24,245,181,105,25,200,242,53,18,255,152,247,19,166,38,177,17,145,76,115,16,20,90,60,21,35,48,254,20,122,142,184,22,77,228,122,23,224,70,77,56,215,44,143,57,142,146,201,59,185,248,11,58,60,238,68,63,11,132,134,62,82,58,192,60,101,80,2,61,88,23,94,54,111,125,156,55,54,195,218,53,1,169,24,52,132,191,87,49,179,213,149,48,234,107,211,50,221,1,17,51,144,229,107,36,167,143,169,37,254,49,239,39,201,91,45,38,76,77,98,35,123,39,160,34,34,153,230,32,21,243,36,33,40,180,120,42,31,222,186,43,70,96,252,41,113,10,62,40,244,28,113,45,195,118,179,44,154,200,245,46,173,162,55,47,192,141,154,112,247,231,88,113,174,89,30,115,153,51,220,114,28,37,147,119,43,79,81,118,114,241,23,116,69,155,213,117,120,220,137,126,79,182,75,127,22,8,13,125,33,98,207,124,164,116,128,121,147,30,66,120,202,160,4,122,253,202,198,123,176,46,188,108,135,68,126,109,222,250,56,111,233,144,250,110,108,134,181,107,91,236,119,106,2,82,49,104,53,56,243,105,8,127,175,98,63,21,109,99,102,171,43,97,81,193,233,96,212,215,166,101,227,189,100,100,186,3,34,102,141,105,224,103,32,203,215,72,23,161,21,73,78,31,83,75,121,117,145,74,252,99,222,79,203,9,28,78,146,183,90,76,165,221,152,77,152,154,196,70,175,240,6,71,246,78,64,69,193,36,130,68,68,50,205,65,115,88,15,64,42,230,73,66,29,140,139,67,80,104,241,84,103,2,51,85,62,188,117,87,9,214,183,86,140,192,248,83,187,170,58,82,226,20,124,80,213,126,190,81,232,57,226,90,223,83,32,91,134,237,102,89,177,135,164,88,52,145,235,93,3,251,41,92,90,69,111,94,109,47,173,95,128,27,53,225,183,113,247,224,238,207,177,226,217,165,115,227,92,179,60,230,107,217,254,231,50,103,184,229,5,13,122,228,56,74,38,239,15,32,228,238,86,158,162,236,97,244,96,237,228,226,47,232,211,136,237,233,138,54,171,235,189,92,105,234,240,184,19,253,199,210,209,252,158,108,151,254,169,6,85,255,44,16,26,250,27,122,216,251,66,196,158,249,117,174,92,248,72,233,0,243,127,131,194,242,38,61,132,240,17,87,70,241,148,65,9,244,163,43,203,245,250,149,141,247,205,255,79,246,96,93,120,217,87,55,186,216,14,137,252,218,57,227,62,219,188,245,113,222,139,159,179,223,210,33,245,221,229,75,55,220,216,12,107,215,239,102,169,214,182,216,239,212,129,178,45,213,4,164,98,208,51,206,160,209,106,112,230,211,93,26,36,210,16,254,94,197,39,148,156,196,126,42,218,198,73,64,24,199,204,86,87,194,251,60,149,195,162,130,211,193,149,232,17,192,168,175,77,203,159,197,143,202,198,123,201,200,241,17,11,201,116,7,68,204,67,109,134,205,26,211,192,207,45,185,2,206,64,150,175,145,119,252,109,144,46,66,43,146,25,40,233,147,156,62,166,150,171,84,100,151,242,234,34,149,197,128,224,148,248,199,188,159,207,173,126,158,150,19,56,156,161,121,250,157,36,111,181,152,19,5,119,153,74,187,49,155,125,209,243,154,48,53,137,141,7,95,75,140,94,225,13,142,105,139,207,143,236,157,128,138,219,247,66,139,130,73,4,137,181,35,198,136,136,100,154,131,191,14,88,130,230,176,30,128,209,218,220,129,84,204,147,132,99,166,81,133,58,24,23,135,13,114,213,134,160,208,226,169,151,186,32,168,206,4,102,170,249,110,164,171,124,120,235,174,75,18,41,175,18,172,111,173,37,198,173,172,24,129,241,167,47,235,51,166,118,85,117,164,65,63,183,165,196,41,248,160,243,67,58,161,170,253,124,163,157,151,190,162,208,115,196,181,231,25,6,180,190,167,64,182,137,205,130,183,12,219,205,178,59,177,15,179,98,15,73,177,85,101,139,176,104,34,215,187,95,72,21,186,6,246,83,184,49,156,145,185,180,138,222,188,131,224,28,189,218,94,90,191,237,52,152,190,0,0,0,0,101,103,188,184,139,200,9,170,238,175,181,18,87,151,98,143,50,240,222,55,220,95,107,37,185,56,215,157,239,40,180,197,138,79,8,125,100,224,189,111,1,135,1,215,184,191,214,74,221,216,106,242,51,119,223,224,86,16,99,88,159,87,25,80,250,48,165,232,20,159,16,250,113,248,172,66,200,192,123,223,173,167,199,103,67,8,114,117,38,111,206,205,112,127,173,149,21,24,17,45,251,183,164,63,158,208,24,135,39,232,207,26,66,143,115,162,172,32,198,176,201,71,122,8,62,175,50,160,91,200,142,24,181,103,59,10,208,0,135,178,105,56,80,47,12,95,236,151,226,240,89,133,135,151,229,61,209,135,134,101,180,224,58,221,90,79,143,207,63,40,51,119,134,16,228,234,227,119,88,82,13,216,237,64,104,191,81,248,161,248,43,240,196,159,151,72,42,48,34,90,79,87,158,226,246,111,73,127,147,8,245,199,125,167,64,213,24,192,252,109,78,208,159,53,43,183,35,141,197,24,150,159,160,127,42,39,25,71,253,186,124,32,65,2,146,143,244,16,247,232,72,168,61,88,20,155,88,63,168,35,182,144,29,49,211,247,161,137,106,207,118,20,15,168,202,172,225,7,127,190,132,96,195,6,210,112,160,94,183,23,28,230,89,184,169,244,60,223,21,76,133,231,194,209,224,128,126,105,14,47,203,123,107,72,119,195,162,15,13,203,199,104,177,115,41,199,4,97,76,160,184,217,245,152,111,68,144,255,211,252,126,80,102,238,27,55,218,86,77,39,185,14,40,64,5,182,198,239,176,164,163,136,12,28,26,176,219,129,127,215,103,57,145,120,210,43,244,31,110,147,3,247,38,59,102,144,154,131,136,63,47,145,237,88,147,41,84,96,68,180,49,7,248,12,223,168,77,30,186,207,241,166,236,223,146,254,137,184,46,70,103,23,155,84,2,112,39,236,187,72,240,113,222,47,76,201,48,128,249,219,85,231,69,99,156,160,63,107,249,199,131,211,23,104,54,193,114,15,138,121,203,55,93,228,174,80,225,92,64,255,84,78,37,152,232,246,115,136,139,174,22,239,55,22,248,64,130,4,157,39,62,188,36,31,233,33,65,120,85,153,175,215,224,139,202,176,92,51,59,182,89,237,94,209,229,85,176,126,80,71,213,25,236,255,108,33,59,98,9,70,135,218,231,233,50,200,130,142,142,112,212,158,237,40,177,249,81,144,95,86,228,130,58,49,88,58,131,9,143,167,230,110,51,31,8,193,134,13,109,166,58,181,164,225,64,189,193,134,252,5,47,41,73,23,74,78,245,175,243,118,34,50,150,17,158,138,120,190,43,152,29,217,151,32,75,201,244,120,46,174,72,192,192,1,253,210,165,102,65,106,28,94,150,247,121,57,42,79,151,150,159,93,242,241,35,229,5,25,107,77,96,126,215,245,142,209,98,231,235,182,222,95,82,142,9,194,55,233,181,122,217,70,0,104,188,33,188,208,234,49,223,136,143,86,99,48,97,249,214,34,4,158,106,154,189,166,189,7,216,193,1,191,54,110,180,173,83,9,8,21,154,78,114,29,255,41,206,165,17,134,123,183,116,225,199,15,205,217,16,146,168,190,172,42,70,17,25,56,35,118,165,128,117,102,198,216,16,1,122,96,254,174,207,114,155,201,115,202,34,241,164,87,71,150,24,239,169,57,173,253,204,94,17,69,6,238,77,118,99,137,241,206,141,38,68,220,232,65,248,100,81,121,47,249,52,30,147,65,218,177,38,83,191,214,154,235,233,198,249,179,140,161,69,11,98,14,240,25,7,105,76,161,190,81,155,60,219,54,39,132,53,153,146,150,80,254,46,46,153,185,84,38,252,222,232,158,18,113,93,140,119,22,225,52,206,46,54,169,171,73,138,17,69,230,63,3,32,129,131,187,118,145,224,227,19,246,92,91,253,89,233,73,152,62,85,241,33,6,130,108,68,97,62,212,170,206,139,198,207,169,55,126,56,65,127,214,93,38,195,110,179,137,118,124,214,238,202,196,111,214,29,89,10,177,161,225,228,30,20,243,129,121,168,75,215,105,203,19,178,14,119,171,92,161,194,185,57,198,126,1,128,254,169,156,229,153,21,36,11,54,160,54,110,81,28,142,167,22,102,134,194,113,218,62,44,222,111,44,73,185,211,148,240,129,4,9,149,230,184,177,123,73,13,163,30,46,177,27,72,62,210,67,45,89,110,251,195,246,219,233,166,145,103,81,31,169,176,204,122,206,12,116,148,97,185,102,241,6,5,222,0,0,0,0,119,7,48,150,238,14,97,44,153,9,81,186,7,109,196,25,112,106,244,143,233,99,165,53,158,100,149,163,14,219,136,50,121,220,184,164,224,213,233,30,151,210,217,136,9,182,76,43,126,177,124,189,231,184,45,7,144,191,29,145,29,183,16,100,106,176,32,242,243,185,113,72,132,190,65,222,26,218,212,125,109,221,228,235,244,212,181,81,131,211,133,199,19,108,152,86,100,107,168,192,253,98,249,122,138,101,201,236,20,1,92,79,99,6,108,217,250,15,61,99,141,8,13,245,59,110,32,200,76,105,16,94,213,96,65,228,162,103,113,114,60,3,228,209,75,4,212,71,210,13,133,253,165,10,181,107,53,181,168,250,66,178,152,108,219,187,201,214,172,188,249,64,50,216,108,227,69,223,92,117,220,214,13,207,171,209,61,89,38,217,48,172,81,222,0,58,200,215,81,128,191,208,97,22,33,180,244,181,86,179,196,35,207,186,149,153,184,189,165,15,40,2,184,158,95,5,136,8,198,12,217,178,177,11,233,36,47,111,124,135,88,104,76,17,193,97,29,171,182,102,45,61,118,220,65,144,1,219,113,6,152,210,32,188,239,213,16,42,113,177,133,137,6,182,181,31,159,191,228,165,232,184,212,51,120,7,201,162,15,0,249,52,150,9,168,142,225,14,152,24,127,106,13,187,8,109,61,45,145,100,108,151,230,99,92,1,107,107,81,244,28,108,97,98,133,101,48,216,242,98,0,78,108,6,149,237,27,1,165,123,130,8,244,193,245,15,196,87,101,176,217,198,18,183,233,80,139,190,184,234,252,185,136,124,98,221,29,223,21,218,45,73,140,211,124,243,251,212,76,101,77,178,97,88,58,181,81,206,163,188,0,116,212,187,48,226,74,223,165,65,61,216,149,215,164,209,196,109,211,214,244,251,67,105,233,106,52,110,217,252,173,103,136,70,218,96,184,208,68,4,45,115,51,3,29,229,170,10,76,95,221,13,124,201,80,5,113,60,39,2,65,170,190,11,16,16,201,12,32,134,87,104,181,37,32,111,133,179,185,102,212,9,206,97,228,159,94,222,249,14,41,217,201,152,176,208,152,34,199,215,168,180,89,179,61,23,46,180,13,129,183,189,92,59,192,186,108,173,237,184,131,32,154,191,179,182,3,182,226,12,116,177,210,154,234,213,71,57,157,210,119,175,4,219,38,21,115,220,22,131,227,99,11,18,148,100,59,132,13,109,106,62,122,106,90,168,228,14,207,11,147,9,255,157,10,0,174,39,125,7,158,177,240,15,147,68,135,8,163,210,30,1,242,104,105,6,194,254,247,98,87,93,128,101,103,203,25,108,54,113,110,107,6,231,254,212,27,118,137,211,43,224,16,218,122,90,103,221,74,204,249,185,223,111,142,190,239,249,23,183,190,67,96,176,142,213,214,214,163,232,161,209,147,126,56,216,194,196,79,223,242,82,209,187,103,241,166,188,87,103,63,181,6,221,72,178,54,75,216,13,43,218,175,10,27,76,54,3,74,246,65,4,122,96,223,96,239,195,168,103,223,85,49,110,142,239,70,105,190,121,203,97,179,140,188,102,131,26,37,111,210,160,82,104,226,54,204,12,119,149,187,11,71,3,34,2,22,185,85,5,38,47,197,186,59,190,178,189,11,40,43,180,90,146,92,179,106,4,194,215,255,167,181,208,207,49,44,217,158,139,91,222,174,29,155,100,194,176,236,99,242,38,117,106,163,156,2,109,147,10,156,9,6,169,235,14,54,63,114,7,103,133,5,0,87,19,149,191,74,130,226,184,122,20,123,177,43,174,12,182,27,56,146,210,142,155,229,213,190,13,124,220,239,183,11,219,223,33,134,211,210,212,241,212,226,66,104,221,179,248,31,218,131,110,129,190,22,205,246,185,38,91,111,176,119,225,24,183,71,119,136,8,90,230,255,15,106,112,102,6,59,202,17,1,11,92,143,101,158,255,248,98,174,105,97,107,255,211,22,108,207,69,160,10,226,120,215,13,210,238,78,4,131,84,57,3,179,194,167,103,38,97,208,96,22,247,73,105,71,77,62,110,119,219,174,209,106,74,217,214,90,220,64,223,11,102,55,216,59,240,169,188,174,83,222,187,158,197,71,178,207,127,48,181,255,233,189,189,242,28,202,186,194,138,83,179,147,48,36,180,163,166,186,208,54,5,205,215,6,147,84,222,87,41,35,217,103,191,179,102,122,46,196,97,74,184,93,104,27,2,42,111,43,148,180,11,190,55,195,12,142,161,90,5,223,27,45,2,239,141,0,0,0,0,25,27,49,65,50,54,98,130,43,45,83,195,100,108,197,4,125,119,244,69,86,90,167,134,79,65,150,199,200,217,138,8,209,194,187,73,250,239,232,138,227,244,217,203,172,181,79,12,181,174,126,77,158,131,45,142,135,152,28,207,74,194,18,81,83,217,35,16,120,244,112,211,97,239,65,146,46,174,215,85,55,181,230,20,28,152,181,215,5,131,132,150,130,27,152,89,155,0,169,24,176,45,250,219,169,54,203,154,230,119,93,93,255,108,108,28,212,65,63,223,205,90,14,158,149,132,36,162,140,159,21,227,167,178,70,32,190,169,119,97,241,232,225,166,232,243,208,231,195,222,131,36,218,197,178,101,93,93,174,170,68,70,159,235,111,107,204,40,118,112,253,105,57,49,107,174,32,42,90,239,11,7,9,44,18,28,56,109,223,70,54,243,198,93,7,178,237,112,84,113,244,107,101,48,187,42,243,247,162,49,194,182,137,28,145,117,144,7,160,52,23,159,188,251,14,132,141,186,37,169,222,121,60,178,239,56,115,243,121,255,106,232,72,190,65,197,27,125,88,222,42,60,240,121,79,5,233,98,126,68,194,79,45,135,219,84,28,198,148,21,138,1,141,14,187,64,166,35,232,131,191,56,217,194,56,160,197,13,33,187,244,76,10,150,167,143,19,141,150,206,92,204,0,9,69,215,49,72,110,250,98,139,119,225,83,202,186,187,93,84,163,160,108,21,136,141,63,214,145,150,14,151,222,215,152,80,199,204,169,17,236,225,250,210,245,250,203,147,114,98,215,92,107,121,230,29,64,84,181,222,89,79,132,159,22,14,18,88,15,21,35,25,36,56,112,218,61,35,65,155,101,253,107,167,124,230,90,230,87,203,9,37,78,208,56,100,1,145,174,163,24,138,159,226,51,167,204,33,42,188,253,96,173,36,225,175,180,63,208,238,159,18,131,45,134,9,178,108,201,72,36,171,208,83,21,234,251,126,70,41,226,101,119,104,47,63,121,246,54,36,72,183,29,9,27,116,4,18,42,53,75,83,188,242,82,72,141,179,121,101,222,112,96,126,239,49,231,230,243,254,254,253,194,191,213,208,145,124,204,203,160,61,131,138,54,250,154,145,7,187,177,188,84,120,168,167,101,57,59,131,152,75,34,152,169,10,9,181,250,201,16,174,203,136,95,239,93,79,70,244,108,14,109,217,63,205,116,194,14,140,243,90,18,67,234,65,35,2,193,108,112,193,216,119,65,128,151,54,215,71,142,45,230,6,165,0,181,197,188,27,132,132,113,65,138,26,104,90,187,91,67,119,232,152,90,108,217,217,21,45,79,30,12,54,126,95,39,27,45,156,62,0,28,221,185,152,0,18,160,131,49,83,139,174,98,144,146,181,83,209,221,244,197,22,196,239,244,87,239,194,167,148,246,217,150,213,174,7,188,233,183,28,141,168,156,49,222,107,133,42,239,42,202,107,121,237,211,112,72,172,248,93,27,111,225,70,42,46,102,222,54,225,127,197,7,160,84,232,84,99,77,243,101,34,2,178,243,229,27,169,194,164,48,132,145,103,41,159,160,38,228,197,174,184,253,222,159,249,214,243,204,58,207,232,253,123,128,169,107,188,153,178,90,253,178,159,9,62,171,132,56,127,44,28,36,176,53,7,21,241,30,42,70,50,7,49,119,115,72,112,225,180,81,107,208,245,122,70,131,54,99,93,178,119,203,250,215,78,210,225,230,15,249,204,181,204,224,215,132,141,175,150,18,74,182,141,35,11,157,160,112,200,132,187,65,137,3,35,93,70,26,56,108,7,49,21,63,196,40,14,14,133,103,79,152,66,126,84,169,3,85,121,250,192,76,98,203,129,129,56,197,31,152,35,244,94,179,14,167,157,170,21,150,220,229,84,0,27,252,79,49,90,215,98,98,153,206,121,83,216,73,225,79,23,80,250,126,86,123,215,45,149,98,204,28,212,45,141,138,19,52,150,187,82,31,187,232,145,6,160,217,208,94,126,243,236,71,101,194,173,108,72,145,110,117,83,160,47,58,18,54,232,35,9,7,169,8,36,84,106,17,63,101,43,150,167,121,228,143,188,72,165,164,145,27,102,189,138,42,39,242,203,188,224,235,208,141,161,192,253,222,98,217,230,239,35,20,188,225,189,13,167,208,252].concat([38,138,131,63,63,145,178,126,112,208,36,185,105,203,21,248,66,230,70,59,91,253,119,122,220,101,107,181,197,126,90,244,238,83,9,55,247,72,56,118,184,9,174,177,161,18,159,240,138,63,204,51,147,36,253,114,0,0,0,0,1,194,106,55,3,132,212,110,2,70,190,89,7,9,168,220,6,203,194,235,4,141,124,178,5,79,22,133,14,19,81,184,15,209,59,143,13,151,133,214,12,85,239,225,9,26,249,100,8,216,147,83,10,158,45,10,11,92,71,61,28,38,163,112,29,228,201,71,31,162,119,30,30,96,29,41,27,47,11,172,26,237,97,155,24,171,223,194,25,105,181,245,18,53,242,200,19,247,152,255,17,177,38,166,16,115,76,145,21,60,90,20,20,254,48,35,22,184,142,122,23,122,228,77,56,77,70,224,57,143,44,215,59,201,146,142,58,11,248,185,63,68,238,60,62,134,132,11,60,192,58,82,61,2,80,101,54,94,23,88,55,156,125,111,53,218,195,54,52,24,169,1,49,87,191,132,48,149,213,179,50,211,107,234,51,17,1,221,36,107,229,144,37,169,143,167,39,239,49,254,38,45,91,201,35,98,77,76,34,160,39,123,32,230,153,34,33,36,243,21,42,120,180,40,43,186,222,31,41,252,96,70,40,62,10,113,45,113,28,244,44,179,118,195,46,245,200,154,47,55,162,173,112,154,141,192,113,88,231,247,115,30,89,174,114,220,51,153,119,147,37,28,118,81,79,43,116,23,241,114,117,213,155,69,126,137,220,120,127,75,182,79,125,13,8,22,124,207,98,33,121,128,116,164,120,66,30,147,122,4,160,202,123,198,202,253,108,188,46,176,109,126,68,135,111,56,250,222,110,250,144,233,107,181,134,108,106,119,236,91,104,49,82,2,105,243,56,53,98,175,127,8,99,109,21,63,97,43,171,102,96,233,193,81,101,166,215,212,100,100,189,227,102,34,3,186,103,224,105,141,72,215,203,32,73,21,161,23,75,83,31,78,74,145,117,121,79,222,99,252,78,28,9,203,76,90,183,146,77,152,221,165,70,196,154,152,71,6,240,175,69,64,78,246,68,130,36,193,65,205,50,68,64,15,88,115,66,73,230,42,67,139,140,29,84,241,104,80,85,51,2,103,87,117,188,62,86,183,214,9,83,248,192,140,82,58,170,187,80,124,20,226,81,190,126,213,90,226,57,232,91,32,83,223,89,102,237,134,88,164,135,177,93,235,145,52,92,41,251,3,94,111,69,90,95,173,47,109,225,53,27,128,224,247,113,183,226,177,207,238,227,115,165,217,230,60,179,92,231,254,217,107,229,184,103,50,228,122,13,5,239,38,74,56,238,228,32,15,236,162,158,86,237,96,244,97,232,47,226,228,233,237,136,211,235,171,54,138,234,105,92,189,253,19,184,240,252,209,210,199,254,151,108,158,255,85,6,169,250,26,16,44,251,216,122,27,249,158,196,66,248,92,174,117,243,0,233,72,242,194,131,127,240,132,61,38,241,70,87,17,244,9,65,148,245,203,43,163,247,141,149,250,246,79,255,205,217,120,93,96,216,186,55,87,218,252,137,14,219,62,227,57,222,113,245,188,223,179,159,139,221,245,33,210,220,55,75,229,215,107,12,216,214,169,102,239,212,239,216,182,213,45,178,129,208,98,164,4,209,160,206,51,211,230,112,106,210,36,26,93,197,94,254,16,196,156,148,39,198,218,42,126,199,24,64,73,194,87,86,204,195,149,60,251,193,211,130,162,192,17,232,149,203,77,175,168,202,143,197,159,200,201,123,198,201,11,17,241,204,68,7,116,205,134,109,67,207,192,211,26,206,2,185,45,145,175,150,64,144,109,252,119,146,43,66,46,147,233,40,25,150,166,62,156,151,100,84,171,149,34,234,242,148,224,128,197,159,188,199,248,158,126,173,207,156,56,19,150,157,250,121,161,152,181,111,36,153,119,5,19,155,49,187,74,154,243,209,125,141,137,53,48,140,75,95,7,142,13,225,94,143,207,139,105,138,128,157,236,139,66,247,219,137,4,73,130,136,198,35,181,131,154,100,136,130,88,14,191,128,30,176,230,129,220,218,209,132,147,204,84,133,81,166,99,135,23,24,58,134,213,114,13,169,226,208,160,168,32,186,151,170,102,4,206,171,164,110,249,174,235,120,124,175,41,18,75,173,111,172,18,172,173,198,37,167,241,129,24,166,51,235,47,164,117,85,118,165,183,63,65,160,248,41,196,161,58,67,243,163,124,253,170,162,190,151,157,181,196,115,208,180,6,25,231,182,64,167,190,183,130,205,137,178,205,219,12,179,15,177,59,177,73,15,98,176,139,101,85,187,215,34,104,186,21,72,95,184,83,246,6,185,145,156,49,188,222,138,180,189,28,224,131,191,90,94,218,190,152,52,237,0,0,0,0,184,188,103,101,170,9,200,139,18,181,175,238,143,98,151,87,55,222,240,50,37,107,95,220,157,215,56,185,197,180,40,239,125,8,79,138,111,189,224,100,215,1,135,1,74,214,191,184,242,106,216,221,224,223,119,51,88,99,16,86,80,25,87,159,232,165,48,250,250,16,159,20,66,172,248,113,223,123,192,200,103,199,167,173,117,114,8,67,205,206,111,38,149,173,127,112,45,17,24,21,63,164,183,251,135,24,208,158,26,207,232,39,162,115,143,66,176,198,32,172,8,122,71,201,160,50,175,62,24,142,200,91,10,59,103,181,178,135,0,208,47,80,56,105,151,236,95,12,133,89,240,226,61,229,151,135,101,134,135,209,221,58,224,180,207,143,79,90,119,51,40,63,234,228,16,134,82,88,119,227,64,237,216,13,248,81,191,104,240,43,248,161,72,151,159,196,90,34,48,42,226,158,87,79,127,73,111,246,199,245,8,147,213,64,167,125,109,252,192,24,53,159,208,78,141,35,183,43,159,150,24,197,39,42,127,160,186,253,71,25,2,65,32,124,16,244,143,146,168,72,232,247,155,20,88,61,35,168,63,88,49,29,144,182,137,161,247,211,20,118,207,106,172,202,168,15,190,127,7,225,6,195,96,132,94,160,112,210,230,28,23,183,244,169,184,89,76,21,223,60,209,194,231,133,105,126,128,224,123,203,47,14,195,119,72,107,203,13,15,162,115,177,104,199,97,4,199,41,217,184,160,76,68,111,152,245,252,211,255,144,238,102,80,126,86,218,55,27,14,185,39,77,182,5,64,40,164,176,239,198,28,12,136,163,129,219,176,26,57,103,215,127,43,210,120,145,147,110,31,244,59,38,247,3,131,154,144,102,145,47,63,136,41,147,88,237,180,68,96,84,12,248,7,49,30,77,168,223,166,241,207,186,254,146,223,236,70,46,184,137,84,155,23,103,236,39,112,2,113,240,72,187,201,76,47,222,219,249,128,48,99,69,231,85,107,63,160,156,211,131,199,249,193,54,104,23,121,138,15,114,228,93,55,203,92,225,80,174,78,84,255,64,246,232,152,37,174,139,136,115,22,55,239,22,4,130,64,248,188,62,39,157,33,233,31,36,153,85,120,65,139,224,215,175,51,92,176,202,237,89,182,59,85,229,209,94,71,80,126,176,255,236,25,213,98,59,33,108,218,135,70,9,200,50,233,231,112,142,142,130,40,237,158,212,144,81,249,177,130,228,86,95,58,88,49,58,167,143,9,131,31,51,110,230,13,134,193,8,181,58,166,109,189,64,225,164,5,252,134,193,23,73,41,47,175,245,78,74,50,34,118,243,138,158,17,150,152,43,190,120,32,151,217,29,120,244,201,75,192,72,174,46,210,253,1,192,106,65,102,165,247,150,94,28,79,42,57,121,93,159,150,151,229,35,241,242,77,107,25,5,245,215,126,96,231,98,209,142,95,222,182,235,194,9,142,82,122,181,233,55,104,0,70,217,208,188,33,188,136,223,49,234,48,99,86,143,34,214,249,97,154,106,158,4,7,189,166,189,191,1,193,216,173,180,110,54,21,8,9,83,29,114,78,154,165,206,41,255,183,123,134,17,15,199,225,116,146,16,217,205,42,172,190,168,56,25,17,70,128,165,118,35,216,198,102,117,96,122,1,16,114,207,174,254,202,115,201,155,87,164,241,34,239,24,150,71,253,173,57,169,69,17,94,204,118,77,238,6,206,241,137,99,220,68,38,141,100,248,65,232,249,47,121,81,65,147,30,52,83,38,177,218,235,154,214,191,179,249,198,233,11,69,161,140,25,240,14,98,161,76,105,7,60,155,81,190,132,39,54,219,150,146,153,53,46,46,254,80,38,84,185,153,158,232,222,252,140,93,113,18,52,225,22,119,169,54,46,206,17,138,73,171,3,63,230,69,187,131,129,32,227,224,145,118,91,92,246,19,73,233,89,253,241,85,62,152,108,130,6,33,212,62,97,68,198,139,206,170,126,55,169,207,214,127,65,56,110,195,38,93,124,118,137,179,196,202,238,214,89,29,214,111,225,161,177,10,243,20,30,228,75,168,121,129,19,203,105,215,171,119,14,178,185,194,161,92,1,126,198,57,156,169,254,128,36,21,153,229,54,160,54,11,142,28,81,110,134,102,22,167,62,218,113,194,44,111,222,44,148,211,185,73,9,4,129,240,177,184,230,149,163,13,73,123,27,177,46,30,67,210,62,72,251,110,89,45,233,219,246,195,81,103,145,166,204,176,169,31,116,12,206,122,102,185,97,148,222,5,6,241,0,0,0,0,0,0,0,0,8,0,0,0,4,0,4,0,8,0,4,0,2,0,0,0,4,0,5,0,16,0,8,0,2,0,0,0,4,0,6,0,32,0,32,0,2,0,0,0,4,0,4,0,16,0,16,0,6,0,0,0,8,0,16,0,32,0,32,0,6,0,0,0,8,0,16,0,128,0,128,0,6,0,0,0,8,0,32,0,128,0,0,1,6,0,0,0,32,0,128,0,2,1,0,4,6,0,0,0,32,0,2,1,2,1,0,16,6,0,0,0,16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,80,0,0,0,96,0,0,0,112,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,98,117,102,102,101,114,32,101,114,114,111,114,0,0,0,0,105,110,115,117,102,102,105,99,105,101,110,116,32,109,101,109,111,114,121,0,115,116,114,101,97,109,32,101,114,114,111,114,0,0,0,0,101,114,114,111,114,58,32,37,100,92,110,0,115,116,114,99,109,112,40,98,117,102,102,101,114,44,32,98,117,102,102,101,114,51,41,32,61,61,32,48,0,0,0,0,100,101,99,111,109,112,114,101,115,115,101,100,83,105,122,101,32,61,61,32,115,105,122,101,0,0,0,0,47,116,109,112,47,101,109,115,99,114,105,112,116,101,110,95,116,101,109,112,47,122,108,105,98,46,99,0,115,105,122,101,115,58,32,37,100,44,37,100,10,0,0,0,0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,100,111,105,116,0,0,0,0])
, "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
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
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
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
  function _llvm_bswap_i32(x) {
      return ((x&0xff)<<24) | (((x>>8)&0xff)<<16) | (((x>>16)&0xff)<<8) | (x>>>24);
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
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
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var Math_min = Math.min;
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module.dynCall_iiii(index,a1,a2,a3);
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
function invoke_v(index) {
  try {
    Module.dynCall_v(index);
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
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=+env.NaN;var n=+env.Infinity;var o=0;var p=0;var q=0;var r=0;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=env.abort;var $=env.assert;var aa=env.asmPrintInt;var ab=env.asmPrintFloat;var ac=env.copyTempDouble;var ad=env.copyTempFloat;var ae=env.min;var af=env.invoke_iiii;var ag=env.invoke_vi;var ah=env.invoke_vii;var ai=env.invoke_ii;var aj=env.invoke_v;var ak=env.invoke_iii;var al=env._strncmp;var am=env._llvm_lifetime_end;var an=env._sysconf;var ao=env._abort;var ap=env._fprintf;var aq=env._printf;var ar=env.__reallyNegative;var as=env._fputc;var at=env._puts;var au=env.___setErrNo;var av=env._fwrite;var aw=env._write;var ax=env._fputs;var ay=env.__formatString;var az=env._free;var aA=env.___assert_func;var aB=env._pwrite;var aC=env._sbrk;var aD=env.___errno_location;var aE=env._llvm_lifetime_start;var aF=env._llvm_bswap_i32;var aG=env._time;var aH=env._strcmp;
// EMSCRIPTEN_START_FUNCS
function aO(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function aP(){return i|0}function aQ(a){a=a|0;i=a}function aR(a,b){a=a|0;b=b|0;if((o|0)==0){o=a;p=b}}function aS(a){a=a|0;B=a}function aT(a){a=a|0;C=a}function aU(a){a=a|0;D=a}function aV(a){a=a|0;E=a}function aW(a){a=a|0;F=a}function aX(a){a=a|0;G=a}function aY(a){a=a|0;H=a}function aZ(a){a=a|0;I=a}function a_(a){a=a|0;J=a}function a$(a){a=a|0;K=a}function a0(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aB=0,aC=0,aD=0,aE=0,aG=0,aJ=0,aL=0,aM=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a3=0,a4=0,a5=0,a7=0,ba=0,bb=0,bc=0,bj=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0,cL=0,cM=0,cN=0,cO=0,cP=0,cQ=0,cR=0,cS=0,cT=0,cU=0,cV=0,cW=0,cX=0,cY=0,cZ=0,c_=0,c$=0,c0=0,c1=0,c2=0,c3=0,c4=0,c5=0,c6=0,c7=0,c8=0,c9=0,da=0,db=0,dc=0,dd=0,de=0,df=0,dg=0,dh=0,di=0,dj=0,dk=0,dl=0,dm=0,dn=0,dp=0,dq=0,dr=0,ds=0,dt=0,du=0,dv=0,dw=0,dx=0,dy=0,dz=0,dA=0,dB=0,dC=0,dD=0,dE=0,dF=0,dG=0,dH=0,dI=0,dJ=0,dK=0,dL=0,dM=0,dN=0,dO=0,dP=0,dQ=0,dR=0,dS=0,dT=0,dU=0,dV=0,dW=0,dX=0,dY=0,dZ=0,d_=0,d$=0,d0=0,d1=0,d2=0,d3=0,d4=0,d5=0,d6=0,d7=0,d8=0,d9=0,ea=0,eb=0,ec=0,ed=0,ee=0,ef=0,eg=0,eh=0,ei=0,ej=0,ek=0,el=0,em=0,en=0,eo=0,ep=0,eq=0,er=0,es=0,et=0,eu=0,ev=0,ew=0,ex=0,ey=0,ez=0,eA=0,eB=0,eC=0,eD=0,eE=0,eF=0,eG=0,eH=0,eI=0,eJ=0,eK=0,eL=0,eM=0,eN=0,eO=0,eP=0,eQ=0,eR=0,eS=0,eT=0,eU=0,eV=0,eW=0,eX=0,eY=0,eZ=0,e_=0,e$=0,e0=0,e1=0,e2=0,e3=0,e4=0,e5=0,e6=0,e7=0,e8=0,e9=0,fa=0,fb=0,fc=0,fd=0,fe=0,ff=0,fg=0,fh=0,fi=0,fj=0,fk=0,fl=0,fm=0,fn=0,fo=0,fp=0,fq=0,fr=0,fs=0,ft=0,fu=0,fv=0,fw=0,fx=0,fy=0,fz=0,fA=0,fB=0,fC=0,fD=0,fE=0,fF=0,fG=0,fH=0,fI=0,fJ=0,fK=0,fL=0,fM=0,fN=0,fO=0,fP=0,fQ=0,fR=0,fS=0,fT=0,fU=0,fV=0,fW=0,fX=0,fY=0,fZ=0,f_=0,f$=0,f0=0,f1=0,f2=0,f3=0,f4=0,f5=0,f6=0,f7=0,f8=0,f9=0,ga=0,gb=0,gc=0,gd=0,ge=0,gf=0,gg=0,gh=0,gi=0,gj=0,gk=0,gl=0,gm=0,gn=0,go=0,gp=0,gq=0,gr=0,gs=0,gt=0,gu=0,gv=0,gw=0,gx=0,gy=0,gz=0,gA=0,gB=0,gC=0,gD=0,gE=0,gF=0,gG=0,gH=0,gI=0,gJ=0,gK=0,gL=0,gM=0,gN=0,gO=0,gP=0,gQ=0,gR=0,gS=0,gT=0,gU=0,gV=0,gW=0,gX=0,gY=0,gZ=0,g_=0,g$=0,g0=0,g1=0,g2=0,g3=0,g4=0,g5=0,g6=0;h=i;i=i+60|0;j=h|0;k=h+4|0;l=c[1311757]|0;if((l|0)==0){m=bi(100043)|0;c[1311757]=m;n=m}else{n=l}if((c[1311756]|0)==0){c[1311756]=bi(1e5)|0;o=c[1311757]|0}else{o=n}n=k|0;c[n>>2]=f;l=k+4|0;c[l>>2]=1e5;m=k+12|0;c[m>>2]=o;o=k+16|0;c[o>>2]=100043;p=k+32|0;c[p>>2]=0;q=k+36|0;c[q>>2]=0;r=k+40|0;c[r>>2]=0;t=k+24|0;c[t>>2]=0;c[p>>2]=4;c[r>>2]=0;c[q>>2]=10;u=bd(0,1,5828)|0;L7:do{if((u|0)==0){v=100043}else{w=k+28|0;c[w>>2]=u;c[u>>2]=k;c[u+24>>2]=1;c[u+28>>2]=0;c[u+48>>2]=15;x=u+44|0;c[x>>2]=32768;c[u+52>>2]=32767;c[u+80>>2]=15;y=u+76|0;c[y>>2]=32768;c[u+84>>2]=32767;c[u+88>>2]=5;z=u+56|0;c[z>>2]=aI[c[p>>2]&15](c[r>>2]|0,32768,2)|0;A=aI[c[p>>2]&15](c[r>>2]|0,c[x>>2]|0,2)|0;B=u+64|0;c[B>>2]=A;bk(A|0,0,c[x>>2]<<1|0);x=u+68|0;c[x>>2]=aI[c[p>>2]&15](c[r>>2]|0,c[y>>2]|0,2)|0;c[u+5824>>2]=0;y=u+5788|0;c[y>>2]=16384;A=aI[c[p>>2]&15](c[r>>2]|0,16384,4)|0;C=A;c[u+8>>2]=A;D=c[y>>2]|0;c[u+12>>2]=D<<2;do{if((c[z>>2]|0)!=0){if((c[B>>2]|0)==0){break}if((c[x>>2]|0)==0|(A|0)==0){break}c[u+5796>>2]=C+(D>>>1<<1)|0;c[u+5784>>2]=A+(D*3&-1)|0;c[u+132>>2]=6;c[u+136>>2]=0;a[u+36|0]=8;y=c[w>>2]|0;if((y|0)==0){v=100043;break L7}if((c[p>>2]|0)==0){v=100043;break L7}if((c[q>>2]|0)==0){v=100043;break L7}E=k+20|0;c[E>>2]=0;F=k+8|0;c[F>>2]=0;c[t>>2]=0;c[k+44>>2]=2;c[y+20>>2]=0;c[y+16>>2]=c[y+8>>2]|0;G=y+24|0;H=c[G>>2]|0;if((H|0)<0){I=-H|0;c[G>>2]=I;J=I}else{J=H}c[y+4>>2]=(J|0)!=0?42:113;H=k+48|0;c[H>>2]=(J|0)!=2&1;c[y+40>>2]=0;c[y+2840>>2]=y+148|0;c[y+2848>>2]=5244036;c[y+2852>>2]=y+2440|0;c[y+2860>>2]=5244176;c[y+2864>>2]=y+2684|0;c[y+2872>>2]=5244196;b[y+5816>>1]=0;c[y+5820>>2]=0;c[y+5812>>2]=8;a6(y);c[y+60>>2]=c[y+44>>2]<<1;I=y+76|0;G=y+68|0;b[(c[G>>2]|0)+((c[I>>2]|0)-1<<1)>>1]=0;bk(c[G>>2]|0,0,(c[I>>2]<<1)-2|0);I=c[y+132>>2]|0;c[y+128>>2]=e[5255226+(I*12&-1)>>1]|0;c[y+140>>2]=e[5255224+(I*12&-1)>>1]|0;c[y+144>>2]=e[5255228+(I*12&-1)>>1]|0;c[y+124>>2]=e[5255230+(I*12&-1)>>1]|0;c[y+108>>2]=0;c[y+92>>2]=0;c[y+116>>2]=0;c[y+120>>2]=2;c[y+96>>2]=2;c[y+112>>2]=0;c[y+104>>2]=0;c[y+72>>2]=0;y=c[w>>2]|0;I=y;if((y|0)==0){v=100043;break L7}L20:do{if((c[m>>2]|0)==0){K=30}else{if((c[n>>2]|0)==0){if((c[l>>2]|0)!=0){K=30;break}}G=y+4|0;L=c[G>>2]|0;if((c[o>>2]|0)==0){c[t>>2]=5255600;break}M=y;c[y>>2]=k;N=y+40|0;c[N>>2]=4;do{if((L|0)==42){if((c[y+24>>2]|0)!=2){O=(c[y+48>>2]<<12)-30720|0;do{if((c[y+136>>2]|0)>1){P=0}else{Q=c[y+132>>2]|0;if((Q|0)<2){P=0;break}if((Q|0)<6){P=64;break}P=(Q|0)==6?128:192}}while(0);Q=P|O;R=y+108|0;S=(c[R>>2]|0)==0?Q:Q|32;Q=(S|(S>>>0)%31)^31;c[G>>2]=113;S=y+20|0;T=c[S>>2]|0;c[S>>2]=T+1|0;U=y+8|0;a[(c[U>>2]|0)+T|0]=Q>>>8&255;T=c[S>>2]|0;c[S>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=Q&255;if((c[R>>2]|0)!=0){R=c[H>>2]|0;Q=c[S>>2]|0;c[S>>2]=Q+1|0;a[(c[U>>2]|0)+Q|0]=R>>>24&255;Q=c[S>>2]|0;c[S>>2]=Q+1|0;a[(c[U>>2]|0)+Q|0]=R>>>16&255;R=c[H>>2]|0;Q=c[S>>2]|0;c[S>>2]=Q+1|0;a[(c[U>>2]|0)+Q|0]=R>>>8&255;Q=c[S>>2]|0;c[S>>2]=Q+1|0;a[(c[U>>2]|0)+Q|0]=R&255}c[H>>2]=1;V=c[G>>2]|0;K=54;break}c[H>>2]=0;R=y+20|0;Q=c[R>>2]|0;c[R>>2]=Q+1|0;U=y+8|0;a[(c[U>>2]|0)+Q|0]=31;Q=c[R>>2]|0;c[R>>2]=Q+1|0;a[(c[U>>2]|0)+Q|0]=-117;Q=c[R>>2]|0;c[R>>2]=Q+1|0;a[(c[U>>2]|0)+Q|0]=8;Q=y+28|0;S=c[Q>>2]|0;if((S|0)==0){T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=0;T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=0;T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=0;T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=0;T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=0;T=c[y+132>>2]|0;do{if((T|0)==9){W=2}else{if((c[y+136>>2]|0)>1){W=4;break}W=(T|0)<2?4:0}}while(0);T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=W;T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=3;c[G>>2]=113;break}T=((c[S+44>>2]|0)!=0?2:0)|(c[S>>2]|0)!=0&1|((c[S+16>>2]|0)==0?0:4)|((c[S+28>>2]|0)==0?0:8)|((c[S+36>>2]|0)==0?0:16);O=c[R>>2]|0;c[R>>2]=O+1|0;a[(c[U>>2]|0)+O|0]=T;T=c[(c[Q>>2]|0)+4>>2]&255;O=c[R>>2]|0;c[R>>2]=O+1|0;a[(c[U>>2]|0)+O|0]=T;T=(c[(c[Q>>2]|0)+4>>2]|0)>>>8&255;O=c[R>>2]|0;c[R>>2]=O+1|0;a[(c[U>>2]|0)+O|0]=T;T=(c[(c[Q>>2]|0)+4>>2]|0)>>>16&255;O=c[R>>2]|0;c[R>>2]=O+1|0;a[(c[U>>2]|0)+O|0]=T;T=(c[(c[Q>>2]|0)+4>>2]|0)>>>24&255;O=c[R>>2]|0;c[R>>2]=O+1|0;a[(c[U>>2]|0)+O|0]=T;T=c[y+132>>2]|0;do{if((T|0)==9){X=2}else{if((c[y+136>>2]|0)>1){X=4;break}X=(T|0)<2?4:0}}while(0);T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=X;T=c[(c[Q>>2]|0)+12>>2]&255;S=c[R>>2]|0;c[R>>2]=S+1|0;a[(c[U>>2]|0)+S|0]=T;T=c[Q>>2]|0;if((c[T+16>>2]|0)==0){Y=T}else{S=c[T+20>>2]&255;T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=S;S=(c[(c[Q>>2]|0)+20>>2]|0)>>>8&255;T=c[R>>2]|0;c[R>>2]=T+1|0;a[(c[U>>2]|0)+T|0]=S;Y=c[Q>>2]|0}if((c[Y+44>>2]|0)!=0){c[H>>2]=bg(c[H>>2]|0,c[U>>2]|0,c[R>>2]|0)|0}c[y+32>>2]=0;c[G>>2]=69;Z=Q;K=56;break}else{V=L;K=54}}while(0);do{if((K|0)==54){if((V|0)!=69){_=V;K=77;break}Z=y+28|0;K=56;break}}while(0);do{if((K|0)==56){L=c[Z>>2]|0;if((c[L+16>>2]|0)==0){c[G>>2]=73;$=L;K=79;break}S=y+20|0;T=c[S>>2]|0;O=y+32|0;aa=c[O>>2]|0;L66:do{if(aa>>>0<(c[L+20>>2]&65535)>>>0){ab=y+12|0;ac=y+8|0;ad=T;ae=L;af=T;ag=aa;while(1){if((af|0)==(c[ab>>2]|0)){if((c[ae+44>>2]|0)!=0&af>>>0>ad>>>0){c[H>>2]=bg(c[H>>2]|0,(c[ac>>2]|0)+ad|0,af-ad|0)|0}ah=c[w>>2]|0;ai=c[ah+20>>2]|0;aj=c[o>>2]|0;ak=ai>>>0>aj>>>0?aj:ai;do{if((ak|0)!=0){bl(c[m>>2]|0,c[ah+16>>2]|0,ak|0);c[m>>2]=(c[m>>2]|0)+ak|0;ai=(c[w>>2]|0)+16|0;c[ai>>2]=(c[ai>>2]|0)+ak|0;c[E>>2]=(c[E>>2]|0)+ak|0;c[o>>2]=(c[o>>2]|0)-ak|0;ai=(c[w>>2]|0)+20|0;c[ai>>2]=(c[ai>>2]|0)-ak|0;ai=c[w>>2]|0;if((c[ai+20>>2]|0)!=0){break}c[ai+16>>2]=c[ai+8>>2]|0}}while(0);al=c[S>>2]|0;if((al|0)==(c[ab>>2]|0)){break}am=al;an=al;ao=c[O>>2]|0;ap=c[Z>>2]|0}else{am=ad;an=af;ao=ag;ap=ae}ak=a[(c[ap+16>>2]|0)+ao|0]|0;c[S>>2]=an+1|0;a[(c[ac>>2]|0)+an|0]=ak;ak=(c[O>>2]|0)+1|0;c[O>>2]=ak;ah=c[Z>>2]|0;if(ak>>>0>=(c[ah+20>>2]&65535)>>>0){ar=am;as=ah;break L66}ad=am;ae=ah;af=c[S>>2]|0;ag=ak}ar=al;as=c[Z>>2]|0}else{ar=T;as=L}}while(0);do{if((c[as+44>>2]|0)==0){at=as}else{L=c[S>>2]|0;if(L>>>0<=ar>>>0){at=as;break}c[H>>2]=bg(c[H>>2]|0,(c[y+8>>2]|0)+ar|0,L-ar|0)|0;at=c[Z>>2]|0}}while(0);if((c[O>>2]|0)==(c[at+20>>2]|0)){c[O>>2]=0;c[G>>2]=73;$=at;K=79;break}else{_=c[G>>2]|0;K=77;break}}}while(0);do{if((K|0)==77){if((_|0)!=73){au=_;K=97;break}$=c[y+28>>2]|0;K=79;break}}while(0);do{if((K|0)==79){S=y+28|0;if((c[$+28>>2]|0)==0){c[G>>2]=91;av=S;K=99;break}L=y+20|0;T=c[L>>2]|0;aa=y+12|0;Q=y+8|0;R=y+32|0;U=T;ag=T;while(1){if((ag|0)==(c[aa>>2]|0)){if((c[(c[S>>2]|0)+44>>2]|0)!=0&ag>>>0>U>>>0){c[H>>2]=bg(c[H>>2]|0,(c[Q>>2]|0)+U|0,ag-U|0)|0}T=c[w>>2]|0;af=c[T+20>>2]|0;ae=c[o>>2]|0;ad=af>>>0>ae>>>0?ae:af;do{if((ad|0)!=0){bl(c[m>>2]|0,c[T+16>>2]|0,ad|0);c[m>>2]=(c[m>>2]|0)+ad|0;af=(c[w>>2]|0)+16|0;c[af>>2]=(c[af>>2]|0)+ad|0;c[E>>2]=(c[E>>2]|0)+ad|0;c[o>>2]=(c[o>>2]|0)-ad|0;af=(c[w>>2]|0)+20|0;c[af>>2]=(c[af>>2]|0)-ad|0;af=c[w>>2]|0;if((c[af+20>>2]|0)!=0){break}c[af+16>>2]=c[af+8>>2]|0}}while(0);ad=c[L>>2]|0;if((ad|0)==(c[aa>>2]|0)){aw=1;ax=ad;break}else{ay=ad;az=ad}}else{ay=U;az=ag}ad=c[R>>2]|0;c[R>>2]=ad+1|0;T=a[(c[(c[S>>2]|0)+28>>2]|0)+ad|0]|0;c[L>>2]=az+1|0;a[(c[Q>>2]|0)+az|0]=T;if(T<<24>>24==0){aw=0;ax=ay;break}U=ay;ag=c[L>>2]|0}do{if((c[(c[S>>2]|0)+44>>2]|0)!=0){ag=c[L>>2]|0;if(ag>>>0<=ax>>>0){break}c[H>>2]=bg(c[H>>2]|0,(c[Q>>2]|0)+ax|0,ag-ax|0)|0}}while(0);if((aw|0)==0){c[R>>2]=0;c[G>>2]=91;av=S;K=99;break}else{au=c[G>>2]|0;K=97;break}}}while(0);do{if((K|0)==97){if((au|0)!=91){aB=au;K=117;break}av=y+28|0;K=99;break}}while(0);do{if((K|0)==99){if((c[(c[av>>2]|0)+36>>2]|0)==0){c[G>>2]=103;aC=av;K=119;break}Q=y+20|0;L=c[Q>>2]|0;ag=y+12|0;U=y+8|0;aa=y+32|0;O=L;T=L;while(1){if((T|0)==(c[ag>>2]|0)){if((c[(c[av>>2]|0)+44>>2]|0)!=0&T>>>0>O>>>0){c[H>>2]=bg(c[H>>2]|0,(c[U>>2]|0)+O|0,T-O|0)|0}L=c[w>>2]|0;ad=c[L+20>>2]|0;af=c[o>>2]|0;ae=ad>>>0>af>>>0?af:ad;do{if((ae|0)!=0){bl(c[m>>2]|0,c[L+16>>2]|0,ae|0);c[m>>2]=(c[m>>2]|0)+ae|0;ad=(c[w>>2]|0)+16|0;c[ad>>2]=(c[ad>>2]|0)+ae|0;c[E>>2]=(c[E>>2]|0)+ae|0;c[o>>2]=(c[o>>2]|0)-ae|0;ad=(c[w>>2]|0)+20|0;c[ad>>2]=(c[ad>>2]|0)-ae|0;ad=c[w>>2]|0;if((c[ad+20>>2]|0)!=0){break}c[ad+16>>2]=c[ad+8>>2]|0}}while(0);ae=c[Q>>2]|0;if((ae|0)==(c[ag>>2]|0)){aD=1;aE=ae;break}else{aG=ae;aJ=ae}}else{aG=O;aJ=T}ae=c[aa>>2]|0;c[aa>>2]=ae+1|0;L=a[(c[(c[av>>2]|0)+36>>2]|0)+ae|0]|0;c[Q>>2]=aJ+1|0;a[(c[U>>2]|0)+aJ|0]=L;if(L<<24>>24==0){aD=0;aE=aG;break}O=aG;T=c[Q>>2]|0}do{if((c[(c[av>>2]|0)+44>>2]|0)!=0){T=c[Q>>2]|0;if(T>>>0<=aE>>>0){break}c[H>>2]=bg(c[H>>2]|0,(c[U>>2]|0)+aE|0,T-aE|0)|0}}while(0);if((aD|0)==0){c[G>>2]=103;aC=av;K=119;break}else{aB=c[G>>2]|0;K=117;break}}}while(0);do{if((K|0)==117){if((aB|0)!=103){break}aC=y+28|0;K=119;break}}while(0);do{if((K|0)==119){if((c[(c[aC>>2]|0)+44>>2]|0)==0){c[G>>2]=113;break}U=y+20|0;Q=y+12|0;do{if(((c[U>>2]|0)+2|0)>>>0>(c[Q>>2]|0)>>>0){T=c[w>>2]|0;O=c[T+20>>2]|0;aa=c[o>>2]|0;ag=O>>>0>aa>>>0?aa:O;if((ag|0)==0){break}bl(c[m>>2]|0,c[T+16>>2]|0,ag|0);c[m>>2]=(c[m>>2]|0)+ag|0;T=(c[w>>2]|0)+16|0;c[T>>2]=(c[T>>2]|0)+ag|0;c[E>>2]=(c[E>>2]|0)+ag|0;c[o>>2]=(c[o>>2]|0)-ag|0;T=(c[w>>2]|0)+20|0;c[T>>2]=(c[T>>2]|0)-ag|0;ag=c[w>>2]|0;if((c[ag+20>>2]|0)!=0){break}c[ag+16>>2]=c[ag+8>>2]|0}}while(0);ag=c[U>>2]|0;if((ag+2|0)>>>0>(c[Q>>2]|0)>>>0){break}T=c[H>>2]&255;c[U>>2]=ag+1|0;O=y+8|0;a[(c[O>>2]|0)+ag|0]=T;T=(c[H>>2]|0)>>>8&255;ag=c[U>>2]|0;c[U>>2]=ag+1|0;a[(c[O>>2]|0)+ag|0]=T;c[H>>2]=0;c[G>>2]=113}}while(0);T=y+20|0;do{if((c[T>>2]|0)==0){ag=c[l>>2]|0;aL=(ag|0)==0?0:ag}else{ag=c[w>>2]|0;O=c[ag+20>>2]|0;aa=c[o>>2]|0;S=O>>>0>aa>>>0?aa:O;if((S|0)==0){aM=aa}else{bl(c[m>>2]|0,c[ag+16>>2]|0,S|0);c[m>>2]=(c[m>>2]|0)+S|0;ag=(c[w>>2]|0)+16|0;c[ag>>2]=(c[ag>>2]|0)+S|0;c[E>>2]=(c[E>>2]|0)+S|0;c[o>>2]=(c[o>>2]|0)-S|0;ag=(c[w>>2]|0)+20|0;c[ag>>2]=(c[ag>>2]|0)-S|0;S=c[w>>2]|0;if((c[S+20>>2]|0)==0){c[S+16>>2]=c[S+8>>2]|0}aM=c[o>>2]|0}if((aM|0)==0){c[N>>2]=-1;break L20}else{aL=c[l>>2]|0;break}}}while(0);S=(c[G>>2]|0)==666;ag=(aL|0)==0;do{if(S){if(ag){K=140;break}c[t>>2]=5255600;break L20}else{if(ag){K=140;break}else{K=141;break}}}while(0);do{if((K|0)==140){if((c[y+116>>2]|0)==0^1|S^1){K=141;break}else{break}}}while(0);L183:do{if((K|0)==141){S=c[y+136>>2]|0;L185:do{if((S|0)==2){ag=y+116|0;aa=y+96|0;O=y+108|0;R=y+56|0;L=y+5792|0;ae=y+5796|0;ad=y+5784|0;af=y+5788|0;ac=y+92|0;ab=y;while(1){if((c[ag>>2]|0)==0){a2(I);if((c[ag>>2]|0)==0){break}}c[aa>>2]=0;ak=a[(c[R>>2]|0)+(c[O>>2]|0)|0]|0;b[(c[ae>>2]|0)+(c[L>>2]<<1)>>1]=0;ah=c[L>>2]|0;c[L>>2]=ah+1|0;a[(c[ad>>2]|0)+ah|0]=ak;ah=I+148+((ak&255)<<2)|0;b[ah>>1]=(b[ah>>1]|0)+1&65535;ah=(c[L>>2]|0)==((c[af>>2]|0)-1|0);c[ag>>2]=(c[ag>>2]|0)-1|0;ak=(c[O>>2]|0)+1|0;c[O>>2]=ak;if(!ah){continue}ah=c[ac>>2]|0;if((ah|0)>-1){aO=(c[R>>2]|0)+ah|0}else{aO=0}a9(ab,aO,ak-ah|0,0);c[ac>>2]=c[O>>2]|0;ah=c[M>>2]|0;ak=ah+28|0;ai=c[ak>>2]|0;aj=c[ai+20>>2]|0;aP=ah+16|0;aQ=c[aP>>2]|0;aR=aj>>>0>aQ>>>0?aQ:aj;do{if((aR|0)!=0){aj=ah+12|0;bl(c[aj>>2]|0,c[ai+16>>2]|0,aR|0);c[aj>>2]=(c[aj>>2]|0)+aR|0;aj=(c[ak>>2]|0)+16|0;c[aj>>2]=(c[aj>>2]|0)+aR|0;aj=ah+20|0;c[aj>>2]=(c[aj>>2]|0)+aR|0;c[aP>>2]=(c[aP>>2]|0)-aR|0;aj=(c[ak>>2]|0)+20|0;c[aj>>2]=(c[aj>>2]|0)-aR|0;aj=c[ak>>2]|0;if((c[aj+20>>2]|0)!=0){break}c[aj+16>>2]=c[aj+8>>2]|0}}while(0);if((c[(c[M>>2]|0)+16>>2]|0)==0){break L185}}ag=c[ac>>2]|0;if((ag|0)>-1){aS=(c[R>>2]|0)+ag|0}else{aS=0}a9(ab,aS,(c[O>>2]|0)-ag|0,1);c[ac>>2]=c[O>>2]|0;ag=c[M>>2]|0;af=ag+28|0;L=c[af>>2]|0;ad=c[L+20>>2]|0;ae=ag+16|0;aa=c[ae>>2]|0;ak=ad>>>0>aa>>>0?aa:ad;do{if((ak|0)!=0){ad=ag+12|0;bl(c[ad>>2]|0,c[L+16>>2]|0,ak|0);c[ad>>2]=(c[ad>>2]|0)+ak|0;ad=(c[af>>2]|0)+16|0;c[ad>>2]=(c[ad>>2]|0)+ak|0;ad=ag+20|0;c[ad>>2]=(c[ad>>2]|0)+ak|0;c[ae>>2]=(c[ae>>2]|0)-ak|0;ad=(c[af>>2]|0)+20|0;c[ad>>2]=(c[ad>>2]|0)-ak|0;ad=c[af>>2]|0;if((c[ad+20>>2]|0)!=0){break}c[ad+16>>2]=c[ad+8>>2]|0}}while(0);aT=(c[(c[M>>2]|0)+16>>2]|0)==0?2:3;K=194;break}else if((S|0)==3){af=y+116|0;ak=y+96|0;ae=y+108|0;ag=y+5792|0;L=y+5796|0;O=y+5784|0;ac=y+2440|0;ab=y+5788|0;R=y+56|0;ad=y+92|0;aa=y;L209:while(1){aR=c[af>>2]|0;do{if(aR>>>0<258){a2(I);aP=c[af>>2]|0;if((aP|0)==0){break L209}c[ak>>2]=0;if(aP>>>0>2){aU=aP;K=164;break}aV=c[ae>>2]|0;K=179;break}else{c[ak>>2]=0;aU=aR;K=164;break}}while(0);do{if((K|0)==164){K=0;aR=c[ae>>2]|0;if((aR|0)==0){aV=0;K=179;break}aP=c[R>>2]|0;ah=a[aP+(aR-1|0)|0]|0;if(ah<<24>>24!=(a[aP+aR|0]|0)){aV=aR;K=179;break}if(ah<<24>>24!=(a[aP+(aR+1|0)|0]|0)){aV=aR;K=179;break}ai=aP+(aR+2|0)|0;if(ah<<24>>24!=(a[ai]|0)){aV=aR;K=179;break}aj=aP+(aR+258|0)|0;aP=ai;while(1){ai=aP+1|0;if(ah<<24>>24!=(a[ai]|0)){aW=ai;break}ai=aP+2|0;if(ah<<24>>24!=(a[ai]|0)){aW=ai;break}ai=aP+3|0;if(ah<<24>>24!=(a[ai]|0)){aW=ai;break}ai=aP+4|0;if(ah<<24>>24!=(a[ai]|0)){aW=ai;break}ai=aP+5|0;if(ah<<24>>24!=(a[ai]|0)){aW=ai;break}ai=aP+6|0;if(ah<<24>>24!=(a[ai]|0)){aW=ai;break}ai=aP+7|0;if(ah<<24>>24!=(a[ai]|0)){aW=ai;break}ai=aP+8|0;if(ah<<24>>24==(a[ai]|0)&ai>>>0<aj>>>0){aP=ai}else{aW=ai;break}}aP=(aW-aj|0)+258|0;ah=aP>>>0>aU>>>0?aU:aP;c[ak>>2]=ah;if(ah>>>0<=2){aV=aR;K=179;break}aP=ah+253|0;b[(c[L>>2]|0)+(c[ag>>2]<<1)>>1]=1;ah=c[ag>>2]|0;c[ag>>2]=ah+1|0;a[(c[O>>2]|0)+ah|0]=aP&255;ah=I+148+((d[5255768+(aP&255)|0]|0|256)+1<<2)|0;b[ah>>1]=(b[ah>>1]|0)+1&65535;b[ac>>1]=(b[ac>>1]|0)+1&65535;ah=(c[ag>>2]|0)==((c[ab>>2]|0)-1|0)&1;aP=c[ak>>2]|0;c[af>>2]=(c[af>>2]|0)-aP|0;ai=(c[ae>>2]|0)+aP|0;c[ae>>2]=ai;c[ak>>2]=0;aX=ah;aY=ai;break}}while(0);if((K|0)==179){K=0;ai=a[(c[R>>2]|0)+aV|0]|0;b[(c[L>>2]|0)+(c[ag>>2]<<1)>>1]=0;ah=c[ag>>2]|0;c[ag>>2]=ah+1|0;a[(c[O>>2]|0)+ah|0]=ai;ah=I+148+((ai&255)<<2)|0;b[ah>>1]=(b[ah>>1]|0)+1&65535;ah=(c[ag>>2]|0)==((c[ab>>2]|0)-1|0)&1;c[af>>2]=(c[af>>2]|0)-1|0;ai=(c[ae>>2]|0)+1|0;c[ae>>2]=ai;aX=ah;aY=ai}if((aX|0)==0){continue}ai=c[ad>>2]|0;if((ai|0)>-1){aZ=(c[R>>2]|0)+ai|0}else{aZ=0}a9(aa,aZ,aY-ai|0,0);c[ad>>2]=c[ae>>2]|0;ai=c[M>>2]|0;ah=ai+28|0;aP=c[ah>>2]|0;aQ=c[aP+20>>2]|0;a_=ai+16|0;a$=c[a_>>2]|0;a0=aQ>>>0>a$>>>0?a$:aQ;do{if((a0|0)!=0){aQ=ai+12|0;bl(c[aQ>>2]|0,c[aP+16>>2]|0,a0|0);c[aQ>>2]=(c[aQ>>2]|0)+a0|0;aQ=(c[ah>>2]|0)+16|0;c[aQ>>2]=(c[aQ>>2]|0)+a0|0;aQ=ai+20|0;c[aQ>>2]=(c[aQ>>2]|0)+a0|0;c[a_>>2]=(c[a_>>2]|0)-a0|0;aQ=(c[ah>>2]|0)+20|0;c[aQ>>2]=(c[aQ>>2]|0)-a0|0;aQ=c[ah>>2]|0;if((c[aQ+20>>2]|0)!=0){break}c[aQ+16>>2]=c[aQ+8>>2]|0}}while(0);if((c[(c[M>>2]|0)+16>>2]|0)==0){break L185}}af=c[ad>>2]|0;if((af|0)>-1){a1=(c[R>>2]|0)+af|0}else{a1=0}a9(aa,a1,(c[ae>>2]|0)-af|0,1);c[ad>>2]=c[ae>>2]|0;af=c[M>>2]|0;ab=af+28|0;ag=c[ab>>2]|0;O=c[ag+20>>2]|0;L=af+16|0;ak=c[L>>2]|0;ac=O>>>0>ak>>>0?ak:O;do{if((ac|0)!=0){O=af+12|0;bl(c[O>>2]|0,c[ag+16>>2]|0,ac|0);c[O>>2]=(c[O>>2]|0)+ac|0;O=(c[ab>>2]|0)+16|0;c[O>>2]=(c[O>>2]|0)+ac|0;O=af+20|0;c[O>>2]=(c[O>>2]|0)+ac|0;c[L>>2]=(c[L>>2]|0)-ac|0;O=(c[ab>>2]|0)+20|0;c[O>>2]=(c[O>>2]|0)-ac|0;O=c[ab>>2]|0;if((c[O+20>>2]|0)!=0){break}c[O+16>>2]=c[O+8>>2]|0}}while(0);aT=(c[(c[M>>2]|0)+16>>2]|0)==0?2:3;K=194;break}else{ab=aN[c[5255232+((c[y+132>>2]|0)*12&-1)>>2]&15](I,4)|0;if((ab-2|0)>>>0<2){aT=ab;K=194;break}else{a3=ab;K=195;break}}}while(0);do{if((K|0)==194){c[G>>2]=666;a3=aT;K=195;break}}while(0);do{if((K|0)==195){if((a3|0)==2|(a3|0)==0){break}else if((a3|0)!=1){break L183}a8(y,0,0,0);S=c[w>>2]|0;U=c[S+20>>2]|0;Q=c[o>>2]|0;ab=U>>>0>Q>>>0?Q:U;if((ab|0)==0){a4=Q}else{bl(c[m>>2]|0,c[S+16>>2]|0,ab|0);c[m>>2]=(c[m>>2]|0)+ab|0;S=(c[w>>2]|0)+16|0;c[S>>2]=(c[S>>2]|0)+ab|0;c[E>>2]=(c[E>>2]|0)+ab|0;c[o>>2]=(c[o>>2]|0)-ab|0;S=(c[w>>2]|0)+20|0;c[S>>2]=(c[S>>2]|0)-ab|0;ab=c[w>>2]|0;if((c[ab+20>>2]|0)==0){c[ab+16>>2]=c[ab+8>>2]|0}a4=c[o>>2]|0}if((a4|0)!=0){break L183}c[N>>2]=-1;break L20}}while(0);if((c[o>>2]|0)!=0){break L20}c[N>>2]=-1;break L20}}while(0);N=y+24|0;G=c[N>>2]|0;if((G|0)>=1){M=c[H>>2]|0;if((G|0)==2){G=c[T>>2]|0;c[T>>2]=G+1|0;ab=y+8|0;a[(c[ab>>2]|0)+G|0]=M&255;G=(c[H>>2]|0)>>>8&255;S=c[T>>2]|0;c[T>>2]=S+1|0;a[(c[ab>>2]|0)+S|0]=G;G=(c[H>>2]|0)>>>16&255;S=c[T>>2]|0;c[T>>2]=S+1|0;a[(c[ab>>2]|0)+S|0]=G;G=(c[H>>2]|0)>>>24&255;S=c[T>>2]|0;c[T>>2]=S+1|0;a[(c[ab>>2]|0)+S|0]=G;G=c[F>>2]&255;S=c[T>>2]|0;c[T>>2]=S+1|0;a[(c[ab>>2]|0)+S|0]=G;G=(c[F>>2]|0)>>>8&255;S=c[T>>2]|0;c[T>>2]=S+1|0;a[(c[ab>>2]|0)+S|0]=G;G=(c[F>>2]|0)>>>16&255;S=c[T>>2]|0;c[T>>2]=S+1|0;a[(c[ab>>2]|0)+S|0]=G;G=(c[F>>2]|0)>>>24&255;S=c[T>>2]|0;c[T>>2]=S+1|0;a[(c[ab>>2]|0)+S|0]=G}else{G=c[T>>2]|0;c[T>>2]=G+1|0;S=y+8|0;a[(c[S>>2]|0)+G|0]=M>>>24&255;G=c[T>>2]|0;c[T>>2]=G+1|0;a[(c[S>>2]|0)+G|0]=M>>>16&255;M=c[H>>2]|0;G=c[T>>2]|0;c[T>>2]=G+1|0;a[(c[S>>2]|0)+G|0]=M>>>8&255;G=c[T>>2]|0;c[T>>2]=G+1|0;a[(c[S>>2]|0)+G|0]=M&255}M=c[w>>2]|0;G=c[M+20>>2]|0;S=c[o>>2]|0;ab=G>>>0>S>>>0?S:G;do{if((ab|0)!=0){bl(c[m>>2]|0,c[M+16>>2]|0,ab|0);c[m>>2]=(c[m>>2]|0)+ab|0;G=(c[w>>2]|0)+16|0;c[G>>2]=(c[G>>2]|0)+ab|0;c[E>>2]=(c[E>>2]|0)+ab|0;c[o>>2]=(c[o>>2]|0)-ab|0;G=(c[w>>2]|0)+20|0;c[G>>2]=(c[G>>2]|0)-ab|0;G=c[w>>2]|0;if((c[G+20>>2]|0)!=0){break}c[G+16>>2]=c[G+8>>2]|0}}while(0);ab=c[N>>2]|0;if((ab|0)>0){c[N>>2]=-ab|0}if((c[T>>2]|0)!=0){break}}ab=c[E>>2]|0;M=c[w>>2]|0;if((M|0)==0){v=ab;break L7}G=c[M+4>>2]|0;if(!((G|0)==666|(G|0)==113|(G|0)==103|(G|0)==91|(G|0)==73|(G|0)==69|(G|0)==42)){v=ab;break L7}G=c[M+8>>2]|0;if((G|0)==0){a5=M}else{aK[c[q>>2]&15](c[r>>2]|0,G);a5=c[w>>2]|0}G=c[a5+68>>2]|0;if((G|0)==0){a7=a5}else{aK[c[q>>2]&15](c[r>>2]|0,G);a7=c[w>>2]|0}G=c[a7+64>>2]|0;if((G|0)==0){ba=a7}else{aK[c[q>>2]&15](c[r>>2]|0,G);ba=c[w>>2]|0}G=c[ba+56>>2]|0;if((G|0)==0){bb=ba}else{aK[c[q>>2]&15](c[r>>2]|0,G);bb=c[w>>2]|0}aK[c[q>>2]&15](c[r>>2]|0,bb);c[w>>2]=0;v=ab;break L7}}while(0);if((K|0)==30){c[t>>2]=5255636}E=c[w>>2]|0;if((E|0)==0){v=100043;break L7}H=c[E+4>>2]|0;if(!((H|0)==666|(H|0)==113|(H|0)==103|(H|0)==91|(H|0)==73|(H|0)==69|(H|0)==42)){v=100043;break L7}H=c[E+8>>2]|0;if((H|0)==0){bc=E}else{aK[c[q>>2]&15](c[r>>2]|0,H);bc=c[w>>2]|0}H=c[bc+68>>2]|0;if((H|0)==0){bj=bc}else{aK[c[q>>2]&15](c[r>>2]|0,H);bj=c[w>>2]|0}H=c[bj+64>>2]|0;if((H|0)==0){bm=bj}else{aK[c[q>>2]&15](c[r>>2]|0,H);bm=c[w>>2]|0}H=c[bm+56>>2]|0;if((H|0)==0){bn=bm}else{aK[c[q>>2]&15](c[r>>2]|0,H);bn=c[w>>2]|0}aK[c[q>>2]&15](c[r>>2]|0,bn);c[w>>2]=0;v=100043;break L7}}while(0);c[u+4>>2]=666;c[t>>2]=5255616;D=c[w>>2]|0;if((D|0)==0){v=100043;break}A=c[D+4>>2]|0;if(!((A|0)==666|(A|0)==113|(A|0)==103|(A|0)==91|(A|0)==73|(A|0)==69|(A|0)==42)){v=100043;break}A=c[D+8>>2]|0;if((A|0)==0){bo=D}else{aK[c[q>>2]&15](c[r>>2]|0,A);bo=c[w>>2]|0}A=c[bo+68>>2]|0;if((A|0)==0){bp=bo}else{aK[c[q>>2]&15](c[r>>2]|0,A);bp=c[w>>2]|0}A=c[bp+64>>2]|0;if((A|0)==0){bq=bp}else{aK[c[q>>2]&15](c[r>>2]|0,A);bq=c[w>>2]|0}A=c[bq+56>>2]|0;if((A|0)==0){br=bq}else{aK[c[q>>2]&15](c[r>>2]|0,A);br=c[w>>2]|0}aK[c[q>>2]&15](c[r>>2]|0,br);c[w>>2]=0;v=100043}}while(0);br=(g|0)==0;if(br){aq(5255752,(s=i,i=i+8|0,c[s>>2]=1e5,c[s+4>>2]=v,s)|0)}g=c[1311756]|0;r=c[1311757]|0;q=bd(0,1,7116)|0;L332:do{if((q|0)!=0){c[q+52>>2]=0;bq=q+52|0;bp=bq;bo=q+36|0;t=q+8|0;c[t>>2]=1;c[bo>>2]=15;u=q+28|0;c[u>>2]=0;bn=q;c[bn>>2]=0;bm=q+4|0;c[bm>>2]=0;bj=q+12|0;c[bj>>2]=0;bc=q+20|0;c[bc>>2]=32768;c[q+32>>2]=0;bb=q+40|0;c[bb>>2]=0;ba=q+44|0;c[ba>>2]=0;a7=q+48|0;c[a7>>2]=0;a5=q+56|0;c[a5>>2]=0;o=q+60|0;c[o>>2]=0;m=q+1328|0;c[q+108>>2]=m;a4=q+80|0;c[a4>>2]=m;a3=q+76|0;c[a3>>2]=m;aT=q+7104|0;c[aT>>2]=1;a1=q+7108|0;c[a1>>2]=-1;aY=j|0;L334:do{if((g|0)!=0){if(!((r|0)!=0|(v|0)==0)){break}aZ=q+24|0;aX=j+1|0;aV=q+16|0;aU=q+32|0;aW=q+64|0;aS=q+84|0;aO=q+88|0;aL=q+76|0;l=q+72|0;aM=q+7112|0;aC=q+68|0;aB=q+96|0;av=q+100|0;aD=q+92|0;aE=q+104|0;aG=q+108|0;aJ=aG;au=aG;aG=q+112|0;aw=aG;ax=q+752|0;ay=aG;aG=q+624|0;az=q+80|0;$=j+2|0;_=j+3|0;at=0;Z=1e5;ar=0;as=0;al=1e5;am=v;an=g;ao=r;ap=0;V=v;Y=0;L337:while(1){L339:do{if((ap|0)==27){bs=Z;bt=ar;bu=as;bv=am;bw=ao;bx=Y;by=c[t>>2]|0;K=571;break}else if((ap|0)==6){bz=ar;bA=as;bB=am;bC=ao;bD=c[aV>>2]|0;K=318;break}else if((ap|0)==21){bE=at;bF=ar;bG=as;bH=am;bI=ao;bJ=c[l>>2]|0;K=515;break}else if((ap|0)==23){bK=at;bL=ar;bM=as;bN=am;bO=ao;bP=c[l>>2]|0;K=534;break}else if((ap|0)==18){bQ=at;bR=ar;bS=as;bT=am;bU=ao;bV=c[aE>>2]|0;K=396;break}else if((ap|0)==1){L346:do{if(ar>>>0<16){X=ao;W=am;P=as;k=ar;while(1){if((W|0)==0){bW=at;bX=Z;bY=k;bZ=P;b_=al;b$=Y;break L337}n=W-1|0;J=X+1|0;p=((d[X]|0)<<k)+P|0;A=k+8|0;if(A>>>0<16){X=J;W=n;P=p;k=A}else{b0=J;b1=n;b2=p;b3=A;break L346}}}else{b0=ao;b1=am;b2=as;b3=ar}}while(0);c[aV>>2]=b2;if((b2&255|0)!=8){c[bn>>2]=29;b4=at;b5=Z;b6=b3;b7=b2;b8=al;b9=b1;ca=an;cb=b0;cc=V;cd=Y;break}if((b2&57344|0)!=0){c[bn>>2]=29;b4=at;b5=Z;b6=b3;b7=b2;b8=al;b9=b1;ca=an;cb=b0;cc=V;cd=Y;break}k=c[aU>>2]|0;if((k|0)==0){ce=b2}else{c[k>>2]=b2>>>8&1;ce=c[aV>>2]|0}if((ce&512|0)!=0){a[aY]=b2&255;a[aX]=b2>>>8&255;c[aZ>>2]=bg(c[aZ>>2]|0,aY,2)|0}c[bn>>2]=2;cf=b0;cg=b1;ch=0;ci=0;K=282;break}else if((ap|0)==9){L364:do{if(ar>>>0<32){k=ao;P=am;W=as;X=ar;while(1){if((P|0)==0){bW=at;bX=Z;bY=X;bZ=W;b_=al;b$=Y;break L337}A=P-1|0;p=k+1|0;n=((d[k]|0)<<X)+W|0;J=X+8|0;if(J>>>0<32){k=p;P=A;W=n;X=J}else{cj=p;ck=A;cl=n;break L364}}}else{cj=ao;ck=am;cl=as}}while(0);c[aZ>>2]=aF(cl|0)|0;c[bn>>2]=10;cm=0;cn=0;co=ck;cp=cj;K=356;break}else if((ap|0)==16){L370:do{if(ar>>>0<14){X=ao;W=am;P=as;k=ar;while(1){if((W|0)==0){bW=at;bX=Z;bY=k;bZ=P;b_=al;b$=Y;break L337}n=W-1|0;A=X+1|0;p=((d[X]|0)<<k)+P|0;J=k+8|0;if(J>>>0<14){X=A;W=n;P=p;k=J}else{cq=A;cr=n;cs=p;ct=J;break L370}}}else{cq=ao;cr=am;cs=as;ct=ar}}while(0);k=(cs&31)+257|0;c[aB>>2]=k;P=(cs>>>5&31)+1|0;c[av>>2]=P;c[aD>>2]=(cs>>>10&15)+4|0;W=cs>>>14;X=ct-14|0;if(k>>>0>286|P>>>0>30){c[bn>>2]=29;b4=at;b5=Z;b6=X;b7=W;b8=al;b9=cr;ca=an;cb=cq;cc=V;cd=Y;break}else{c[aE>>2]=0;c[bn>>2]=17;cu=cq;cv=cr;cw=W;cx=X;cy=0;K=387;break}}else if((ap|0)==0){X=c[t>>2]|0;if((X|0)==0){c[bn>>2]=12;b4=at;b5=Z;b6=ar;b7=as;b8=al;b9=am;ca=an;cb=ao;cc=V;cd=Y;break}L382:do{if(ar>>>0<16){W=ao;P=am;k=as;J=ar;while(1){if((P|0)==0){bW=at;bX=Z;bY=J;bZ=k;b_=al;b$=Y;break L337}p=P-1|0;n=W+1|0;A=((d[W]|0)<<J)+k|0;D=J+8|0;if(D>>>0<16){W=n;P=p;k=A;J=D}else{cz=n;cA=p;cB=A;cC=D;break L382}}}else{cz=ao;cA=am;cB=as;cC=ar}}while(0);if((X&2|0)!=0&(cB|0)==35615){c[aZ>>2]=0;a[aY]=31;a[aX]=-117;c[aZ>>2]=bg(c[aZ>>2]|0,aY,2)|0;c[bn>>2]=1;b4=at;b5=Z;b6=0;b7=0;b8=al;b9=cA;ca=an;cb=cz;cc=V;cd=Y;break}c[aV>>2]=0;J=c[aU>>2]|0;if((J|0)==0){cD=X}else{c[J+48>>2]=-1;cD=c[t>>2]|0}do{if((cD&1|0)!=0){if(((((cB<<8&65280)+(cB>>>8)|0)>>>0)%31|0)!=0){break}if((cB&15|0)!=8){c[bn>>2]=29;b4=at;b5=Z;b6=cC;b7=cB;b8=al;b9=cA;ca=an;cb=cz;cc=V;cd=Y;break L339}J=cB>>>4;k=cC-4|0;P=(J&15)+8|0;W=c[bo>>2]|0;do{if((W|0)==0){c[bo>>2]=P}else{if(P>>>0<=W>>>0){break}c[bn>>2]=29;b4=at;b5=Z;b6=k;b7=J;b8=al;b9=cA;ca=an;cb=cz;cc=V;cd=Y;break L339}}while(0);c[bc>>2]=1<<P;c[aZ>>2]=1;c[bn>>2]=cB>>>12&2^11;b4=at;b5=Z;b6=0;b7=0;b8=al;b9=cA;ca=an;cb=cz;cc=V;cd=Y;break L339}}while(0);c[bn>>2]=29;b4=at;b5=Z;b6=cC;b7=cB;b8=al;b9=cA;ca=an;cb=cz;cc=V;cd=Y;break}else if((ap|0)==2){if(ar>>>0<32){cf=ao;cg=am;ch=as;ci=ar;K=282;break}else{cE=ao;cF=am;cG=as;K=284;break}}else if((ap|0)==3){if(ar>>>0<16){cH=ao;cI=am;cJ=as;cK=ar;K=290;break}else{cL=ao;cM=am;cN=as;K=292;break}}else if((ap|0)==4){cO=ar;cP=as;cQ=am;cR=ao;K=297}else if((ap|0)==5){cS=ar;cT=as;cU=am;cV=ao;K=308}else if((ap|0)==7){cW=ar;cX=as;cY=am;cZ=ao;K=331}else if((ap|0)==8){c_=ar;c$=as;c0=am;c1=ao;K=344}else if((ap|0)==10){cm=ar;cn=as;co=am;cp=ao;K=356}else if((ap|0)==11|(ap|0)==12){c2=ar;c3=as;c4=am;c5=ao;K=359}else if((ap|0)==13){X=ar&7;J=as>>>(X>>>0);k=ar-X|0;L408:do{if(k>>>0<32){X=ao;W=am;D=J;A=k;while(1){if((W|0)==0){bW=at;bX=Z;bY=A;bZ=D;b_=al;b$=Y;break L337}p=W-1|0;n=X+1|0;C=((d[X]|0)<<A)+D|0;x=A+8|0;if(x>>>0<32){X=n;W=p;D=C;A=x}else{c6=n;c7=p;c8=C;c9=x;break L408}}}else{c6=ao;c7=am;c8=J;c9=k}}while(0);k=c8&65535;if((k|0)==(c8>>>16^65535|0)){c[aW>>2]=k;c[bn>>2]=14;da=0;db=0;dc=c7;dd=c6;K=376;break}else{c[bn>>2]=29;b4=at;b5=Z;b6=c9;b7=c8;b8=al;b9=c7;ca=an;cb=c6;cc=V;cd=Y;break}}else if((ap|0)==14){da=ar;db=as;dc=am;dd=ao;K=376}else if((ap|0)==15){de=ar;df=as;dg=am;dh=ao;K=377}else if((ap|0)==17){k=c[aE>>2]|0;if(k>>>0<(c[aD>>2]|0)>>>0){cu=ao;cv=am;cw=as;cx=ar;cy=k;K=387;break}else{di=ao;dj=am;dk=as;dl=ar;dm=k;K=391;break}}else if((ap|0)==19){dn=at;dp=ar;dq=as;dr=am;ds=ao;K=433}else if((ap|0)==20){dt=at;du=ar;dv=as;dw=am;dx=ao;K=434}else if((ap|0)==22){dy=at;dz=ar;dA=as;dB=am;dC=ao;K=522}else if((ap|0)==24){dD=at;dE=ar;dF=as;dG=am;dH=ao;K=540}else if((ap|0)==25){if((al|0)==0){bW=at;bX=Z;bY=ar;bZ=as;b_=0;b$=Y;break L337}a[an]=c[aW>>2]&255;c[bn>>2]=20;b4=at;b5=Z;b6=ar;b7=as;b8=al-1|0;b9=am;ca=an+1|0;cb=ao;cc=V;cd=Y;break}else if((ap|0)==26){k=c[t>>2]|0;do{if((k|0)==0){dI=Z;dJ=ar;dK=as;dL=am;dM=ao;dN=Y}else{L422:do{if(ar>>>0<32){J=ao;A=am;D=as;W=ar;while(1){if((A|0)==0){bW=at;bX=Z;bY=W;bZ=D;b_=al;b$=Y;break L337}X=A-1|0;P=J+1|0;x=((d[J]|0)<<W)+D|0;C=W+8|0;if(C>>>0<32){J=P;A=X;D=x;W=C}else{dO=P;dP=X;dQ=x;dR=C;break L422}}}else{dO=ao;dP=am;dQ=as;dR=ar}}while(0);W=Z-al|0;D=Y+W|0;c[u>>2]=(c[u>>2]|0)+W|0;A=c[aV>>2]|0;if((Z|0)==(al|0)){dS=A}else{J=c[aZ>>2]|0;C=an+(-W|0)|0;if((A|0)==0){dT=bf(J,C,W)|0}else{dT=bg(J,C,W)|0}c[aZ>>2]=dT;dS=A}if((dS|0)==0){dU=aF(dQ|0)|0}else{dU=dQ}if((dU|0)==(c[aZ>>2]|0)){dI=al;dJ=0;dK=0;dL=dP;dM=dO;dN=D;break}c[bn>>2]=29;b4=at;b5=al;b6=dR;b7=dQ;b8=al;b9=dP;ca=an;cb=dO;cc=V;cd=D;break L339}}while(0);c[bn>>2]=27;bs=dI;bt=dJ;bu=dK;bv=dL;bw=dM;bx=dN;by=k;K=571;break}else if((ap|0)==29){K=579;break L337}else if((ap|0)==28){bW=1;bX=Z;bY=ar;bZ=as;b_=al;b$=Y;break L337}else{break L334}}while(0);L439:do{if((K|0)==282){while(1){K=0;if((cg|0)==0){bW=at;bX=Z;bY=ci;bZ=ch;b_=al;b$=Y;break L337}T=cg-1|0;N=cf+1|0;D=((d[cf]|0)<<ci)+ch|0;A=ci+8|0;if(A>>>0<32){cf=N;cg=T;ch=D;ci=A;K=282}else{cE=N;cF=T;cG=D;K=284;break L439}}}else if((K|0)==356){K=0;if((c[bj>>2]|0)==0){K=357;break L337}c[aZ>>2]=1;c[bn>>2]=11;c2=cm;c3=cn;c4=co;c5=cp;K=359;break}else if((K|0)==376){K=0;c[bn>>2]=15;de=da;df=db;dg=dc;dh=dd;K=377;break}else if((K|0)==387){while(1){K=0;L448:do{if(cx>>>0<3){k=cu;D=cv;T=cw;N=cx;while(1){if((D|0)==0){bW=at;bX=Z;bY=N;bZ=T;b_=al;b$=Y;break L337}A=D-1|0;W=k+1|0;C=((d[k]|0)<<N)+T|0;J=N+8|0;if(J>>>0<3){k=W;D=A;T=C;N=J}else{dV=W;dW=A;dX=C;dY=J;break L448}}}else{dV=cu;dW=cv;dX=cw;dY=cx}}while(0);c[aE>>2]=cy+1|0;b[ay+((e[5244496+(cy<<1)>>1]|0)<<1)>>1]=dX&7;N=dX>>>3;T=dY-3|0;D=c[aE>>2]|0;if(D>>>0<(c[aD>>2]|0)>>>0){cu=dV;cv=dW;cw=N;cx=T;cy=D;K=387}else{di=dV;dj=dW;dk=N;dl=T;dm=D;K=391;break L439}}}else if((K|0)==571){K=0;if((by|0)==0){dZ=bt;d_=bu;K=578;break L337}if((c[aV>>2]|0)==0){dZ=bt;d_=bu;K=578;break L337}L456:do{if(bt>>>0<32){D=bw;T=bv;N=bu;k=bt;while(1){if((T|0)==0){bW=at;bX=bs;bY=k;bZ=N;b_=al;b$=bx;break L337}J=T-1|0;C=D+1|0;A=((d[D]|0)<<k)+N|0;W=k+8|0;if(W>>>0<32){D=C;T=J;N=A;k=W}else{d$=C;d0=J;d1=A;d2=W;break L456}}}else{d$=bw;d0=bv;d1=bu;d2=bt}}while(0);if((d1|0)==(c[u>>2]|0)){dZ=0;d_=0;K=578;break L337}c[bn>>2]=29;b4=at;b5=bs;b6=d2;b7=d1;b8=al;b9=d0;ca=an;cb=d$;cc=V;cd=bx;break}}while(0);do{if((K|0)==284){K=0;k=c[aU>>2]|0;if((k|0)!=0){c[k+4>>2]=cG}if((c[aV>>2]&512|0)!=0){a[aY]=cG&255;a[aX]=cG>>>8&255;a[$]=cG>>>16&255;a[_]=cG>>>24&255;c[aZ>>2]=bg(c[aZ>>2]|0,aY,4)|0}c[bn>>2]=3;cH=cE;cI=cF;cJ=0;cK=0;K=290;break}else if((K|0)==359){K=0;if((c[bm>>2]|0)!=0){k=c2&7;c[bn>>2]=26;b4=at;b5=Z;b6=c2-k|0;b7=c3>>>(k>>>0);b8=al;b9=c4;ca=an;cb=c5;cc=V;cd=Y;break}L474:do{if(c2>>>0<3){k=c5;N=c4;T=c3;D=c2;while(1){if((N|0)==0){bW=at;bX=Z;bY=D;bZ=T;b_=al;b$=Y;break L337}W=N-1|0;A=k+1|0;J=((d[k]|0)<<D)+T|0;C=D+8|0;if(C>>>0<3){k=A;N=W;T=J;D=C}else{d3=A;d4=W;d5=J;d6=C;break L474}}}else{d3=c5;d4=c4;d5=c3;d6=c2}}while(0);c[bm>>2]=d5&1;D=d5>>>1&3;if((D|0)==0){c[bn>>2]=13}else if((D|0)==1){c[a3>>2]=5244536;c[aS>>2]=9;c[a4>>2]=5246584;c[aO>>2]=5;c[bn>>2]=19}else if((D|0)==2){c[bn>>2]=16}else if((D|0)==3){c[bn>>2]=29}b4=at;b5=Z;b6=d6-3|0;b7=d5>>>3;b8=al;b9=d4;ca=an;cb=d3;cc=V;cd=Y;break}else if((K|0)==377){K=0;D=c[aW>>2]|0;if((D|0)==0){c[bn>>2]=11;b4=at;b5=Z;b6=de;b7=df;b8=al;b9=dg;ca=an;cb=dh;cc=V;cd=Y;break}T=D>>>0>dg>>>0?dg:D;D=T>>>0>al>>>0?al:T;if((D|0)==0){bW=at;bX=Z;bY=de;bZ=df;b_=al;b$=Y;break L337}bl(an|0,dh|0,D|0);c[aW>>2]=(c[aW>>2]|0)-D|0;b4=at;b5=Z;b6=de;b7=df;b8=al-D|0;b9=dg-D|0;ca=an+D|0;cb=dh+D|0;cc=V;cd=Y;break}else if((K|0)==391){K=0;L491:do{if(dm>>>0<19){D=dm;while(1){c[aE>>2]=D+1|0;b[ay+((e[5244496+(D<<1)>>1]|0)<<1)>>1]=0;T=c[aE>>2]|0;if(T>>>0<19){D=T}else{break L491}}}}while(0);c[au>>2]=m;c[a3>>2]=m;c[aS>>2]=7;D=bh(0,aw,19,aJ,aS,ax)|0;if((D|0)==0){c[aE>>2]=0;c[bn>>2]=18;bQ=0;bR=dl;bS=dk;bT=dj;bU=di;bV=0;K=396;break}else{c[bn>>2]=29;b4=D;b5=Z;b6=dl;b7=dk;b8=al;b9=dj;ca=an;cb=di;cc=V;cd=Y;break}}}while(0);L498:do{if((K|0)==290){while(1){K=0;if((cI|0)==0){bW=at;bX=Z;bY=cK;bZ=cJ;b_=al;b$=Y;break L337}D=cI-1|0;T=cH+1|0;N=((d[cH]|0)<<cK)+cJ|0;k=cK+8|0;if(k>>>0<16){cH=T;cI=D;cJ=N;cK=k;K=290}else{cL=T;cM=D;cN=N;K=292;break L498}}}else if((K|0)==396){K=0;N=c[aB>>2]|0;D=c[av>>2]|0;do{if(bV>>>0<(D+N|0)>>>0){T=bU;k=bT;C=bS;J=bR;W=bV;A=N;x=D;L504:while(1){X=(1<<c[aS>>2])-1|0;P=X&C;p=c[aL>>2]|0;n=d[p+(P<<2)+1|0]|0;L506:do{if(n>>>0>J>>>0){B=T;z=k;H=C;E=J;while(1){if((z|0)==0){bW=bQ;bX=Z;bY=E;bZ=H;b_=al;b$=Y;break L337}y=z-1|0;F=B+1|0;I=((d[B]|0)<<E)+H|0;ab=E+8|0;G=X&I;M=d[p+(G<<2)+1|0]|0;if(M>>>0>ab>>>0){B=F;z=y;H=I;E=ab}else{d7=F;d8=y;d9=I;ea=ab;eb=G;ec=M;break L506}}}else{d7=T;d8=k;d9=C;ea=J;eb=P;ec=n}}while(0);n=b[p+(eb<<2)+2>>1]|0;L511:do{if((n&65535)<16){L513:do{if(ea>>>0<ec>>>0){P=d7;X=d8;E=d9;H=ea;while(1){if((X|0)==0){bW=bQ;bX=Z;bY=H;bZ=E;b_=al;b$=Y;break L337}z=X-1|0;B=P+1|0;aR=((d[P]|0)<<H)+E|0;aj=H+8|0;if(aj>>>0<ec>>>0){P=B;X=z;E=aR;H=aj}else{ed=B;ee=z;ef=aR;eg=aj;break L513}}}else{ed=d7;ee=d8;ef=d9;eg=ea}}while(0);c[aE>>2]=W+1|0;b[ay+(W<<1)>>1]=n;eh=eg-ec|0;ei=ef>>>(ec>>>0);ej=ee;ek=ed}else{if((n<<16>>16|0)==16){H=ec+2|0;L527:do{if(ea>>>0<H>>>0){E=d7;X=d8;P=d9;aj=ea;while(1){if((X|0)==0){bW=bQ;bX=Z;bY=aj;bZ=P;b_=al;b$=Y;break L337}aR=X-1|0;z=E+1|0;B=((d[E]|0)<<aj)+P|0;M=aj+8|0;if(M>>>0<H>>>0){E=z;X=aR;P=B;aj=M}else{el=z;em=aR;en=B;eo=M;break L527}}}else{el=d7;em=d8;en=d9;eo=ea}}while(0);ep=en>>>(ec>>>0);eq=eo-ec|0;if((W|0)==0){K=413;break L504}er=b[ay+(W-1<<1)>>1]|0;es=(ep&3)+3|0;et=eq-2|0;eu=ep>>>2;ev=em;ew=el}else if((n<<16>>16|0)==17){H=ec+3|0;L534:do{if(ea>>>0<H>>>0){aj=d7;P=d8;X=d9;E=ea;while(1){if((P|0)==0){bW=bQ;bX=Z;bY=E;bZ=X;b_=al;b$=Y;break L337}M=P-1|0;B=aj+1|0;aR=((d[aj]|0)<<E)+X|0;z=E+8|0;if(z>>>0<H>>>0){aj=B;P=M;X=aR;E=z}else{ex=B;ey=M;ez=aR;eA=z;break L534}}}else{ex=d7;ey=d8;ez=d9;eA=ea}}while(0);H=ez>>>(ec>>>0);er=0;es=(H&7)+3|0;et=(-3-ec|0)+eA|0;eu=H>>>3;ev=ey;ew=ex}else{H=ec+7|0;L521:do{if(ea>>>0<H>>>0){E=d7;X=d8;P=d9;aj=ea;while(1){if((X|0)==0){bW=bQ;bX=Z;bY=aj;bZ=P;b_=al;b$=Y;break L337}z=X-1|0;aR=E+1|0;M=((d[E]|0)<<aj)+P|0;B=aj+8|0;if(B>>>0<H>>>0){E=aR;X=z;P=M;aj=B}else{eB=aR;eC=z;eD=M;eE=B;break L521}}}else{eB=d7;eC=d8;eD=d9;eE=ea}}while(0);H=eD>>>(ec>>>0);er=0;es=(H&127)+11|0;et=(-7-ec|0)+eE|0;eu=H>>>7;ev=eC;ew=eB}if((W+es|0)>>>0>(x+A|0)>>>0){K=422;break L504}else{eF=es;eG=W}while(1){H=eF-1|0;c[aE>>2]=eG+1|0;b[ay+(eG<<1)>>1]=er;if((H|0)==0){eh=et;ei=eu;ej=ev;ek=ew;break L511}eF=H;eG=c[aE>>2]|0}}}while(0);n=c[aE>>2]|0;eH=c[aB>>2]|0;p=c[av>>2]|0;if(n>>>0<(p+eH|0)>>>0){T=ek;k=ej;C=ei;J=eh;W=n;A=eH;x=p}else{K=425;break}}if((K|0)==413){K=0;c[bn>>2]=29;b4=bQ;b5=Z;b6=eq;b7=ep;b8=al;b9=em;ca=an;cb=el;cc=V;cd=Y;break L498}else if((K|0)==422){K=0;c[bn>>2]=29;b4=bQ;b5=Z;b6=et;b7=eu;b8=al;b9=ev;ca=an;cb=ew;cc=V;cd=Y;break L498}else if((K|0)==425){K=0;if((c[bn>>2]|0)==29){b4=bQ;b5=Z;b6=eh;b7=ei;b8=al;b9=ej;ca=an;cb=ek;cc=V;cd=Y;break L498}else{eI=eH;eJ=eh;eK=ei;eL=ej;eM=ek;break}}}else{eI=N;eJ=bR;eK=bS;eL=bT;eM=bU}}while(0);if((b[aG>>1]|0)==0){c[bn>>2]=29;b4=bQ;b5=Z;b6=eJ;b7=eK;b8=al;b9=eL;ca=an;cb=eM;cc=V;cd=Y;break}c[au>>2]=m;c[a3>>2]=m;c[aS>>2]=9;N=bh(1,aw,eI,aJ,aS,ax)|0;if((N|0)!=0){c[bn>>2]=29;b4=N;b5=Z;b6=eJ;b7=eK;b8=al;b9=eL;ca=an;cb=eM;cc=V;cd=Y;break}c[a4>>2]=c[aJ>>2]|0;c[aO>>2]=6;N=bh(2,aw+(c[aB>>2]<<1)|0,c[av>>2]|0,aJ,aO,ax)|0;if((N|0)==0){c[bn>>2]=19;dn=0;dp=eJ;dq=eK;dr=eL;ds=eM;K=433;break}else{c[bn>>2]=29;b4=N;b5=Z;b6=eJ;b7=eK;b8=al;b9=eL;ca=an;cb=eM;cc=V;cd=Y;break}}}while(0);do{if((K|0)==292){K=0;N=c[aU>>2]|0;if((N|0)!=0){c[N+8>>2]=cN&255;c[(c[aU>>2]|0)+12>>2]=cN>>>8}if((c[aV>>2]&512|0)!=0){a[aY]=cN&255;a[aX]=cN>>>8&255;c[aZ>>2]=bg(c[aZ>>2]|0,aY,2)|0}c[bn>>2]=4;cO=0;cP=0;cQ=cM;cR=cL;K=297;break}else if((K|0)==433){K=0;c[bn>>2]=20;dt=dn;du=dp;dv=dq;dw=dr;dx=ds;K=434;break}}while(0);do{if((K|0)==297){K=0;N=c[aV>>2]|0;do{if((N&1024|0)==0){D=c[aU>>2]|0;if((D|0)==0){eN=cO;eO=cP;eP=cQ;eQ=cR;break}c[D+16>>2]=0;eN=cO;eO=cP;eP=cQ;eQ=cR}else{L571:do{if(cO>>>0<16){D=cR;x=cQ;A=cP;W=cO;while(1){if((x|0)==0){bW=at;bX=Z;bY=W;bZ=A;b_=al;b$=Y;break L337}J=x-1|0;C=D+1|0;k=((d[D]|0)<<W)+A|0;T=W+8|0;if(T>>>0<16){D=C;x=J;A=k;W=T}else{eR=C;eS=J;eT=k;break L571}}}else{eR=cR;eS=cQ;eT=cP}}while(0);c[aW>>2]=eT;W=c[aU>>2]|0;if((W|0)==0){eU=N}else{c[W+20>>2]=eT;eU=c[aV>>2]|0}if((eU&512|0)==0){eN=0;eO=0;eP=eS;eQ=eR;break}a[aY]=eT&255;a[aX]=eT>>>8&255;c[aZ>>2]=bg(c[aZ>>2]|0,aY,2)|0;eN=0;eO=0;eP=eS;eQ=eR}}while(0);c[bn>>2]=5;cS=eN;cT=eO;cU=eP;cV=eQ;K=308;break}else if((K|0)==434){K=0;if(!(dw>>>0>5&al>>>0>257)){c[a1>>2]=0;N=(1<<c[aS>>2])-1|0;W=N&dv;A=c[aL>>2]|0;x=a[A+(W<<2)+1|0]|0;D=x&255;L586:do{if(D>>>0>du>>>0){k=dx;J=dw;C=dv;T=du;while(1){if((J|0)==0){bW=dt;bX=Z;bY=T;bZ=C;b_=al;b$=Y;break L337}p=J-1|0;n=k+1|0;H=((d[k]|0)<<T)+C|0;aj=T+8|0;P=N&H;X=a[A+(P<<2)+1|0]|0;E=X&255;if(E>>>0>aj>>>0){k=n;J=p;C=H;T=aj}else{eV=n;eW=p;eX=H;eY=aj;eZ=X;e_=P;e$=E;break L586}}}else{eV=dx;eW=dw;eX=dv;eY=du;eZ=x;e_=W;e$=D}}while(0);D=a[A+(e_<<2)|0]|0;W=b[A+(e_<<2)+2>>1]|0;x=D&255;do{if(D<<24>>24==0){e0=0;e1=eZ;e2=W;e3=eY;e4=eX;e5=eW;e6=eV;e7=0}else{if((x&240|0)!=0){e0=D;e1=eZ;e2=W;e3=eY;e4=eX;e5=eW;e6=eV;e7=0;break}N=W&65535;T=(1<<e$+x)-1|0;C=((eX&T)>>>(e$>>>0))+N|0;J=a[A+(C<<2)+1|0]|0;L594:do{if(((J&255)+e$|0)>>>0>eY>>>0){k=eV;E=eW;P=eX;X=eY;while(1){if((E|0)==0){bW=dt;bX=Z;bY=X;bZ=P;b_=al;b$=Y;break L337}aj=E-1|0;H=k+1|0;p=((d[k]|0)<<X)+P|0;n=X+8|0;B=((p&T)>>>(e$>>>0))+N|0;M=a[A+(B<<2)+1|0]|0;if(((M&255)+e$|0)>>>0>n>>>0){k=H;E=aj;P=p;X=n}else{e8=H;e9=aj;fa=p;fb=n;fc=B;fd=M;break L594}}}else{e8=eV;e9=eW;fa=eX;fb=eY;fc=C;fd=J}}while(0);J=b[A+(fc<<2)+2>>1]|0;C=a[A+(fc<<2)|0]|0;c[a1>>2]=e$;e0=C;e1=fd;e2=J;e3=fb-e$|0;e4=fa>>>(e$>>>0);e5=e9;e6=e8;e7=e$}}while(0);A=e1&255;x=e4>>>(A>>>0);W=e3-A|0;c[a1>>2]=e7+A|0;c[aW>>2]=e2&65535;A=e0&255;if(e0<<24>>24==0){c[bn>>2]=25;b4=dt;b5=Z;b6=W;b7=x;b8=al;b9=e5;ca=an;cb=e6;cc=V;cd=Y;break}if((A&32|0)!=0){c[a1>>2]=-1;c[bn>>2]=11;b4=dt;b5=Z;b6=W;b7=x;b8=al;b9=e5;ca=an;cb=e6;cc=V;cd=Y;break}if((A&64|0)==0){D=A&15;c[l>>2]=D;c[bn>>2]=21;bE=dt;bF=W;bG=x;bH=e5;bI=e6;bJ=D;K=515;break}else{c[bn>>2]=29;b4=dt;b5=Z;b6=W;b7=x;b8=al;b9=e5;ca=an;cb=e6;cc=V;cd=Y;break}}c[a5>>2]=dv;c[o>>2]=du;x=dx+(dw-6|0)|0;W=an+(al-258|0)|0;D=c[ba>>2]|0;A=c[a7>>2]|0;J=c[bp>>2]|0;C=c[aL>>2]|0;N=c[az>>2]|0;T=(1<<c[aS>>2])-1|0;X=(1<<c[aO>>2])-1|0;P=an+(al+(Z^-1)|0)|0;E=J-1|0;k=(A|0)==0;M=(c[bb>>2]|0)-1|0;B=M+A|0;n=A-1|0;p=P-1|0;aj=P-A|0;H=dx-1|0;z=an-1|0;aR=dv;G=du;L610:while(1){if(G>>>0<15){ab=H+2|0;fe=ab;ff=(((d[H+1|0]|0)<<G)+aR|0)+((d[ab]|0)<<G+8)|0;fg=G+16|0}else{fe=H;ff=aR;fg=G}ab=ff&T;I=a[C+(ab<<2)|0]|0;y=b[C+(ab<<2)+2>>1]|0;F=d[C+(ab<<2)+1|0]|0;ab=ff>>>(F>>>0);S=fg-F|0;L615:do{if(I<<24>>24==0){fh=y;fi=ab;fj=S;K=439}else{F=y;fk=ab;fl=S;Q=I;while(1){fm=Q&255;if((fm&16|0)!=0){break}if((fm&64|0)!=0){K=487;break L610}U=(fk&(1<<fm)-1)+(F&65535)|0;ac=a[C+(U<<2)|0]|0;L=b[C+(U<<2)+2>>1]|0;af=d[C+(U<<2)+1|0]|0;U=fk>>>(af>>>0);ag=fl-af|0;if(ac<<24>>24==0){fh=L;fi=U;fj=ag;K=439;break L615}else{F=L;fk=U;fl=ag;Q=ac}}Q=F&65535;ac=fm&15;if((ac|0)==0){fn=Q;fo=fe;fp=fk;fq=fl}else{if(fl>>>0<ac>>>0){ag=fe+1|0;fr=ag;fs=((d[ag]|0)<<fl)+fk|0;ft=fl+8|0}else{fr=fe;fs=fk;ft=fl}fn=(fs&(1<<ac)-1)+Q|0;fo=fr;fp=fs>>>(ac>>>0);fq=ft-ac|0}if(fq>>>0<15){ac=fo+2|0;fu=ac;fv=(((d[fo+1|0]|0)<<fq)+fp|0)+((d[ac]|0)<<fq+8)|0;fw=fq+16|0}else{fu=fo;fv=fp;fw=fq}ac=fv&X;Q=b[N+(ac<<2)+2>>1]|0;ag=d[N+(ac<<2)+1|0]|0;U=fv>>>(ag>>>0);L=fw-ag|0;ag=d[N+(ac<<2)|0]|0;L630:do{if((ag&16|0)==0){ac=Q;fx=U;fy=L;af=ag;while(1){if((af&64|0)!=0){K=484;break L610}ae=(fx&(1<<af)-1)+(ac&65535)|0;ad=b[N+(ae<<2)+2>>1]|0;aa=d[N+(ae<<2)+1|0]|0;R=fx>>>(aa>>>0);O=fy-aa|0;aa=d[N+(ae<<2)|0]|0;if((aa&16|0)==0){ac=ad;fx=R;fy=O;af=aa}else{fz=ad;fA=R;fB=O;fC=aa;break L630}}}else{fz=Q;fA=U;fB=L;fC=ag}}while(0);ag=fz&65535;L=fC&15;do{if(fB>>>0<L>>>0){U=fu+1|0;Q=((d[U]|0)<<fB)+fA|0;F=fB+8|0;if(F>>>0>=L>>>0){fD=U;fE=Q;fF=F;break}U=fu+2|0;fD=U;fE=((d[U]|0)<<F)+Q|0;fF=fB+16|0}else{fD=fu;fE=fA;fF=fB}}while(0);Q=(fE&(1<<L)-1)+ag|0;fG=fE>>>(L>>>0);fH=fF-L|0;F=z;U=F-P|0;if(Q>>>0<=U>>>0){af=z+(-Q|0)|0;ac=fn;aa=z;while(1){a[aa+1|0]=a[af+1|0]|0;a[aa+2|0]=a[af+2|0]|0;O=af+3|0;fI=aa+3|0;a[fI]=a[O]|0;fJ=ac-3|0;if(fJ>>>0>2){af=O;ac=fJ;aa=fI}else{break}}if((fJ|0)==0){fK=fD;fL=fI;fM=fG;fN=fH;break}ac=aa+4|0;a[ac]=a[af+4|0]|0;if(fJ>>>0<=1){fK=fD;fL=ac;fM=fG;fN=fH;break}ac=aa+5|0;a[ac]=a[af+5|0]|0;fK=fD;fL=ac;fM=fG;fN=fH;break}ac=Q-U|0;if(ac>>>0>D>>>0){if((c[aT>>2]|0)!=0){K=454;break L610}}do{if(k){L=J+(M-ac|0)|0;if(ac>>>0>=fn>>>0){fO=L;fP=fn;fQ=z;break}ag=fn-ac|0;O=Q-F|0;R=L;L=ac;ad=z;while(1){ae=R+1|0;ak=ad+1|0;a[ak]=a[ae]|0;ah=L-1|0;if((ah|0)==0){break}else{R=ae;L=ah;ad=ak}}fO=z+((p+O|0)+(1-Q|0)|0)|0;fP=ag;fQ=z+(P+O|0)|0}else{if(A>>>0>=ac>>>0){ad=J+(n-ac|0)|0;if(ac>>>0>=fn>>>0){fO=ad;fP=fn;fQ=z;break}L=fn-ac|0;R=Q-F|0;ak=ad;ad=ac;ah=z;while(1){ae=ak+1|0;a0=ah+1|0;a[a0]=a[ae]|0;a_=ad-1|0;if((a_|0)==0){break}else{ak=ae;ad=a_;ah=a0}}fO=z+((p+R|0)+(1-Q|0)|0)|0;fP=L;fQ=z+(P+R|0)|0;break}ah=J+(B-ac|0)|0;ad=ac-A|0;if(ad>>>0>=fn>>>0){fO=ah;fP=fn;fQ=z;break}ak=fn-ad|0;O=Q-F|0;ag=ah;ah=ad;ad=z;while(1){a0=ag+1|0;a_=ad+1|0;a[a_]=a[a0]|0;ae=ah-1|0;if((ae|0)==0){break}else{ag=a0;ah=ae;ad=a_}}ad=z+(aj+O|0)|0;if(A>>>0>=ak>>>0){fO=E;fP=ak;fQ=ad;break}ah=ak-A|0;ag=E;R=A;L=ad;while(1){ad=ag+1|0;a_=L+1|0;a[a_]=a[ad]|0;ae=R-1|0;if((ae|0)==0){break}else{ag=ad;R=ae;L=a_}}fO=z+((p+O|0)+(1-Q|0)|0)|0;fP=ah;fQ=z+(P+O|0)|0}}while(0);L673:do{if(fP>>>0>2){Q=fQ;F=fP;ac=fO;while(1){a[Q+1|0]=a[ac+1|0]|0;a[Q+2|0]=a[ac+2|0]|0;U=ac+3|0;af=Q+3|0;a[af]=a[U]|0;aa=F-3|0;if(aa>>>0>2){Q=af;F=aa;ac=U}else{fR=af;fS=aa;fT=U;break L673}}}else{fR=fQ;fS=fP;fT=fO}}while(0);if((fS|0)==0){fK=fD;fL=fR;fM=fG;fN=fH;break}ac=fR+1|0;a[ac]=a[fT+1|0]|0;if(fS>>>0<=1){fK=fD;fL=ac;fM=fG;fN=fH;break}ac=fR+2|0;a[ac]=a[fT+2|0]|0;fK=fD;fL=ac;fM=fG;fN=fH;break}}while(0);if((K|0)==439){K=0;I=z+1|0;a[I]=fh&255;fK=fe;fL=I;fM=fi;fN=fj}if(fK>>>0<x>>>0&fL>>>0<W>>>0){H=fK;z=fL;aR=fM;G=fN}else{fU=fK;fV=fL;fW=fM;fX=fN;break}}do{if((K|0)==454){K=0;c[bn>>2]=29;fU=fD;fV=z;fW=fG;fX=fH}else if((K|0)==484){K=0;c[bn>>2]=29;fU=fu;fV=z;fW=fx;fX=fy}else if((K|0)==487){K=0;if((fm&32|0)==0){c[bn>>2]=29;fU=fe;fV=z;fW=fk;fX=fl;break}else{c[bn>>2]=11;fU=fe;fV=z;fW=fk;fX=fl;break}}}while(0);z=fX>>>3;G=fU+(-z|0)|0;aR=fX-(z<<3)|0;H=(1<<aR)-1&fW;P=fU+(1-z|0)|0;z=fV+1|0;if(G>>>0<x>>>0){fY=x-G|0}else{fY=x-G|0}G=fY+5|0;if(fV>>>0<W>>>0){fZ=W-fV|0}else{fZ=W-fV|0}p=fZ+257|0;c[a5>>2]=H;c[o>>2]=aR;if((c[bn>>2]|0)!=11){b4=dt;b5=Z;b6=aR;b7=H;b8=p;b9=G;ca=z;cb=P;cc=G;cd=Y;break}c[a1>>2]=-1;b4=dt;b5=Z;b6=aR;b7=H;b8=p;b9=G;ca=z;cb=P;cc=G;cd=Y;break}}while(0);do{if((K|0)==308){K=0;G=c[aV>>2]|0;if((G&1024|0)==0){f_=cU;f$=cV;f0=G}else{P=c[aW>>2]|0;z=P>>>0>cU>>>0?cU:P;if((z|0)==0){f1=cU;f2=cV;f3=P;f4=G}else{p=c[aU>>2]|0;do{if((p|0)==0){f5=G}else{H=c[p+16>>2]|0;if((H|0)==0){f5=G;break}aR=(c[p+20>>2]|0)-P|0;A=c[p+24>>2]|0;bl(H+aR|0,cV|0,((aR+z|0)>>>0>A>>>0?A-aR|0:z)|0);f5=c[aV>>2]|0}}while(0);if((f5&512|0)!=0){c[aZ>>2]=bg(c[aZ>>2]|0,cV,z)|0}p=(c[aW>>2]|0)-z|0;c[aW>>2]=p;f1=cU-z|0;f2=cV+z|0;f3=p;f4=f5}if((f3|0)==0){f_=f1;f$=f2;f0=f4}else{bW=at;bX=Z;bY=cS;bZ=cT;b_=al;b$=Y;break L337}}c[aW>>2]=0;c[bn>>2]=6;bz=cS;bA=cT;bB=f_;bC=f$;bD=f0;K=318;break}else if((K|0)==515){K=0;if((bJ|0)==0){f6=bF;f7=bG;f8=bH;f9=bI;ga=c[aW>>2]|0}else{L718:do{if(bF>>>0<bJ>>>0){p=bI;P=bH;G=bG;W=bF;while(1){if((P|0)==0){bW=bE;bX=Z;bY=W;bZ=G;b_=al;b$=Y;break L337}x=P-1|0;aR=p+1|0;A=((d[p]|0)<<W)+G|0;H=W+8|0;if(H>>>0<bJ>>>0){p=aR;P=x;G=A;W=H}else{gb=aR;gc=x;gd=A;ge=H;break L718}}}else{gb=bI;gc=bH;gd=bG;ge=bF}}while(0);z=(c[aW>>2]|0)+((1<<bJ)-1&gd)|0;c[aW>>2]=z;c[a1>>2]=(c[a1>>2]|0)+bJ|0;f6=ge-bJ|0;f7=gd>>>(bJ>>>0);f8=gc;f9=gb;ga=z}c[aM>>2]=ga;c[bn>>2]=22;dy=bE;dz=f6;dA=f7;dB=f8;dC=f9;K=522;break}}while(0);do{if((K|0)==318){K=0;do{if((bD&2048|0)==0){z=c[aU>>2]|0;if((z|0)==0){gf=bB;gg=bC;break}c[z+28>>2]=0;gf=bB;gg=bC}else{if((bB|0)==0){bW=at;bX=Z;bY=bz;bZ=bA;b_=al;b$=Y;break L337}else{gh=0}while(1){gi=gh+1|0;z=a[bC+gh|0]|0;W=c[aU>>2]|0;do{if((W|0)!=0){G=W+28|0;if((c[G>>2]|0)==0){break}P=c[aW>>2]|0;if(P>>>0>=(c[W+32>>2]|0)>>>0){break}c[aW>>2]=P+1|0;a[(c[G>>2]|0)+P|0]=z}}while(0);gj=z<<24>>24!=0;if(gj&gi>>>0<bB>>>0){gh=gi}else{break}}if((c[aV>>2]&512|0)!=0){c[aZ>>2]=bg(c[aZ>>2]|0,bC,gi)|0}if(gj){bW=at;bX=Z;bY=bz;bZ=bA;b_=al;b$=Y;break L337}else{gf=bB-gi|0;gg=bC+gi|0}}}while(0);c[aW>>2]=0;c[bn>>2]=7;cW=bz;cX=bA;cY=gf;cZ=gg;K=331;break}else if((K|0)==522){K=0;W=(1<<c[aO>>2])-1|0;P=W&dA;G=c[az>>2]|0;p=a[G+(P<<2)+1|0]|0;H=p&255;L743:do{if(H>>>0>dz>>>0){A=dC;x=dB;aR=dA;E=dz;while(1){if((x|0)==0){bW=dy;bX=Z;bY=E;bZ=aR;b_=al;b$=Y;break L337}aj=x-1|0;B=A+1|0;J=((d[A]|0)<<E)+aR|0;n=E+8|0;M=W&J;k=a[G+(M<<2)+1|0]|0;D=k&255;if(D>>>0>n>>>0){A=B;x=aj;aR=J;E=n}else{gk=B;gl=aj;gm=J;gn=n;go=k;gp=M;gq=D;break L743}}}else{gk=dC;gl=dB;gm=dA;gn=dz;go=p;gp=P;gq=H}}while(0);H=a[G+(gp<<2)|0]|0;P=b[G+(gp<<2)+2>>1]|0;p=H&255;if((p&240|0)==0){W=P&65535;E=(1<<gq+p)-1|0;p=((gm&E)>>>(gq>>>0))+W|0;aR=a[G+(p<<2)+1|0]|0;L751:do{if(((aR&255)+gq|0)>>>0>gn>>>0){x=gk;A=gl;D=gm;M=gn;while(1){if((A|0)==0){bW=dy;bX=Z;bY=M;bZ=D;b_=al;b$=Y;break L337}k=A-1|0;n=x+1|0;J=((d[x]|0)<<M)+D|0;aj=M+8|0;B=((J&E)>>>(gq>>>0))+W|0;N=a[G+(B<<2)+1|0]|0;if(((N&255)+gq|0)>>>0>aj>>>0){x=n;A=k;D=J;M=aj}else{gr=n;gs=k;gt=J;gu=aj;gv=B;gw=N;break L751}}}else{gr=gk;gs=gl;gt=gm;gu=gn;gv=p;gw=aR}}while(0);aR=b[G+(gv<<2)+2>>1]|0;p=a[G+(gv<<2)|0]|0;W=(c[a1>>2]|0)+gq|0;c[a1>>2]=W;gx=p;gy=gw;gz=aR;gA=gu-gq|0;gB=gt>>>(gq>>>0);gC=gs;gD=gr;gE=W}else{gx=H;gy=go;gz=P;gA=gn;gB=gm;gC=gl;gD=gk;gE=c[a1>>2]|0}W=gy&255;aR=gB>>>(W>>>0);p=gA-W|0;c[a1>>2]=gE+W|0;W=gx&255;if((W&64|0)==0){c[aC>>2]=gz&65535;E=W&15;c[l>>2]=E;c[bn>>2]=23;bK=dy;bL=p;bM=aR;bN=gC;bO=gD;bP=E;K=534;break}else{c[bn>>2]=29;b4=dy;b5=Z;b6=p;b7=aR;b8=al;b9=gC;ca=an;cb=gD;cc=V;cd=Y;break}}}while(0);do{if((K|0)==331){K=0;do{if((c[aV>>2]&4096|0)==0){aR=c[aU>>2]|0;if((aR|0)==0){gF=cY;gG=cZ;break}c[aR+36>>2]=0;gF=cY;gG=cZ}else{if((cY|0)==0){bW=at;bX=Z;bY=cW;bZ=cX;b_=al;b$=Y;break L337}else{gH=0}while(1){gI=gH+1|0;aR=a[cZ+gH|0]|0;p=c[aU>>2]|0;do{if((p|0)!=0){E=p+36|0;if((c[E>>2]|0)==0){break}W=c[aW>>2]|0;if(W>>>0>=(c[p+40>>2]|0)>>>0){break}c[aW>>2]=W+1|0;a[(c[E>>2]|0)+W|0]=aR}}while(0);gJ=aR<<24>>24!=0;if(gJ&gI>>>0<cY>>>0){gH=gI}else{break}}if((c[aV>>2]&512|0)!=0){c[aZ>>2]=bg(c[aZ>>2]|0,cZ,gI)|0}if(gJ){bW=at;bX=Z;bY=cW;bZ=cX;b_=al;b$=Y;break L337}else{gF=cY-gI|0;gG=cZ+gI|0}}}while(0);c[bn>>2]=8;c_=cW;c$=cX;c0=gF;c1=gG;K=344;break}else if((K|0)==534){K=0;if((bP|0)==0){gK=bL;gL=bM;gM=bN;gN=bO}else{L781:do{if(bL>>>0<bP>>>0){P=bO;H=bN;G=bM;p=bL;while(1){if((H|0)==0){bW=bK;bX=Z;bY=p;bZ=G;b_=al;b$=Y;break L337}z=H-1|0;W=P+1|0;E=((d[P]|0)<<p)+G|0;M=p+8|0;if(M>>>0<bP>>>0){P=W;H=z;G=E;p=M}else{gO=W;gP=z;gQ=E;gR=M;break L781}}}else{gO=bO;gP=bN;gQ=bM;gR=bL}}while(0);c[aC>>2]=(c[aC>>2]|0)+((1<<bP)-1&gQ)|0;c[a1>>2]=(c[a1>>2]|0)+bP|0;gK=gR-bP|0;gL=gQ>>>(bP>>>0);gM=gP;gN=gO}c[bn>>2]=24;dD=bK;dE=gK;dF=gL;dG=gM;dH=gN;K=540;break}}while(0);L787:do{if((K|0)==344){K=0;p=c[aV>>2]|0;do{if((p&512|0)==0){gS=c_;gT=c$;gU=c0;gV=c1}else{L791:do{if(c_>>>0<16){G=c1;H=c0;P=c$;M=c_;while(1){if((H|0)==0){bW=at;bX=Z;bY=M;bZ=P;b_=al;b$=Y;break L337}E=H-1|0;z=G+1|0;W=((d[G]|0)<<M)+P|0;D=M+8|0;if(D>>>0<16){G=z;H=E;P=W;M=D}else{gW=z;gX=E;gY=W;gZ=D;break L791}}}else{gW=c1;gX=c0;gY=c$;gZ=c_}}while(0);if((gY|0)==(c[aZ>>2]&65535|0)){gS=0;gT=0;gU=gX;gV=gW;break}c[bn>>2]=29;b4=at;b5=Z;b6=gZ;b7=gY;b8=al;b9=gX;ca=an;cb=gW;cc=V;cd=Y;break L787}}while(0);M=c[aU>>2]|0;if((M|0)!=0){c[M+44>>2]=p>>>9&1;c[(c[aU>>2]|0)+48>>2]=1}c[aZ>>2]=0;c[bn>>2]=11;b4=at;b5=Z;b6=gS;b7=gT;b8=al;b9=gU;ca=an;cb=gV;cc=V;cd=Y}else if((K|0)==540){K=0;if((al|0)==0){bW=dD;bX=Z;bY=dE;bZ=dF;b_=0;b$=Y;break L337}M=Z-al|0;P=c[aC>>2]|0;if(P>>>0>M>>>0){H=P-M|0;do{if(H>>>0>(c[ba>>2]|0)>>>0){if((c[aT>>2]|0)==0){break}c[bn>>2]=29;b4=dD;b5=Z;b6=dE;b7=dF;b8=al;b9=dG;ca=an;cb=dH;cc=V;cd=Y;break L787}}while(0);p=c[a7>>2]|0;if(H>>>0>p>>>0){M=H-p|0;g_=(c[bp>>2]|0)+((c[bb>>2]|0)-M|0)|0;g$=M}else{g_=(c[bp>>2]|0)+(p-H|0)|0;g$=H}p=c[aW>>2]|0;g0=g_;g1=g$>>>0>p>>>0?p:g$;g2=p}else{p=c[aW>>2]|0;g0=an+(-P|0)|0;g1=p;g2=p}p=g1>>>0>al>>>0?al:g1;c[aW>>2]=g2-p|0;M=al^-1;G=g1^-1;aR=M>>>0>G>>>0?M:G;G=g0;M=p;D=an;while(1){a[D]=a[G]|0;W=M-1|0;if((W|0)==0){break}else{G=G+1|0;M=W;D=D+1|0}}D=al-p|0;M=an+(aR^-1)|0;if((c[aW>>2]|0)!=0){b4=dD;b5=Z;b6=dE;b7=dF;b8=D;b9=dG;ca=M;cb=dH;cc=V;cd=Y;break}c[bn>>2]=20;b4=dD;b5=Z;b6=dE;b7=dF;b8=D;b9=dG;ca=M;cb=dH;cc=V;cd=Y}}while(0);at=b4;Z=b5;ar=b6;as=b7;al=b8;am=b9;an=ca;ao=cb;ap=c[bn>>2]|0;V=cc;Y=cd}if((K|0)==357){c[a5>>2]=cn;c[o>>2]=cm;break}else if((K|0)==578){c[bn>>2]=28;bW=1;bX=bs;bY=dZ;bZ=d_;b_=al;b$=bx}else if((K|0)==579){bW=-3;bX=Z;bY=ar;bZ=as;b_=al;b$=Y}c[a5>>2]=bZ;c[o>>2]=bY;V=c[bb>>2]|0;do{if((V|0)==0){if((c[bn>>2]|0)>>>0>=26|(bX|0)==(b_|0)){break}else{K=582;break}}else{K=582}}while(0);do{if((K|0)==582){Y=c[bp>>2]|0;do{if((Y|0)==0){al=bd(0,1<<c[bo>>2],1)|0;c[bq>>2]=al;if((al|0)==0){c[bn>>2]=30;break L334}else{g3=al;g4=c[bb>>2]|0;break}}else{g3=Y;g4=V}}while(0);if((g4|0)==0){Y=1<<c[bo>>2];c[bb>>2]=Y;c[a7>>2]=0;c[ba>>2]=0;g5=Y}else{g5=g4}Y=bX-b_|0;if(Y>>>0>=g5>>>0){bl(g3|0,an+(-g5|0)|0,g5|0);c[a7>>2]=0;c[ba>>2]=c[bb>>2]|0;break}al=c[a7>>2]|0;as=g5-al|0;ar=as>>>0>Y>>>0?Y:as;bl(g3+al|0,an+(-Y|0)|0,ar|0);al=Y-ar|0;if((Y|0)!=(ar|0)){bl(c[bp>>2]|0,an+(-al|0)|0,al|0);c[a7>>2]=al;c[ba>>2]=c[bb>>2]|0;break}al=(c[a7>>2]|0)+Y|0;c[a7>>2]=al;ar=c[bb>>2]|0;if((al|0)==(ar|0)){c[a7>>2]=0}al=c[ba>>2]|0;if(al>>>0>=ar>>>0){break}c[ba>>2]=al+Y|0}}while(0);V=bX-b_|0;Y=b$+V|0;c[u>>2]=(c[u>>2]|0)+V|0;if(!((c[t>>2]|0)==0|(bX|0)==(b_|0))){al=c[aZ>>2]|0;ar=an+(-V|0)|0;if((c[aV>>2]|0)==0){g6=bf(al,ar,V)|0}else{g6=bg(al,ar,V)|0}c[aZ>>2]=g6}if((((bW|0)==0?-5:bW)|0)!=1){break}V=c[bp>>2]|0;if((V|0)!=0){be(0,V)}be(0,q);if((Y|0)==1e5){break L332}aA(5255724,24,5257008,5255696)}}while(0);t=c[bp>>2]|0;if((t|0)!=0){be(0,t)}be(0,q)}}while(0);if(!br){i=h;return}if((aH(f|0,c[1311756]|0)|0)==0){i=h;return}else{aA(5255724,25,5257008,5255664)}}function a1(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;do{if((b|0)>1){f=a[c[d+4>>2]|0]|0;if((f|0)==50){g=250;break}else if((f|0)==51){h=618;break}else if((f|0)==52){g=2500;break}else if((f|0)==53){g=5e3;break}else if((f|0)==49){g=60;break}else if((f|0)==48){j=0;i=e;return j|0}else{aq(5255652,(s=i,i=i+4|0,c[s>>2]=f-48|0,s)|0);j=-1;i=e;return j|0}}else{h=618}}while(0);if((h|0)==618){g=500}h=bi(1e5)|0;d=0;b=0;f=17;while(1){do{if((b|0)>0){k=f;l=b-1|0}else{if((d&7|0)==0){k=0;l=d&31;break}else{k=(Z(d,d)>>>0)%6714&255;l=b;break}}}while(0);a[h+d|0]=k;m=d+1|0;if((m|0)==1e5){n=0;break}else{d=m;b=l;f=k}}while(1){a0(h,n);k=n+1|0;if((k|0)<(g|0)){n=k}else{break}}at(5242880);j=0;i=e;return j|0}function a2(a){a=a|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;f=a+44|0;g=c[f>>2]|0;h=a+60|0;i=a+116|0;j=a+108|0;k=g-262|0;l=a|0;m=a+56|0;n=a+72|0;o=a+88|0;p=a+84|0;q=a+112|0;r=a+92|0;s=a+76|0;t=a+68|0;u=a+64|0;v=c[i>>2]|0;w=g;while(1){x=c[j>>2]|0;y=((c[h>>2]|0)-v|0)-x|0;if(x>>>0<(k+w|0)>>>0){z=y}else{x=c[m>>2]|0;bl(x|0,x+g|0,g|0);c[q>>2]=(c[q>>2]|0)-g|0;c[j>>2]=(c[j>>2]|0)-g|0;c[r>>2]=(c[r>>2]|0)-g|0;x=c[s>>2]|0;A=x;B=(c[t>>2]|0)+(x<<1)|0;while(1){x=B-2|0;C=e[x>>1]|0;if(C>>>0<g>>>0){D=0}else{D=C-g&65535}b[x>>1]=D;C=A-1|0;if((C|0)==0){break}else{A=C;B=x}}B=g;A=(c[u>>2]|0)+(g<<1)|0;while(1){x=A-2|0;C=e[x>>1]|0;if(C>>>0<g>>>0){E=0}else{E=C-g&65535}b[x>>1]=E;C=B-1|0;if((C|0)==0){break}else{B=C;A=x}}z=y+g|0}A=c[l>>2]|0;B=A+4|0;x=c[B>>2]|0;if((x|0)==0){F=663;break}C=c[i>>2]|0;G=(c[m>>2]|0)+(C+(c[j>>2]|0)|0)|0;H=x>>>0>z>>>0?z:x;if((H|0)==0){I=0;J=C}else{c[B>>2]=x-H|0;x=c[(c[A+28>>2]|0)+24>>2]|0;if((x|0)==1){B=A+48|0;C=c[A>>2]|0;c[B>>2]=bf(c[B>>2]|0,C,H)|0;K=C}else if((x|0)==2){x=A+48|0;C=c[A>>2]|0;c[x>>2]=bg(c[x>>2]|0,C,H)|0;K=C}else{K=c[A>>2]|0}C=A|0;bl(G|0,K|0,H|0);c[C>>2]=(c[C>>2]|0)+H|0;C=A+8|0;c[C>>2]=(c[C>>2]|0)+H|0;I=H;J=c[i>>2]|0}L=J+I|0;c[i>>2]=L;if(L>>>0>2){H=c[j>>2]|0;C=c[m>>2]|0;A=d[C+H|0]|0;c[n>>2]=A;c[n>>2]=((d[C+(H+1|0)|0]|0)^A<<c[o>>2])&c[p>>2];if(L>>>0>=262){break}}if((c[(c[l>>2]|0)+4>>2]|0)==0){break}v=L;w=c[f>>2]|0}if((F|0)==663){return}F=a+5824|0;a=c[F>>2]|0;f=c[h>>2]|0;if(a>>>0>=f>>>0){return}h=L+(c[j>>2]|0)|0;if(a>>>0<h>>>0){j=f-h|0;L=j>>>0>258?258:j;bk((c[m>>2]|0)+h|0,0,L|0);c[F>>2]=L+h|0;return}L=h+258|0;if(a>>>0>=L>>>0){return}h=L-a|0;L=f-a|0;f=h>>>0>L>>>0?L:h;bk((c[m>>2]|0)+a|0,0,f|0);c[F>>2]=(c[F>>2]|0)+f|0;return}function a3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;d=(c[a+12>>2]|0)-5|0;e=d>>>0<65535?d:65535;d=a+116|0;f=a+108|0;g=a+92|0;h=a+44|0;i=a+56|0;j=a;k=a|0;while(1){l=c[d>>2]|0;if(l>>>0<2){a2(a);m=c[d>>2]|0;if((m|b|0)==0){n=0;o=696;break}if((m|0)==0){o=687;break}else{p=m}}else{p=l}l=(c[f>>2]|0)+p|0;c[f>>2]=l;c[d>>2]=0;m=c[g>>2]|0;q=m+e|0;if((l|0)!=0&l>>>0<q>>>0){r=l;s=m}else{c[d>>2]=l-q|0;c[f>>2]=q;if((m|0)>-1){t=(c[i>>2]|0)+m|0}else{t=0}a9(j,t,e,0);c[g>>2]=c[f>>2]|0;m=c[k>>2]|0;q=m+28|0;l=c[q>>2]|0;u=c[l+20>>2]|0;v=m+16|0;w=c[v>>2]|0;x=u>>>0>w>>>0?w:u;do{if((x|0)!=0){u=m+12|0;bl(c[u>>2]|0,c[l+16>>2]|0,x|0);c[u>>2]=(c[u>>2]|0)+x|0;u=(c[q>>2]|0)+16|0;c[u>>2]=(c[u>>2]|0)+x|0;u=m+20|0;c[u>>2]=(c[u>>2]|0)+x|0;c[v>>2]=(c[v>>2]|0)-x|0;u=(c[q>>2]|0)+20|0;c[u>>2]=(c[u>>2]|0)-x|0;u=c[q>>2]|0;if((c[u+20>>2]|0)!=0){break}c[u+16>>2]=c[u+8>>2]|0}}while(0);if((c[(c[k>>2]|0)+16>>2]|0)==0){n=0;o=697;break}r=c[f>>2]|0;s=c[g>>2]|0}q=r-s|0;if(q>>>0<((c[h>>2]|0)-262|0)>>>0){continue}if((s|0)>-1){y=(c[i>>2]|0)+s|0}else{y=0}a9(j,y,q,0);c[g>>2]=c[f>>2]|0;q=c[k>>2]|0;x=q+28|0;v=c[x>>2]|0;m=c[v+20>>2]|0;l=q+16|0;u=c[l>>2]|0;w=m>>>0>u>>>0?u:m;do{if((w|0)!=0){m=q+12|0;bl(c[m>>2]|0,c[v+16>>2]|0,w|0);c[m>>2]=(c[m>>2]|0)+w|0;m=(c[x>>2]|0)+16|0;c[m>>2]=(c[m>>2]|0)+w|0;m=q+20|0;c[m>>2]=(c[m>>2]|0)+w|0;c[l>>2]=(c[l>>2]|0)-w|0;m=(c[x>>2]|0)+20|0;c[m>>2]=(c[m>>2]|0)-w|0;m=c[x>>2]|0;if((c[m+20>>2]|0)!=0){break}c[m+16>>2]=c[m+8>>2]|0}}while(0);if((c[(c[k>>2]|0)+16>>2]|0)==0){n=0;o=698;break}}if((o|0)==687){y=c[g>>2]|0;if((y|0)>-1){z=(c[i>>2]|0)+y|0}else{z=0}i=(b|0)==4;a9(j,z,(c[f>>2]|0)-y|0,i&1);c[g>>2]=c[f>>2]|0;f=c[k>>2]|0;g=f+28|0;y=c[g>>2]|0;z=c[y+20>>2]|0;j=f+16|0;b=c[j>>2]|0;s=z>>>0>b>>>0?b:z;do{if((s|0)!=0){z=f+12|0;bl(c[z>>2]|0,c[y+16>>2]|0,s|0);c[z>>2]=(c[z>>2]|0)+s|0;z=(c[g>>2]|0)+16|0;c[z>>2]=(c[z>>2]|0)+s|0;z=f+20|0;c[z>>2]=(c[z>>2]|0)+s|0;c[j>>2]=(c[j>>2]|0)-s|0;z=(c[g>>2]|0)+20|0;c[z>>2]=(c[z>>2]|0)-s|0;z=c[g>>2]|0;if((c[z+20>>2]|0)!=0){break}c[z+16>>2]=c[z+8>>2]|0}}while(0);if((c[(c[k>>2]|0)+16>>2]|0)==0){n=i?2:0;return n|0}else{n=i?3:1;return n|0}}else if((o|0)==696){return n|0}else if((o|0)==697){return n|0}else if((o|0)==698){return n|0}return 0}function a4(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;g=e+116|0;h=(f|0)==0;i=e+72|0;j=e+88|0;k=e+108|0;l=e+56|0;m=e+84|0;n=e+68|0;o=e+52|0;p=e+64|0;q=e+44|0;r=e+96|0;s=e+112|0;t=e+5792|0;u=e+5796|0;v=e+5784|0;w=e+5788|0;x=e+128|0;y=e+92|0;z=e;A=e|0;L987:while(1){do{if((c[g>>2]|0)>>>0<262){a2(e);B=c[g>>2]|0;if(B>>>0<262&h){C=0;D=735;break L987}if((B|0)==0){D=726;break L987}if(B>>>0>2){D=706;break}else{D=709;break}}else{D=706}}while(0);do{if((D|0)==706){D=0;B=c[k>>2]|0;E=((d[(c[l>>2]|0)+(B+2|0)|0]|0)^c[i>>2]<<c[j>>2])&c[m>>2];c[i>>2]=E;F=b[(c[n>>2]|0)+(E<<1)>>1]|0;b[(c[p>>2]|0)+((c[o>>2]&B)<<1)>>1]=F;B=F&65535;b[(c[n>>2]|0)+(c[i>>2]<<1)>>1]=c[k>>2]&65535;if(F<<16>>16==0){D=709;break}if(((c[k>>2]|0)-B|0)>>>0>((c[q>>2]|0)-262|0)>>>0){D=709;break}F=a5(e,B)|0;c[r>>2]=F;G=F;break}}while(0);if((D|0)==709){D=0;G=c[r>>2]|0}do{if(G>>>0>2){F=G+253|0;B=(c[k>>2]|0)-(c[s>>2]|0)|0;b[(c[u>>2]|0)+(c[t>>2]<<1)>>1]=B&65535;E=c[t>>2]|0;c[t>>2]=E+1|0;a[(c[v>>2]|0)+E|0]=F&255;E=e+148+((d[5255768+(F&255)|0]|0|256)+1<<2)|0;b[E>>1]=(b[E>>1]|0)+1&65535;E=B+65535&65535;if(E>>>0<256){H=E}else{H=(E>>>7)+256|0}E=e+2440+((d[H+5256496|0]|0)<<2)|0;b[E>>1]=(b[E>>1]|0)+1&65535;E=(c[t>>2]|0)==((c[w>>2]|0)-1|0)&1;B=c[r>>2]|0;F=(c[g>>2]|0)-B|0;c[g>>2]=F;if(!(B>>>0<=(c[x>>2]|0)>>>0&F>>>0>2)){F=(c[k>>2]|0)+B|0;c[k>>2]=F;c[r>>2]=0;I=c[l>>2]|0;J=d[I+F|0]|0;c[i>>2]=J;c[i>>2]=((d[I+(F+1|0)|0]|0)^J<<c[j>>2])&c[m>>2];K=E;L=F;break}c[r>>2]=B-1|0;while(1){B=c[k>>2]|0;F=B+1|0;c[k>>2]=F;J=((d[(c[l>>2]|0)+(B+3|0)|0]|0)^c[i>>2]<<c[j>>2])&c[m>>2];c[i>>2]=J;b[(c[p>>2]|0)+((c[o>>2]&F)<<1)>>1]=b[(c[n>>2]|0)+(J<<1)>>1]|0;b[(c[n>>2]|0)+(c[i>>2]<<1)>>1]=c[k>>2]&65535;J=(c[r>>2]|0)-1|0;c[r>>2]=J;if((J|0)==0){break}}J=(c[k>>2]|0)+1|0;c[k>>2]=J;K=E;L=J}else{J=a[(c[l>>2]|0)+(c[k>>2]|0)|0]|0;b[(c[u>>2]|0)+(c[t>>2]<<1)>>1]=0;F=c[t>>2]|0;c[t>>2]=F+1|0;a[(c[v>>2]|0)+F|0]=J;F=e+148+((J&255)<<2)|0;b[F>>1]=(b[F>>1]|0)+1&65535;F=(c[t>>2]|0)==((c[w>>2]|0)-1|0)&1;c[g>>2]=(c[g>>2]|0)-1|0;J=(c[k>>2]|0)+1|0;c[k>>2]=J;K=F;L=J}}while(0);if((K|0)==0){continue}J=c[y>>2]|0;if((J|0)>-1){M=(c[l>>2]|0)+J|0}else{M=0}a9(z,M,L-J|0,0);c[y>>2]=c[k>>2]|0;J=c[A>>2]|0;F=J+28|0;B=c[F>>2]|0;I=c[B+20>>2]|0;N=J+16|0;O=c[N>>2]|0;P=I>>>0>O>>>0?O:I;do{if((P|0)!=0){I=J+12|0;bl(c[I>>2]|0,c[B+16>>2]|0,P|0);c[I>>2]=(c[I>>2]|0)+P|0;I=(c[F>>2]|0)+16|0;c[I>>2]=(c[I>>2]|0)+P|0;I=J+20|0;c[I>>2]=(c[I>>2]|0)+P|0;c[N>>2]=(c[N>>2]|0)-P|0;I=(c[F>>2]|0)+20|0;c[I>>2]=(c[I>>2]|0)-P|0;I=c[F>>2]|0;if((c[I+20>>2]|0)!=0){break}c[I+16>>2]=c[I+8>>2]|0}}while(0);if((c[(c[A>>2]|0)+16>>2]|0)==0){C=0;D=736;break}}if((D|0)==726){L=c[y>>2]|0;if((L|0)>-1){Q=(c[l>>2]|0)+L|0}else{Q=0}l=(f|0)==4;a9(z,Q,(c[k>>2]|0)-L|0,l&1);c[y>>2]=c[k>>2]|0;k=c[A>>2]|0;y=k+28|0;L=c[y>>2]|0;Q=c[L+20>>2]|0;z=k+16|0;f=c[z>>2]|0;M=Q>>>0>f>>>0?f:Q;do{if((M|0)!=0){Q=k+12|0;bl(c[Q>>2]|0,c[L+16>>2]|0,M|0);c[Q>>2]=(c[Q>>2]|0)+M|0;Q=(c[y>>2]|0)+16|0;c[Q>>2]=(c[Q>>2]|0)+M|0;Q=k+20|0;c[Q>>2]=(c[Q>>2]|0)+M|0;c[z>>2]=(c[z>>2]|0)-M|0;Q=(c[y>>2]|0)+20|0;c[Q>>2]=(c[Q>>2]|0)-M|0;Q=c[y>>2]|0;if((c[Q+20>>2]|0)!=0){break}c[Q+16>>2]=c[Q+8>>2]|0}}while(0);if((c[(c[A>>2]|0)+16>>2]|0)==0){C=l?2:0;return C|0}else{C=l?3:1;return C|0}}else if((D|0)==735){return C|0}else if((D|0)==736){return C|0}return 0}function a5(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;f=c[b+124>>2]|0;g=c[b+56>>2]|0;h=c[b+108>>2]|0;i=g+h|0;j=c[b+120>>2]|0;k=c[b+144>>2]|0;l=(c[b+44>>2]|0)-262|0;m=h>>>0>l>>>0?h-l|0:0;l=c[b+64>>2]|0;n=c[b+52>>2]|0;o=g+(h+258|0)|0;p=c[b+116>>2]|0;q=k>>>0>p>>>0?p:k;k=b+112|0;r=g+(h+1|0)|0;s=g+(h+2|0)|0;t=o;u=h+257|0;v=a[g+(j+h|0)|0]|0;w=a[g+((h-1|0)+j|0)|0]|0;x=d;d=j>>>0<(c[b+140>>2]|0)>>>0?f:f>>>2;f=j;L1038:while(1){j=g+x|0;do{if((a[g+(x+f|0)|0]|0)==v<<24>>24){if((a[g+((f-1|0)+x|0)|0]|0)!=w<<24>>24){y=v;z=w;A=f;break}if((a[j]|0)!=(a[i]|0)){y=v;z=w;A=f;break}if((a[g+(x+1|0)|0]|0)!=(a[r]|0)){y=v;z=w;A=f;break}b=s;B=g+(x+2|0)|0;while(1){C=b+1|0;if((a[C]|0)!=(a[B+1|0]|0)){D=C;break}C=b+2|0;if((a[C]|0)!=(a[B+2|0]|0)){D=C;break}C=b+3|0;if((a[C]|0)!=(a[B+3|0]|0)){D=C;break}C=b+4|0;if((a[C]|0)!=(a[B+4|0]|0)){D=C;break}C=b+5|0;if((a[C]|0)!=(a[B+5|0]|0)){D=C;break}C=b+6|0;if((a[C]|0)!=(a[B+6|0]|0)){D=C;break}C=b+7|0;if((a[C]|0)!=(a[B+7|0]|0)){D=C;break}C=b+8|0;E=B+8|0;if((a[C]|0)==(a[E]|0)&C>>>0<o>>>0){b=C;B=E}else{D=C;break}}B=D-t|0;b=B+258|0;if((b|0)<=(f|0)){y=v;z=w;A=f;break}c[k>>2]=x;if((b|0)>=(q|0)){F=b;G=759;break L1038}y=a[g+(b+h|0)|0]|0;z=a[g+(u+B|0)|0]|0;A=b}else{y=v;z=w;A=f}}while(0);j=e[l+((x&n)<<1)>>1]|0;if(j>>>0<=m>>>0){F=A;G=760;break}b=d-1|0;if((b|0)==0){F=A;G=761;break}else{v=y;w=z;x=j;d=b;f=A}}if((G|0)==759){A=F>>>0>p>>>0;f=A?p:F;return f|0}else if((G|0)==760){A=F>>>0>p>>>0;f=A?p:F;return f|0}else if((G|0)==761){A=F>>>0>p>>>0;f=A?p:F;return f|0}return 0}function a6(a){a=a|0;var d=0,e=0;d=0;while(1){b[a+148+(d<<2)>>1]=0;e=d+1|0;if((e|0)==286){break}else{d=e}}b[a+2440>>1]=0;b[a+2444>>1]=0;b[a+2448>>1]=0;b[a+2452>>1]=0;b[a+2456>>1]=0;b[a+2460>>1]=0;b[a+2464>>1]=0;b[a+2468>>1]=0;b[a+2472>>1]=0;b[a+2476>>1]=0;b[a+2480>>1]=0;b[a+2484>>1]=0;b[a+2488>>1]=0;b[a+2492>>1]=0;b[a+2496>>1]=0;b[a+2500>>1]=0;b[a+2504>>1]=0;b[a+2508>>1]=0;b[a+2512>>1]=0;b[a+2516>>1]=0;b[a+2520>>1]=0;b[a+2524>>1]=0;b[a+2528>>1]=0;b[a+2532>>1]=0;b[a+2536>>1]=0;b[a+2540>>1]=0;b[a+2544>>1]=0;b[a+2548>>1]=0;b[a+2552>>1]=0;b[a+2556>>1]=0;b[a+2684>>1]=0;b[a+2688>>1]=0;b[a+2692>>1]=0;b[a+2696>>1]=0;b[a+2700>>1]=0;b[a+2704>>1]=0;b[a+2708>>1]=0;b[a+2712>>1]=0;b[a+2716>>1]=0;b[a+2720>>1]=0;b[a+2724>>1]=0;b[a+2728>>1]=0;b[a+2732>>1]=0;b[a+2736>>1]=0;b[a+2740>>1]=0;b[a+2744>>1]=0;b[a+2748>>1]=0;b[a+2752>>1]=0;b[a+2756>>1]=0;b[a+1172>>1]=1;c[a+5804>>2]=0;c[a+5800>>2]=0;c[a+5808>>2]=0;c[a+5792>>2]=0;return}function a7(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;g=e+116|0;h=(f|0)==0;i=e+72|0;j=e+88|0;k=e+108|0;l=e+56|0;m=e+84|0;n=e+68|0;o=e+52|0;p=e+64|0;q=e+96|0;r=e+120|0;s=e+112|0;t=e+100|0;u=e+5792|0;v=e+5796|0;w=e+5784|0;x=e+5788|0;y=e+104|0;z=e+92|0;A=e;B=e|0;C=e+128|0;D=e+44|0;E=e+136|0;L1068:while(1){F=c[g>>2]|0;while(1){do{if(F>>>0<262){a2(e);G=c[g>>2]|0;if(G>>>0<262&h){H=0;I=815;break L1068}if((G|0)==0){I=804;break L1068}if(G>>>0>2){I=772;break}c[r>>2]=c[q>>2]|0;c[t>>2]=c[s>>2]|0;c[q>>2]=2;J=2;I=780;break}else{I=772}}while(0);do{if((I|0)==772){I=0;G=c[k>>2]|0;K=((d[(c[l>>2]|0)+(G+2|0)|0]|0)^c[i>>2]<<c[j>>2])&c[m>>2];c[i>>2]=K;L=b[(c[n>>2]|0)+(K<<1)>>1]|0;b[(c[p>>2]|0)+((c[o>>2]&G)<<1)>>1]=L;G=L&65535;b[(c[n>>2]|0)+(c[i>>2]<<1)>>1]=c[k>>2]&65535;K=c[q>>2]|0;c[r>>2]=K;c[t>>2]=c[s>>2]|0;c[q>>2]=2;if(L<<16>>16==0){J=2;I=780;break}if(K>>>0>=(c[C>>2]|0)>>>0){M=K;N=2;break}if(((c[k>>2]|0)-G|0)>>>0>((c[D>>2]|0)-262|0)>>>0){J=2;I=780;break}K=a5(e,G)|0;c[q>>2]=K;if(K>>>0>=6){J=K;I=780;break}if((c[E>>2]|0)!=1){if((K|0)!=3){J=K;I=780;break}if(((c[k>>2]|0)-(c[s>>2]|0)|0)>>>0<=4096){J=3;I=780;break}}c[q>>2]=2;J=2;I=780;break}}while(0);if((I|0)==780){I=0;M=c[r>>2]|0;N=J}if(!(M>>>0<3|N>>>0>M>>>0)){break}if((c[y>>2]|0)==0){c[y>>2]=1;c[k>>2]=(c[k>>2]|0)+1|0;K=(c[g>>2]|0)-1|0;c[g>>2]=K;F=K;continue}K=a[(c[l>>2]|0)+((c[k>>2]|0)-1|0)|0]|0;b[(c[v>>2]|0)+(c[u>>2]<<1)>>1]=0;G=c[u>>2]|0;c[u>>2]=G+1|0;a[(c[w>>2]|0)+G|0]=K;G=e+148+((K&255)<<2)|0;b[G>>1]=(b[G>>1]|0)+1&65535;do{if((c[u>>2]|0)==((c[x>>2]|0)-1|0)){G=c[z>>2]|0;if((G|0)>-1){O=(c[l>>2]|0)+G|0}else{O=0}a9(A,O,(c[k>>2]|0)-G|0,0);c[z>>2]=c[k>>2]|0;G=c[B>>2]|0;K=G+28|0;L=c[K>>2]|0;P=c[L+20>>2]|0;Q=G+16|0;R=c[Q>>2]|0;S=P>>>0>R>>>0?R:P;if((S|0)==0){break}P=G+12|0;bl(c[P>>2]|0,c[L+16>>2]|0,S|0);c[P>>2]=(c[P>>2]|0)+S|0;P=(c[K>>2]|0)+16|0;c[P>>2]=(c[P>>2]|0)+S|0;P=G+20|0;c[P>>2]=(c[P>>2]|0)+S|0;c[Q>>2]=(c[Q>>2]|0)-S|0;Q=(c[K>>2]|0)+20|0;c[Q>>2]=(c[Q>>2]|0)-S|0;S=c[K>>2]|0;if((c[S+20>>2]|0)!=0){break}c[S+16>>2]=c[S+8>>2]|0}}while(0);c[k>>2]=(c[k>>2]|0)+1|0;S=(c[g>>2]|0)-1|0;c[g>>2]=S;if((c[(c[B>>2]|0)+16>>2]|0)==0){H=0;I=817;break L1068}else{F=S}}F=c[k>>2]|0;S=(F-3|0)+(c[g>>2]|0)|0;K=M+253|0;Q=(F+65535|0)-(c[t>>2]|0)|0;b[(c[v>>2]|0)+(c[u>>2]<<1)>>1]=Q&65535;F=c[u>>2]|0;c[u>>2]=F+1|0;a[(c[w>>2]|0)+F|0]=K&255;F=e+148+((d[5255768+(K&255)|0]|0|256)+1<<2)|0;b[F>>1]=(b[F>>1]|0)+1&65535;F=Q+65535&65535;if(F>>>0<256){T=F}else{T=(F>>>7)+256|0}F=e+2440+((d[T+5256496|0]|0)<<2)|0;b[F>>1]=(b[F>>1]|0)+1&65535;F=c[u>>2]|0;Q=(c[x>>2]|0)-1|0;K=c[r>>2]|0;c[g>>2]=(1-K|0)+(c[g>>2]|0)|0;P=K-2|0;c[r>>2]=P;K=P;while(1){P=c[k>>2]|0;G=P+1|0;c[k>>2]=G;if(G>>>0>S>>>0){U=K}else{L=((d[(c[l>>2]|0)+(P+3|0)|0]|0)^c[i>>2]<<c[j>>2])&c[m>>2];c[i>>2]=L;b[(c[p>>2]|0)+((c[o>>2]&G)<<1)>>1]=b[(c[n>>2]|0)+(L<<1)>>1]|0;b[(c[n>>2]|0)+(c[i>>2]<<1)>>1]=c[k>>2]&65535;U=c[r>>2]|0}L=U-1|0;c[r>>2]=L;if((L|0)==0){break}else{K=L}}c[y>>2]=0;c[q>>2]=2;K=(c[k>>2]|0)+1|0;c[k>>2]=K;if((F|0)!=(Q|0)){continue}S=c[z>>2]|0;if((S|0)>-1){V=(c[l>>2]|0)+S|0}else{V=0}a9(A,V,K-S|0,0);c[z>>2]=c[k>>2]|0;S=c[B>>2]|0;K=S+28|0;L=c[K>>2]|0;G=c[L+20>>2]|0;P=S+16|0;R=c[P>>2]|0;W=G>>>0>R>>>0?R:G;do{if((W|0)!=0){G=S+12|0;bl(c[G>>2]|0,c[L+16>>2]|0,W|0);c[G>>2]=(c[G>>2]|0)+W|0;G=(c[K>>2]|0)+16|0;c[G>>2]=(c[G>>2]|0)+W|0;G=S+20|0;c[G>>2]=(c[G>>2]|0)+W|0;c[P>>2]=(c[P>>2]|0)-W|0;G=(c[K>>2]|0)+20|0;c[G>>2]=(c[G>>2]|0)-W|0;G=c[K>>2]|0;if((c[G+20>>2]|0)!=0){break}c[G+16>>2]=c[G+8>>2]|0}}while(0);if((c[(c[B>>2]|0)+16>>2]|0)==0){H=0;I=816;break}}if((I|0)==804){if((c[y>>2]|0)!=0){V=a[(c[l>>2]|0)+((c[k>>2]|0)-1|0)|0]|0;b[(c[v>>2]|0)+(c[u>>2]<<1)>>1]=0;v=c[u>>2]|0;c[u>>2]=v+1|0;a[(c[w>>2]|0)+v|0]=V;v=e+148+((V&255)<<2)|0;b[v>>1]=(b[v>>1]|0)+1&65535;c[y>>2]=0}y=c[z>>2]|0;if((y|0)>-1){X=(c[l>>2]|0)+y|0}else{X=0}l=(f|0)==4;a9(A,X,(c[k>>2]|0)-y|0,l&1);c[z>>2]=c[k>>2]|0;k=c[B>>2]|0;z=k+28|0;y=c[z>>2]|0;X=c[y+20>>2]|0;A=k+16|0;f=c[A>>2]|0;v=X>>>0>f>>>0?f:X;do{if((v|0)!=0){X=k+12|0;bl(c[X>>2]|0,c[y+16>>2]|0,v|0);c[X>>2]=(c[X>>2]|0)+v|0;X=(c[z>>2]|0)+16|0;c[X>>2]=(c[X>>2]|0)+v|0;X=k+20|0;c[X>>2]=(c[X>>2]|0)+v|0;c[A>>2]=(c[A>>2]|0)-v|0;X=(c[z>>2]|0)+20|0;c[X>>2]=(c[X>>2]|0)-v|0;X=c[z>>2]|0;if((c[X+20>>2]|0)!=0){break}c[X+16>>2]=c[X+8>>2]|0}}while(0);if((c[(c[B>>2]|0)+16>>2]|0)==0){H=l?2:0;return H|0}else{H=l?3:1;return H|0}}else if((I|0)==815){return H|0}else if((I|0)==816){return H|0}else if((I|0)==817){return H|0}return 0}function a8(d,f,g,h){d=d|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;i=d+5820|0;j=c[i>>2]|0;k=h&65535;h=d+5816|0;l=e[h>>1]|0|k<<j;m=l&65535;b[h>>1]=m;if((j|0)>13){n=d+20|0;o=c[n>>2]|0;c[n>>2]=o+1|0;p=d+8|0;a[(c[p>>2]|0)+o|0]=l&255;l=(e[h>>1]|0)>>>8&255;o=c[n>>2]|0;c[n>>2]=o+1|0;a[(c[p>>2]|0)+o|0]=l;l=c[i>>2]|0;o=k>>>((16-l|0)>>>0)&65535;b[h>>1]=o;q=l-13|0;r=o}else{q=j+3|0;r=m}c[i>>2]=q;do{if((q|0)>8){m=d+20|0;j=c[m>>2]|0;c[m>>2]=j+1|0;o=d+8|0;a[(c[o>>2]|0)+j|0]=r&255;j=(e[h>>1]|0)>>>8&255;l=c[m>>2]|0;c[m>>2]=l+1|0;a[(c[o>>2]|0)+l|0]=j;s=m;t=o}else{if((q|0)>0){o=d+20|0;m=c[o>>2]|0;c[o>>2]=m+1|0;j=d+8|0;a[(c[j>>2]|0)+m|0]=r&255;s=o;t=j;break}else{s=d+20|0;t=d+8|0;break}}}while(0);b[h>>1]=0;c[i>>2]=0;c[d+5812>>2]=8;d=c[s>>2]|0;c[s>>2]=d+1|0;a[(c[t>>2]|0)+d|0]=g&255;d=c[s>>2]|0;c[s>>2]=d+1|0;a[(c[t>>2]|0)+d|0]=g>>>8&255;d=g&65535^65535;i=c[s>>2]|0;c[s>>2]=i+1|0;a[(c[t>>2]|0)+i|0]=d&255;i=c[s>>2]|0;c[s>>2]=i+1|0;a[(c[t>>2]|0)+i|0]=d>>>8&255;if((g|0)==0){return}else{u=g;v=f}while(1){f=u-1|0;g=a[v]|0;d=c[s>>2]|0;c[s>>2]=d+1|0;a[(c[t>>2]|0)+d|0]=g;if((f|0)==0){break}else{u=f;v=v+1|0}}return}function a9(f,g,h,i){f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;if((c[f+132>>2]|0)>0){j=(c[f>>2]|0)+44|0;if((c[j>>2]|0)==2){k=-201342849;l=0;while(1){if((k&1|0)!=0){if((b[f+148+(l<<2)>>1]|0)!=0){m=0;break}}n=l+1|0;if((n|0)<32){k=k>>>1;l=n}else{o=838;break}}L1166:do{if((o|0)==838){if((b[f+184>>1]|0)!=0){m=1;break}if((b[f+188>>1]|0)!=0){m=1;break}if((b[f+200>>1]|0)==0){p=32}else{m=1;break}while(1){if((p|0)>=256){m=0;break L1166}if((b[f+148+(p<<2)>>1]|0)==0){p=p+1|0}else{m=1;break L1166}}}}while(0);c[j>>2]=m}ba(f,f+2840|0);ba(f,f+2852|0);m=c[f+2844>>2]|0;j=b[f+150>>1]|0;p=j<<16>>16==0;b[f+148+(m+1<<2)+2>>1]=-1;o=f+2752|0;l=f+2756|0;k=f+2748|0;n=p?3:4;q=p?138:7;p=j&65535;j=0;r=-1;L1175:while(1){s=0;t=j;while(1){if((t|0)>(m|0)){break L1175}u=t+1|0;v=b[f+148+(u<<2)+2>>1]|0;w=v&65535;x=s+1|0;y=(p|0)==(w|0);if((x|0)<(q|0)&y){s=x;t=u}else{break}}do{if((x|0)<(n|0)){t=f+2684+(p<<2)|0;b[t>>1]=(e[t>>1]|0)+x&65535}else{if((p|0)==0){if((x|0)<11){b[o>>1]=(b[o>>1]|0)+1&65535;break}else{b[l>>1]=(b[l>>1]|0)+1&65535;break}}else{if((p|0)!=(r|0)){t=f+2684+(p<<2)|0;b[t>>1]=(b[t>>1]|0)+1&65535}b[k>>1]=(b[k>>1]|0)+1&65535;break}}}while(0);if(v<<16>>16==0){n=3;q=138;r=p;p=w;j=u;continue}n=y?3:4;q=y?6:7;r=p;p=w;j=u}u=c[f+2856>>2]|0;j=b[f+2442>>1]|0;w=j<<16>>16==0;b[f+2440+(u+1<<2)+2>>1]=-1;p=w?3:4;r=w?138:7;w=j&65535;j=0;y=-1;L1196:while(1){q=0;n=j;while(1){if((n|0)>(u|0)){break L1196}z=n+1|0;A=b[f+2440+(z<<2)+2>>1]|0;B=A&65535;C=q+1|0;D=(w|0)==(B|0);if((C|0)<(r|0)&D){q=C;n=z}else{break}}do{if((C|0)<(p|0)){n=f+2684+(w<<2)|0;b[n>>1]=(e[n>>1]|0)+C&65535}else{if((w|0)==0){if((C|0)<11){b[o>>1]=(b[o>>1]|0)+1&65535;break}else{b[l>>1]=(b[l>>1]|0)+1&65535;break}}else{if((w|0)!=(y|0)){n=f+2684+(w<<2)|0;b[n>>1]=(b[n>>1]|0)+1&65535}b[k>>1]=(b[k>>1]|0)+1&65535;break}}}while(0);if(A<<16>>16==0){p=3;r=138;y=w;w=B;j=z;continue}p=D?3:4;r=D?6:7;y=w;w=B;j=z}ba(f,f+2864|0);z=18;while(1){if((z|0)<=2){break}if((b[f+2684+((d[z+5255344|0]|0)<<2)+2>>1]|0)==0){z=z-1|0}else{break}}j=f+5800|0;B=((z*3&-1)+17|0)+(c[j>>2]|0)|0;c[j>>2]=B;j=(B+10|0)>>>3;B=((c[f+5804>>2]|0)+10|0)>>>3;E=B>>>0>j>>>0?j:B;F=B;G=z}else{z=h+5|0;E=z;F=z;G=0}do{if((h+4|0)>>>0>E>>>0|(g|0)==0){z=f+5820|0;B=c[z>>2]|0;j=(B|0)>13;if((c[f+136>>2]|0)==4|(F|0)==(E|0)){w=i+2&65535;y=f+5816|0;D=e[y>>1]|0|w<<B;b[y>>1]=D&65535;if(j){r=f+20|0;p=c[r>>2]|0;c[r>>2]=p+1|0;A=f+8|0;a[(c[A>>2]|0)+p|0]=D&255;D=(e[y>>1]|0)>>>8&255;p=c[r>>2]|0;c[r>>2]=p+1|0;a[(c[A>>2]|0)+p|0]=D;D=c[z>>2]|0;b[y>>1]=w>>>((16-D|0)>>>0)&65535;H=D-13|0}else{H=B+3|0}c[z>>2]=H;bb(f,5242884,5244056);break}D=i+4&65535;w=f+5816|0;y=e[w>>1]|0|D<<B;b[w>>1]=y&65535;if(j){j=f+20|0;p=c[j>>2]|0;c[j>>2]=p+1|0;A=f+8|0;a[(c[A>>2]|0)+p|0]=y&255;p=(e[w>>1]|0)>>>8&255;r=c[j>>2]|0;c[j>>2]=r+1|0;a[(c[A>>2]|0)+r|0]=p;p=c[z>>2]|0;r=D>>>((16-p|0)>>>0);b[w>>1]=r&65535;I=p-13|0;J=r}else{I=B+3|0;J=y}c[z>>2]=I;y=c[f+2844>>2]|0;B=c[f+2856>>2]|0;r=G+1|0;p=y+65280&65535;D=J&65535|p<<I;b[w>>1]=D&65535;if((I|0)>11){A=f+20|0;j=c[A>>2]|0;c[A>>2]=j+1|0;k=f+8|0;a[(c[k>>2]|0)+j|0]=D&255;j=(e[w>>1]|0)>>>8&255;l=c[A>>2]|0;c[A>>2]=l+1|0;a[(c[k>>2]|0)+l|0]=j;j=c[z>>2]|0;l=p>>>((16-j|0)>>>0);b[w>>1]=l&65535;K=j-11|0;L=l}else{K=I+5|0;L=D}c[z>>2]=K;D=B&65535;l=D<<K|L&65535;b[w>>1]=l&65535;if((K|0)>11){j=f+20|0;p=c[j>>2]|0;c[j>>2]=p+1|0;k=f+8|0;a[(c[k>>2]|0)+p|0]=l&255;p=(e[w>>1]|0)>>>8&255;A=c[j>>2]|0;c[j>>2]=A+1|0;a[(c[k>>2]|0)+A|0]=p;p=c[z>>2]|0;A=D>>>((16-p|0)>>>0);b[w>>1]=A&65535;M=p-11|0;N=A}else{M=K+5|0;N=l}c[z>>2]=M;l=G+65533&65535;A=l<<M|N&65535;b[w>>1]=A&65535;if((M|0)>12){p=f+20|0;D=c[p>>2]|0;c[p>>2]=D+1|0;k=f+8|0;a[(c[k>>2]|0)+D|0]=A&255;D=(e[w>>1]|0)>>>8&255;j=c[p>>2]|0;c[p>>2]=j+1|0;a[(c[k>>2]|0)+j|0]=D;D=c[z>>2]|0;j=l>>>((16-D|0)>>>0);b[w>>1]=j&65535;O=D-12|0;P=j}else{O=M+4|0;P=A}c[z>>2]=O;L1249:do{if((r|0)>0){A=f+20|0;j=f+8|0;D=0;l=O;k=P;while(1){p=e[f+2684+((d[D+5255344|0]|0)<<2)+2>>1]|0;o=p<<l|k&65535;b[w>>1]=o&65535;if((l|0)>13){C=c[A>>2]|0;c[A>>2]=C+1|0;a[(c[j>>2]|0)+C|0]=o&255;C=(e[w>>1]|0)>>>8&255;u=c[A>>2]|0;c[A>>2]=u+1|0;a[(c[j>>2]|0)+u|0]=C;C=c[z>>2]|0;u=p>>>((16-C|0)>>>0);b[w>>1]=u&65535;Q=C-13|0;R=u}else{Q=l+3|0;R=o}c[z>>2]=Q;o=D+1|0;if((o|0)==(r|0)){break L1249}else{D=o;l=Q;k=R}}}}while(0);r=f+148|0;bc(f,r,y);z=f+2440|0;bc(f,z,B);bb(f,r,z)}else{a8(f,g,h,i)}}while(0);a6(f);if((i|0)==0){return}i=f+5820|0;h=c[i>>2]|0;do{if((h|0)>8){g=f+5816|0;R=b[g>>1]&255;Q=f+20|0;P=c[Q>>2]|0;c[Q>>2]=P+1|0;O=f+8|0;a[(c[O>>2]|0)+P|0]=R;R=(e[g>>1]|0)>>>8&255;P=c[Q>>2]|0;c[Q>>2]=P+1|0;a[(c[O>>2]|0)+P|0]=R;S=g}else{g=f+5816|0;if((h|0)<=0){S=g;break}R=b[g>>1]&255;P=f+20|0;O=c[P>>2]|0;c[P>>2]=O+1|0;a[(c[f+8>>2]|0)+O|0]=R;S=g}}while(0);b[S>>1]=0;c[i>>2]=0;return}function ba(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0;h=i;i=i+32|0;j=h|0;k=g|0;l=c[k>>2]|0;m=g+8|0;n=c[m>>2]|0;o=c[n>>2]|0;p=c[n+12>>2]|0;n=f+5200|0;c[n>>2]=0;q=f+5204|0;c[q>>2]=573;do{if((p|0)>0){r=0;s=-1;while(1){if((b[l+(r<<2)>>1]|0)==0){b[l+(r<<2)+2>>1]=0;t=s}else{u=(c[n>>2]|0)+1|0;c[n>>2]=u;c[f+2908+(u<<2)>>2]=r;a[r+(f+5208)|0]=0;t=r}u=r+1|0;if((u|0)==(p|0)){break}else{r=u;s=t}}s=c[n>>2]|0;if((s|0)<2){v=s;w=t;x=916;break}else{y=t;break}}else{v=0;w=-1;x=916}}while(0);L1277:do{if((x|0)==916){t=f+5800|0;s=f+5804|0;if((o|0)==0){r=w;u=v;while(1){z=(r|0)<2;A=r+1|0;B=z?A:r;C=z?A:0;A=u+1|0;c[n>>2]=A;c[f+2908+(A<<2)>>2]=C;b[l+(C<<2)>>1]=1;a[C+(f+5208)|0]=0;c[t>>2]=(c[t>>2]|0)-1|0;C=c[n>>2]|0;if((C|0)<2){r=B;u=C}else{y=B;break L1277}}}else{u=w;r=v;while(1){B=(u|0)<2;C=u+1|0;A=B?C:u;z=B?C:0;C=r+1|0;c[n>>2]=C;c[f+2908+(C<<2)>>2]=z;b[l+(z<<2)>>1]=1;a[z+(f+5208)|0]=0;c[t>>2]=(c[t>>2]|0)-1|0;c[s>>2]=(c[s>>2]|0)-(e[o+(z<<2)+2>>1]|0)|0;z=c[n>>2]|0;if((z|0)<2){u=A;r=z}else{y=A;break L1277}}}}}while(0);o=g+4|0;c[o>>2]=y;g=c[n>>2]|0;L1285:do{if((g|0)>1){v=(g|0)/2&-1;w=g;while(1){x=c[f+2908+(v<<2)>>2]|0;r=x+(f+5208)|0;u=v<<1;L1289:do{if((u|0)>(w|0)){D=v}else{s=l+(x<<2)|0;t=v;A=u;z=w;while(1){do{if((A|0)<(z|0)){C=A|1;B=c[f+2908+(C<<2)>>2]|0;E=b[l+(B<<2)>>1]|0;F=c[f+2908+(A<<2)>>2]|0;G=b[l+(F<<2)>>1]|0;if((E&65535)>=(G&65535)){if(E<<16>>16!=G<<16>>16){H=A;break}if((d[B+(f+5208)|0]|0)>(d[F+(f+5208)|0]|0)){H=A;break}}H=C}else{H=A}}while(0);C=b[s>>1]|0;F=c[f+2908+(H<<2)>>2]|0;B=b[l+(F<<2)>>1]|0;if((C&65535)<(B&65535)){D=t;break L1289}if(C<<16>>16==B<<16>>16){if((d[r]|0)<=(d[F+(f+5208)|0]|0)){D=t;break L1289}}c[f+2908+(t<<2)>>2]=F;F=H<<1;B=c[n>>2]|0;if((F|0)>(B|0)){D=H;break L1289}else{t=H;A=F;z=B}}}}while(0);c[f+2908+(D<<2)>>2]=x;r=v-1|0;u=c[n>>2]|0;if((r|0)>0){v=r;w=u}else{I=u;break L1285}}}else{I=g}}while(0);g=f+2912|0;D=p;p=I;while(1){I=c[g>>2]|0;H=p-1|0;c[n>>2]=H;w=c[f+2908+(p<<2)>>2]|0;c[g>>2]=w;v=w+(f+5208)|0;L1308:do{if((H|0)<2){J=1}else{u=l+(w<<2)|0;r=1;z=2;A=H;while(1){do{if((z|0)<(A|0)){t=z|1;s=c[f+2908+(t<<2)>>2]|0;B=b[l+(s<<2)>>1]|0;F=c[f+2908+(z<<2)>>2]|0;C=b[l+(F<<2)>>1]|0;if((B&65535)>=(C&65535)){if(B<<16>>16!=C<<16>>16){K=z;break}if((d[s+(f+5208)|0]|0)>(d[F+(f+5208)|0]|0)){K=z;break}}K=t}else{K=z}}while(0);t=b[u>>1]|0;F=c[f+2908+(K<<2)>>2]|0;s=b[l+(F<<2)>>1]|0;if((t&65535)<(s&65535)){J=r;break L1308}if(t<<16>>16==s<<16>>16){if((d[v]|0)<=(d[F+(f+5208)|0]|0)){J=r;break L1308}}c[f+2908+(r<<2)>>2]=F;F=K<<1;s=c[n>>2]|0;if((F|0)>(s|0)){J=K;break L1308}else{r=K;z=F;A=s}}}}while(0);c[f+2908+(J<<2)>>2]=w;v=c[g>>2]|0;H=(c[q>>2]|0)-1|0;c[q>>2]=H;c[f+2908+(H<<2)>>2]=I;H=(c[q>>2]|0)-1|0;c[q>>2]=H;c[f+2908+(H<<2)>>2]=v;H=l+(D<<2)|0;b[H>>1]=(b[l+(v<<2)>>1]|0)+(b[l+(I<<2)>>1]|0)&65535;A=a[I+(f+5208)|0]|0;z=a[v+(f+5208)|0]|0;r=D+(f+5208)|0;a[r]=((A&255)<(z&255)?z:A)+1&255;A=D&65535;b[l+(v<<2)+2>>1]=A;b[l+(I<<2)+2>>1]=A;A=D+1|0;c[g>>2]=D;v=c[n>>2]|0;L1324:do{if((v|0)<2){L=1}else{z=1;u=2;x=v;while(1){do{if((u|0)<(x|0)){s=u|1;F=c[f+2908+(s<<2)>>2]|0;t=b[l+(F<<2)>>1]|0;C=c[f+2908+(u<<2)>>2]|0;B=b[l+(C<<2)>>1]|0;if((t&65535)>=(B&65535)){if(t<<16>>16!=B<<16>>16){M=u;break}if((d[F+(f+5208)|0]|0)>(d[C+(f+5208)|0]|0)){M=u;break}}M=s}else{M=u}}while(0);s=b[H>>1]|0;C=c[f+2908+(M<<2)>>2]|0;F=b[l+(C<<2)>>1]|0;if((s&65535)<(F&65535)){L=z;break L1324}if(s<<16>>16==F<<16>>16){if((d[r]|0)<=(d[C+(f+5208)|0]|0)){L=z;break L1324}}c[f+2908+(z<<2)>>2]=C;C=M<<1;F=c[n>>2]|0;if((C|0)>(F|0)){L=M;break L1324}else{z=M;u=C;x=F}}}}while(0);c[f+2908+(L<<2)>>2]=D;r=c[n>>2]|0;if((r|0)>1){D=A;p=r}else{break}}p=c[g>>2]|0;g=(c[q>>2]|0)-1|0;c[q>>2]=g;c[f+2908+(g<<2)>>2]=p;p=c[k>>2]|0;k=c[o>>2]|0;o=c[m>>2]|0;m=c[o>>2]|0;g=c[o+4>>2]|0;D=c[o+8>>2]|0;n=c[o+16>>2]|0;bk(f+2876|0,0,32);b[p+(c[f+2908+(c[q>>2]<<2)>>2]<<2)+2>>1]=0;o=(c[q>>2]|0)+1|0;L1340:do{if((o|0)<573){q=f+5800|0;L=f+5804|0;L1342:do{if((m|0)==0){M=0;J=o;while(1){K=c[f+2908+(J<<2)>>2]|0;r=p+(K<<2)+2|0;H=(e[p+((e[r>>1]|0)<<2)+2>>1]|0)+1|0;v=(H|0)>(n|0);I=v?n:H;H=(v&1)+M|0;b[r>>1]=I&65535;if((K|0)<=(k|0)){r=f+2876+(I<<1)|0;b[r>>1]=(b[r>>1]|0)+1&65535;if((K|0)<(D|0)){N=0}else{N=c[g+(K-D<<2)>>2]|0}r=Z(e[p+(K<<2)>>1]|0,N+I|0);c[q>>2]=r+(c[q>>2]|0)|0}r=J+1|0;if((r|0)==573){O=H;break L1342}else{M=H;J=r}}}else{J=0;M=o;while(1){r=c[f+2908+(M<<2)>>2]|0;H=p+(r<<2)+2|0;I=(e[p+((e[H>>1]|0)<<2)+2>>1]|0)+1|0;K=(I|0)>(n|0);v=K?n:I;I=(K&1)+J|0;b[H>>1]=v&65535;if((r|0)<=(k|0)){H=f+2876+(v<<1)|0;b[H>>1]=(b[H>>1]|0)+1&65535;if((r|0)<(D|0)){P=0}else{P=c[g+(r-D<<2)>>2]|0}H=e[p+(r<<2)>>1]|0;K=Z(H,P+v|0);c[q>>2]=K+(c[q>>2]|0)|0;K=Z((e[m+(r<<2)+2>>1]|0)+P|0,H);c[L>>2]=K+(c[L>>2]|0)|0}K=M+1|0;if((K|0)==573){O=I;break L1342}else{J=I;M=K}}}}while(0);if((O|0)==0){break}L=f+2876+(n<<1)|0;A=O;while(1){M=n;while(1){J=M-1|0;Q=f+2876+(J<<1)|0;R=b[Q>>1]|0;if(R<<16>>16==0){M=J}else{break}}b[Q>>1]=R-1&65535;J=f+2876+(M<<1)|0;b[J>>1]=(b[J>>1]|0)+2&65535;S=(b[L>>1]|0)-1&65535;b[L>>1]=S;J=A-2|0;if((J|0)>0){A=J}else{break}}if((n|0)==0){break}else{T=n;U=573;V=S}while(1){A=T&65535;L1369:do{if(V<<16>>16==0){W=U}else{L=V&65535;J=U;while(1){K=J;while(1){X=K-1|0;Y=c[f+2908+(X<<2)>>2]|0;if((Y|0)>(k|0)){K=X}else{break}}K=p+(Y<<2)+2|0;I=e[K>>1]|0;if((I|0)!=(T|0)){H=Z(e[p+(Y<<2)>>1]|0,T-I|0);c[q>>2]=H+(c[q>>2]|0)|0;b[K>>1]=A}K=L-1|0;if((K|0)==0){W=X;break L1369}else{L=K;J=X}}}}while(0);A=T-1|0;if((A|0)==0){break L1340}T=A;U=W;V=b[f+2876+(A<<1)>>1]|0}}}while(0);V=1;W=0;while(1){U=(e[f+2876+(V-1<<1)>>1]|0)+(W&65534)<<1;b[j+(V<<1)>>1]=U&65535;T=V+1|0;if((T|0)==16){break}else{V=T;W=U}}if((y|0)<0){i=h;return}W=y+1|0;y=0;while(1){V=b[l+(y<<2)+2>>1]|0;f=V&65535;if(V<<16>>16!=0){V=j+(f<<1)|0;U=b[V>>1]|0;b[V>>1]=U+1&65535;V=0;T=f;f=U&65535;while(1){_=V|f&1;U=T-1|0;if((U|0)>0){V=_<<1;T=U;f=f>>>1}else{break}}b[l+(y<<2)>>1]=_&65535}f=y+1|0;if((f|0)==(W|0)){break}else{y=f}}i=h;return}function bb(f,g,h){f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;i=f+5792|0;L1398:do{if((c[i>>2]|0)==0){j=c[f+5820>>2]|0;k=b[f+5816>>1]|0}else{l=f+5796|0;m=f+5784|0;n=f+5820|0;o=f+5816|0;p=f+20|0;q=f+8|0;r=0;while(1){s=b[(c[l>>2]|0)+(r<<1)>>1]|0;t=s&65535;u=r+1|0;v=d[(c[m>>2]|0)+r|0]|0;do{if(s<<16>>16==0){w=e[g+(v<<2)+2>>1]|0;x=c[n>>2]|0;y=e[g+(v<<2)>>1]|0;z=e[o>>1]|0|y<<x;A=z&65535;b[o>>1]=A;if((x|0)>(16-w|0)){B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=z&255;z=(e[o>>1]|0)>>>8&255;B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=z;z=c[n>>2]|0;B=y>>>((16-z|0)>>>0)&65535;b[o>>1]=B;y=(w-16|0)+z|0;c[n>>2]=y;C=y;D=B;break}else{B=x+w|0;c[n>>2]=B;C=B;D=A;break}}else{A=d[v+5255768|0]|0;B=(A|256)+1|0;w=e[g+(B<<2)+2>>1]|0;x=c[n>>2]|0;y=e[g+(B<<2)>>1]|0;B=e[o>>1]|0|y<<x;z=B&65535;b[o>>1]=z;if((x|0)>(16-w|0)){E=c[p>>2]|0;c[p>>2]=E+1|0;a[(c[q>>2]|0)+E|0]=B&255;B=(e[o>>1]|0)>>>8&255;E=c[p>>2]|0;c[p>>2]=E+1|0;a[(c[q>>2]|0)+E|0]=B;B=c[n>>2]|0;E=y>>>((16-B|0)>>>0)&65535;b[o>>1]=E;F=(w-16|0)+B|0;G=E}else{F=x+w|0;G=z}c[n>>2]=F;z=c[5246712+(A<<2)>>2]|0;do{if((A-8|0)>>>0<20){w=v-(c[5255364+(A<<2)>>2]|0)&65535;x=w<<F|G&65535;E=x&65535;b[o>>1]=E;if((F|0)>(16-z|0)){B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=x&255;x=(e[o>>1]|0)>>>8&255;B=c[p>>2]|0;c[p>>2]=B+1|0;a[(c[q>>2]|0)+B|0]=x;x=c[n>>2]|0;B=w>>>((16-x|0)>>>0)&65535;b[o>>1]=B;w=(z-16|0)+x|0;c[n>>2]=w;H=w;I=B;break}else{B=F+z|0;c[n>>2]=B;H=B;I=E;break}}else{H=F;I=G}}while(0);z=t-1|0;if(z>>>0<256){J=z}else{J=(z>>>7)+256|0}A=d[J+5256496|0]|0;E=e[h+(A<<2)+2>>1]|0;B=e[h+(A<<2)>>1]|0;w=I&65535|B<<H;x=w&65535;b[o>>1]=x;if((H|0)>(16-E|0)){y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=w&255;w=(e[o>>1]|0)>>>8&255;y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=w;w=c[n>>2]|0;y=B>>>((16-w|0)>>>0)&65535;b[o>>1]=y;K=(E-16|0)+w|0;L=y}else{K=H+E|0;L=x}c[n>>2]=K;x=c[5246828+(A<<2)>>2]|0;if((A-4|0)>>>0>=26){C=K;D=L;break}E=z-(c[5255480+(A<<2)>>2]|0)&65535;A=E<<K|L&65535;z=A&65535;b[o>>1]=z;if((K|0)>(16-x|0)){y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=A&255;A=(e[o>>1]|0)>>>8&255;y=c[p>>2]|0;c[p>>2]=y+1|0;a[(c[q>>2]|0)+y|0]=A;A=c[n>>2]|0;y=E>>>((16-A|0)>>>0)&65535;b[o>>1]=y;E=(x-16|0)+A|0;c[n>>2]=E;C=E;D=y;break}else{y=K+x|0;c[n>>2]=y;C=y;D=z;break}}}while(0);if(u>>>0<(c[i>>2]|0)>>>0){r=u}else{j=C;k=D;break L1398}}}}while(0);D=g+1026|0;C=e[D>>1]|0;i=f+5820|0;K=e[g+1024>>1]|0;g=f+5816|0;L=k&65535|K<<j;b[g>>1]=L&65535;if((j|0)>(16-C|0)){k=f+20|0;H=c[k>>2]|0;c[k>>2]=H+1|0;I=f+8|0;a[(c[I>>2]|0)+H|0]=L&255;L=(e[g>>1]|0)>>>8&255;H=c[k>>2]|0;c[k>>2]=H+1|0;a[(c[I>>2]|0)+H|0]=L;L=c[i>>2]|0;b[g>>1]=K>>>((16-L|0)>>>0)&65535;K=(C-16|0)+L|0;c[i>>2]=K;L=b[D>>1]|0;g=L&65535;H=f+5812|0;c[H>>2]=g;return}else{K=j+C|0;c[i>>2]=K;L=b[D>>1]|0;g=L&65535;H=f+5812|0;c[H>>2]=g;return}}function bc(d,f,g){d=d|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;h=b[f+2>>1]|0;i=h<<16>>16==0;j=d+2754|0;k=d+5820|0;l=d+2752|0;m=d+5816|0;n=d+20|0;o=d+8|0;p=d+2758|0;q=d+2756|0;r=d+2750|0;s=d+2748|0;t=0;u=-1;v=h&65535;h=i?138:7;w=i?3:4;L1438:while(1){i=t;x=0;while(1){if((i|0)>(g|0)){break L1438}y=i+1|0;z=b[f+(y<<2)+2>>1]|0;A=z&65535;B=x+1|0;C=(v|0)==(A|0);if((B|0)<(h|0)&C){i=y;x=B}else{break}}L1444:do{if((B|0)<(w|0)){i=d+2684+(v<<2)+2|0;D=d+2684+(v<<2)|0;E=B;F=c[k>>2]|0;G=b[m>>1]|0;while(1){H=e[i>>1]|0;I=e[D>>1]|0;J=G&65535|I<<F;K=J&65535;b[m>>1]=K;if((F|0)>(16-H|0)){L=c[n>>2]|0;c[n>>2]=L+1|0;a[(c[o>>2]|0)+L|0]=J&255;J=(e[m>>1]|0)>>>8&255;L=c[n>>2]|0;c[n>>2]=L+1|0;a[(c[o>>2]|0)+L|0]=J;J=c[k>>2]|0;L=I>>>((16-J|0)>>>0)&65535;b[m>>1]=L;M=(H-16|0)+J|0;N=L}else{M=F+H|0;N=K}c[k>>2]=M;K=E-1|0;if((K|0)==0){break L1444}else{E=K;F=M;G=N}}}else{if((v|0)!=0){if((v|0)==(u|0)){O=B;P=c[k>>2]|0;Q=b[m>>1]|0}else{G=e[d+2684+(v<<2)+2>>1]|0;F=c[k>>2]|0;E=e[d+2684+(v<<2)>>1]|0;D=e[m>>1]|0|E<<F;i=D&65535;b[m>>1]=i;if((F|0)>(16-G|0)){K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=D&255;D=(e[m>>1]|0)>>>8&255;K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=D;D=c[k>>2]|0;K=E>>>((16-D|0)>>>0)&65535;b[m>>1]=K;R=(G-16|0)+D|0;S=K}else{R=F+G|0;S=i}c[k>>2]=R;O=x;P=R;Q=S}i=e[r>>1]|0;G=e[s>>1]|0;F=Q&65535|G<<P;b[m>>1]=F&65535;if((P|0)>(16-i|0)){K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=F&255;K=(e[m>>1]|0)>>>8&255;D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=K;K=c[k>>2]|0;D=G>>>((16-K|0)>>>0);b[m>>1]=D&65535;T=(i-16|0)+K|0;U=D}else{T=P+i|0;U=F}c[k>>2]=T;F=O+65533&65535;i=U&65535|F<<T;b[m>>1]=i&65535;if((T|0)>14){D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=i&255;i=(e[m>>1]|0)>>>8&255;D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=i;i=c[k>>2]|0;b[m>>1]=F>>>((16-i|0)>>>0)&65535;c[k>>2]=i-14|0;break}else{c[k>>2]=T+2|0;break}}if((B|0)<11){i=e[j>>1]|0;F=c[k>>2]|0;D=e[l>>1]|0;K=e[m>>1]|0|D<<F;b[m>>1]=K&65535;if((F|0)>(16-i|0)){G=c[n>>2]|0;c[n>>2]=G+1|0;a[(c[o>>2]|0)+G|0]=K&255;G=(e[m>>1]|0)>>>8&255;E=c[n>>2]|0;c[n>>2]=E+1|0;a[(c[o>>2]|0)+E|0]=G;G=c[k>>2]|0;E=D>>>((16-G|0)>>>0);b[m>>1]=E&65535;V=(i-16|0)+G|0;W=E}else{V=F+i|0;W=K}c[k>>2]=V;K=x+65534&65535;i=W&65535|K<<V;b[m>>1]=i&65535;if((V|0)>13){F=c[n>>2]|0;c[n>>2]=F+1|0;a[(c[o>>2]|0)+F|0]=i&255;i=(e[m>>1]|0)>>>8&255;F=c[n>>2]|0;c[n>>2]=F+1|0;a[(c[o>>2]|0)+F|0]=i;i=c[k>>2]|0;b[m>>1]=K>>>((16-i|0)>>>0)&65535;c[k>>2]=i-13|0;break}else{c[k>>2]=V+3|0;break}}else{i=e[p>>1]|0;K=c[k>>2]|0;F=e[q>>1]|0;E=e[m>>1]|0|F<<K;b[m>>1]=E&65535;if((K|0)>(16-i|0)){G=c[n>>2]|0;c[n>>2]=G+1|0;a[(c[o>>2]|0)+G|0]=E&255;G=(e[m>>1]|0)>>>8&255;D=c[n>>2]|0;c[n>>2]=D+1|0;a[(c[o>>2]|0)+D|0]=G;G=c[k>>2]|0;D=F>>>((16-G|0)>>>0);b[m>>1]=D&65535;X=(i-16|0)+G|0;Y=D}else{X=K+i|0;Y=E}c[k>>2]=X;E=x+65526&65535;i=Y&65535|E<<X;b[m>>1]=i&65535;if((X|0)>9){K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=i&255;i=(e[m>>1]|0)>>>8&255;K=c[n>>2]|0;c[n>>2]=K+1|0;a[(c[o>>2]|0)+K|0]=i;i=c[k>>2]|0;b[m>>1]=E>>>((16-i|0)>>>0)&65535;c[k>>2]=i-9|0;break}else{c[k>>2]=X+7|0;break}}}}while(0);if(z<<16>>16==0){t=y;u=v;v=A;h=138;w=3;continue}t=y;u=v;v=A;h=C?6:7;w=C?3:4}return}function bd(a,b,c){a=a|0;b=b|0;c=c|0;return bi(Z(c,b))|0}function be(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;if((b|0)==0){return}a=b-8|0;d=a;e=c[1314010]|0;if(a>>>0<e>>>0){ao()}f=c[b-4>>2]|0;g=f&3;if((g|0)==1){ao()}h=f&-8;i=b+(h-8|0)|0;j=i;L1502:do{if((f&1|0)==0){k=c[a>>2]|0;if((g|0)==0){return}l=-8-k|0;m=b+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){ao()}if((n|0)==(c[1314011]|0)){p=b+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1314008]=o;c[p>>2]=c[p>>2]&-2;c[b+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[b+(l+8|0)>>2]|0;s=c[b+(l+12|0)>>2]|0;t=5256064+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){ao()}if((c[k+12>>2]|0)==(n|0)){break}ao()}}while(0);if((s|0)==(k|0)){c[1314006]=c[1314006]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){ao()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}ao()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[b+(l+24|0)>>2]|0;v=c[b+(l+12|0)>>2]|0;L1536:do{if((v|0)==(t|0)){w=b+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=b+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L1536}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){ao()}else{c[C>>2]=0;A=B;break}}else{w=c[b+(l+8|0)>>2]|0;if(w>>>0<e>>>0){ao()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){ao()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{ao()}}}while(0);if((p|0)==0){q=n;r=o;break}v=b+(l+28|0)|0;m=5256328+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1314007]=c[1314007]&(1<<c[v>>2]^-1);q=n;r=o;break L1502}else{if(p>>>0<(c[1314010]|0)>>>0){ao()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1502}}}while(0);if(A>>>0<(c[1314010]|0)>>>0){ao()}c[A+24>>2]=p;t=c[b+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1314010]|0)>>>0){ao()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[b+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1314010]|0)>>>0){ao()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){ao()}A=b+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){ao()}do{if((e&2|0)==0){if((j|0)==(c[1314012]|0)){B=(c[1314009]|0)+r|0;c[1314009]=B;c[1314012]=q;c[q+4>>2]=B|1;if((q|0)==(c[1314011]|0)){c[1314011]=0;c[1314008]=0}if(B>>>0<=(c[1314013]|0)>>>0){return}do{if((c[1311054]|0)==0){B=an(8)|0;if((B-1&B|0)==0){c[1311056]=B;c[1311055]=B;c[1311057]=-1;c[1311058]=2097152;c[1311059]=0;c[1314117]=0;c[1311054]=aG(0)&-16^1431655768;break}else{ao()}}}while(0);o=c[1314012]|0;if((o|0)==0){return}n=c[1314009]|0;do{if(n>>>0>40){l=c[1311056]|0;B=Z(((((n-41|0)+l|0)>>>0)/(l>>>0)>>>0)-1|0,l);C=o;u=5256472;while(1){g=c[u>>2]|0;if(g>>>0<=C>>>0){if((g+(c[u+4>>2]|0)|0)>>>0>C>>>0){D=u;break}}g=c[u+8>>2]|0;if((g|0)==0){D=0;break}else{u=g}}if((c[D+12>>2]&8|0)!=0){break}u=aC(0)|0;C=D+4|0;if((u|0)!=((c[D>>2]|0)+(c[C>>2]|0)|0)){break}g=aC(-(B>>>0>2147483646?-2147483648-l|0:B)|0)|0;a=aC(0)|0;if(!((g|0)!=-1&a>>>0<u>>>0)){break}g=u-a|0;if((u|0)==(a|0)){break}c[C>>2]=(c[C>>2]|0)-g|0;c[1314114]=(c[1314114]|0)-g|0;C=c[1314012]|0;a=(c[1314009]|0)-g|0;g=C;u=C+8|0;if((u&7|0)==0){E=0}else{E=-u&7}u=a-E|0;c[1314012]=g+E|0;c[1314009]=u;c[g+(E+4|0)>>2]=u|1;c[g+(a+4|0)>>2]=40;c[1314013]=c[1311058]|0;return}}while(0);if((c[1314009]|0)>>>0<=(c[1314013]|0)>>>0){return}c[1314013]=-1;return}if((j|0)==(c[1314011]|0)){o=(c[1314008]|0)+r|0;c[1314008]=o;c[1314011]=q;c[q+4>>2]=o|1;c[d+o>>2]=o;return}o=(e&-8)+r|0;n=e>>>3;L1636:do{if(e>>>0<256){a=c[b+h>>2]|0;g=c[b+(h|4)>>2]|0;u=5256064+(n<<1<<2)|0;do{if((a|0)!=(u|0)){if(a>>>0<(c[1314010]|0)>>>0){ao()}if((c[a+12>>2]|0)==(j|0)){break}ao()}}while(0);if((g|0)==(a|0)){c[1314006]=c[1314006]&(1<<n^-1);break}do{if((g|0)==(u|0)){F=g+8|0}else{if(g>>>0<(c[1314010]|0)>>>0){ao()}B=g+8|0;if((c[B>>2]|0)==(j|0)){F=B;break}ao()}}while(0);c[a+12>>2]=g;c[F>>2]=a}else{u=i;B=c[b+(h+16|0)>>2]|0;l=c[b+(h|4)>>2]|0;L1638:do{if((l|0)==(u|0)){C=b+(h+12|0)|0;f=c[C>>2]|0;do{if((f|0)==0){t=b+(h+8|0)|0;p=c[t>>2]|0;if((p|0)==0){G=0;break L1638}else{H=p;I=t;break}}else{H=f;I=C}}while(0);while(1){C=H+20|0;f=c[C>>2]|0;if((f|0)!=0){H=f;I=C;continue}C=H+16|0;f=c[C>>2]|0;if((f|0)==0){break}else{H=f;I=C}}if(I>>>0<(c[1314010]|0)>>>0){ao()}else{c[I>>2]=0;G=H;break}}else{C=c[b+h>>2]|0;if(C>>>0<(c[1314010]|0)>>>0){ao()}f=C+12|0;if((c[f>>2]|0)!=(u|0)){ao()}t=l+8|0;if((c[t>>2]|0)==(u|0)){c[f>>2]=l;c[t>>2]=C;G=l;break}else{ao()}}}while(0);if((B|0)==0){break}l=b+(h+20|0)|0;a=5256328+(c[l>>2]<<2)|0;do{if((u|0)==(c[a>>2]|0)){c[a>>2]=G;if((G|0)!=0){break}c[1314007]=c[1314007]&(1<<c[l>>2]^-1);break L1636}else{if(B>>>0<(c[1314010]|0)>>>0){ao()}g=B+16|0;if((c[g>>2]|0)==(u|0)){c[g>>2]=G}else{c[B+20>>2]=G}if((G|0)==0){break L1636}}}while(0);if(G>>>0<(c[1314010]|0)>>>0){ao()}c[G+24>>2]=B;u=c[b+(h+8|0)>>2]|0;do{if((u|0)!=0){if(u>>>0<(c[1314010]|0)>>>0){ao()}else{c[G+16>>2]=u;c[u+24>>2]=G;break}}}while(0);u=c[b+(h+12|0)>>2]|0;if((u|0)==0){break}if(u>>>0<(c[1314010]|0)>>>0){ao()}else{c[G+20>>2]=u;c[u+24>>2]=G;break}}}while(0);c[q+4>>2]=o|1;c[d+o>>2]=o;if((q|0)!=(c[1314011]|0)){J=o;break}c[1314008]=o;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;J=r}}while(0);r=J>>>3;if(J>>>0<256){d=r<<1;e=5256064+(d<<2)|0;A=c[1314006]|0;G=1<<r;do{if((A&G|0)==0){c[1314006]=A|G;K=e;L=5256064+(d+2<<2)|0}else{r=5256064+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1314010]|0)>>>0){K=h;L=r;break}ao()}}while(0);c[L>>2]=q;c[K+12>>2]=q;c[q+8>>2]=K;c[q+12>>2]=e;return}e=q;K=J>>>8;do{if((K|0)==0){M=0}else{if(J>>>0>16777215){M=31;break}L=(K+1048320|0)>>>16&8;d=K<<L;G=(d+520192|0)>>>16&4;A=d<<G;d=(A+245760|0)>>>16&2;r=(14-(G|L|d)|0)+(A<<d>>>15)|0;M=J>>>((r+7|0)>>>0)&1|r<<1}}while(0);K=5256328+(M<<2)|0;c[q+28>>2]=M;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1314007]|0;d=1<<M;do{if((r&d|0)==0){c[1314007]=r|d;c[K>>2]=e;c[q+24>>2]=K;c[q+12>>2]=q;c[q+8>>2]=q}else{if((M|0)==31){N=0}else{N=25-(M>>>1)|0}A=J<<N;L=c[K>>2]|0;while(1){if((c[L+4>>2]&-8|0)==(J|0)){break}O=L+16+(A>>>31<<2)|0;G=c[O>>2]|0;if((G|0)==0){P=1217;break}else{A=A<<1;L=G}}if((P|0)==1217){if(O>>>0<(c[1314010]|0)>>>0){ao()}else{c[O>>2]=e;c[q+24>>2]=L;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=L+8|0;o=c[A>>2]|0;G=c[1314010]|0;if(L>>>0<G>>>0){ao()}if(o>>>0<G>>>0){ao()}else{c[o+12>>2]=e;c[A>>2]=e;c[q+8>>2]=o;c[q+12>>2]=L;c[q+24>>2]=0;break}}}while(0);q=(c[1314014]|0)-1|0;c[1314014]=q;if((q|0)==0){Q=5256480}else{return}while(1){q=c[Q>>2]|0;if((q|0)==0){break}else{Q=q+8|0}}c[1314014]=-1;return}function bf(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=a>>>16;f=a&65535;if((c|0)==1){a=(d[b]|0)+f|0;g=a>>>0>65520?a-65521|0:a;a=g+e|0;h=(a>>>0>65520?a+15|0:a)<<16|g;return h|0}if((b|0)==0){h=1;return h|0}if(c>>>0<16){L1761:do{if((c|0)==0){i=f;j=e}else{g=f;a=b;k=c;l=e;while(1){m=k-1|0;n=(d[a]|0)+g|0;o=n+l|0;if((m|0)==0){i=n;j=o;break L1761}else{g=n;a=a+1|0;k=m;l=o}}}}while(0);h=(j>>>0)%65521<<16|(i>>>0>65520?i-65521|0:i);return h|0}do{if(c>>>0>5551){i=f;j=b;l=c;k=e;while(1){p=l-5552|0;a=347;g=k;o=j;m=i;while(1){n=(d[o]|0)+m|0;q=n+(d[o+1|0]|0)|0;r=q+(d[o+2|0]|0)|0;s=r+(d[o+3|0]|0)|0;t=s+(d[o+4|0]|0)|0;u=t+(d[o+5|0]|0)|0;v=u+(d[o+6|0]|0)|0;w=v+(d[o+7|0]|0)|0;x=w+(d[o+8|0]|0)|0;y=x+(d[o+9|0]|0)|0;z=y+(d[o+10|0]|0)|0;A=z+(d[o+11|0]|0)|0;B=A+(d[o+12|0]|0)|0;C=B+(d[o+13|0]|0)|0;D=C+(d[o+14|0]|0)|0;E=D+(d[o+15|0]|0)|0;F=(((((((((((((((n+g|0)+q|0)+r|0)+s|0)+t|0)+u|0)+v|0)+w|0)+x|0)+y|0)+z|0)+A|0)+B|0)+C|0)+D|0)+E|0;D=a-1|0;if((D|0)==0){break}else{a=D;g=F;o=o+16|0;m=E}}G=j+5552|0;H=(E>>>0)%65521;I=(F>>>0)%65521;if(p>>>0>5551){i=H;j=G;l=p;k=I}else{break}}if((p|0)==0){J=I;K=H;break}if(p>>>0>15){L=H;M=G;N=p;O=I;P=1277;break}else{Q=H;R=G;S=p;T=I;P=1278;break}}else{L=f;M=b;N=c;O=e;P=1277}}while(0);do{if((P|0)==1277){while(1){P=0;U=N-16|0;e=(d[M]|0)+L|0;c=e+(d[M+1|0]|0)|0;b=c+(d[M+2|0]|0)|0;f=b+(d[M+3|0]|0)|0;I=f+(d[M+4|0]|0)|0;p=I+(d[M+5|0]|0)|0;G=p+(d[M+6|0]|0)|0;H=G+(d[M+7|0]|0)|0;F=H+(d[M+8|0]|0)|0;E=F+(d[M+9|0]|0)|0;k=E+(d[M+10|0]|0)|0;l=k+(d[M+11|0]|0)|0;j=l+(d[M+12|0]|0)|0;i=j+(d[M+13|0]|0)|0;m=i+(d[M+14|0]|0)|0;V=m+(d[M+15|0]|0)|0;W=(((((((((((((((e+O|0)+c|0)+b|0)+f|0)+I|0)+p|0)+G|0)+H|0)+F|0)+E|0)+k|0)+l|0)+j|0)+i|0)+m|0)+V|0;X=M+16|0;if(U>>>0>15){L=V;M=X;N=U;O=W;P=1277}else{break}}if((U|0)==0){Y=V;Z=W;P=1279;break}else{Q=V;R=X;S=U;T=W;P=1278;break}}}while(0);L1779:do{if((P|0)==1278){while(1){P=0;W=S-1|0;U=(d[R]|0)+Q|0;X=U+T|0;if((W|0)==0){Y=U;Z=X;P=1279;break L1779}else{Q=U;R=R+1|0;S=W;T=X;P=1278}}}}while(0);if((P|0)==1279){J=(Z>>>0)%65521;K=(Y>>>0)%65521}h=J<<16|K;return h|0}function bg(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)==0){f=0;return f|0}g=a^-1;L1790:do{if((e|0)==0){h=g}else{a=b;i=e;j=g;while(1){if((a&3|0)==0){break}k=c[5247032+(((d[a]|0)^j&255)<<2)>>2]^j>>>8;l=i-1|0;if((l|0)==0){h=k;break L1790}else{a=a+1|0;i=l;j=k}}k=a;L1795:do{if(i>>>0>31){l=i;m=j;n=k;while(1){o=c[n>>2]^m;p=c[5249080+((o>>>8&255)<<2)>>2]^c[5250104+((o&255)<<2)>>2]^c[5248056+((o>>>16&255)<<2)>>2]^c[5247032+(o>>>24<<2)>>2]^c[n+4>>2];o=c[5249080+((p>>>8&255)<<2)>>2]^c[5250104+((p&255)<<2)>>2]^c[5248056+((p>>>16&255)<<2)>>2]^c[5247032+(p>>>24<<2)>>2]^c[n+8>>2];p=c[5249080+((o>>>8&255)<<2)>>2]^c[5250104+((o&255)<<2)>>2]^c[5248056+((o>>>16&255)<<2)>>2]^c[5247032+(o>>>24<<2)>>2]^c[n+12>>2];o=c[5249080+((p>>>8&255)<<2)>>2]^c[5250104+((p&255)<<2)>>2]^c[5248056+((p>>>16&255)<<2)>>2]^c[5247032+(p>>>24<<2)>>2]^c[n+16>>2];p=c[5249080+((o>>>8&255)<<2)>>2]^c[5250104+((o&255)<<2)>>2]^c[5248056+((o>>>16&255)<<2)>>2]^c[5247032+(o>>>24<<2)>>2]^c[n+20>>2];o=c[5249080+((p>>>8&255)<<2)>>2]^c[5250104+((p&255)<<2)>>2]^c[5248056+((p>>>16&255)<<2)>>2]^c[5247032+(p>>>24<<2)>>2]^c[n+24>>2];p=n+32|0;q=c[5249080+((o>>>8&255)<<2)>>2]^c[5250104+((o&255)<<2)>>2]^c[5248056+((o>>>16&255)<<2)>>2]^c[5247032+(o>>>24<<2)>>2]^c[n+28>>2];o=c[5249080+((q>>>8&255)<<2)>>2]^c[5250104+((q&255)<<2)>>2]^c[5248056+((q>>>16&255)<<2)>>2]^c[5247032+(q>>>24<<2)>>2];q=l-32|0;if(q>>>0>31){l=q;m=o;n=p}else{r=q;s=o;t=p;break L1795}}}else{r=i;s=j;t=k}}while(0);L1799:do{if(r>>>0>3){k=r;j=s;i=t;while(1){a=i+4|0;n=c[i>>2]^j;m=c[5249080+((n>>>8&255)<<2)>>2]^c[5250104+((n&255)<<2)>>2]^c[5248056+((n>>>16&255)<<2)>>2]^c[5247032+(n>>>24<<2)>>2];n=k-4|0;if(n>>>0>3){k=n;j=m;i=a}else{u=n;v=m;w=a;break L1799}}}else{u=r;v=s;w=t}}while(0);if((u|0)==0){h=v;break}i=v;j=u;k=w;while(1){a=c[5247032+(((d[k]|0)^i&255)<<2)>>2]^i>>>8;m=j-1|0;if((m|0)==0){h=a;break L1790}else{i=a;j=m;k=k+1|0}}}}while(0);f=h^-1;return f|0}function bh(d,f,g,h,j,k){d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;l=i;i=i+32|0;m=l|0;n=i;i=i+32|0;bk(m|0,0,32);o=(g|0)==0;L1809:do{if(!o){p=0;while(1){q=m+((e[f+(p<<1)>>1]|0)<<1)|0;b[q>>1]=(b[q>>1]|0)+1&65535;q=p+1|0;if((q|0)==(g|0)){break L1809}else{p=q}}}}while(0);p=c[j>>2]|0;q=15;while(1){if((q|0)==0){r=1307;break}if((b[m+(q<<1)>>1]|0)==0){q=q-1|0}else{break}}if((r|0)==1307){s=c[h>>2]|0;c[h>>2]=s+4|0;a[s|0]=64;a[s+1|0]=1;b[s+2>>1]=0;s=c[h>>2]|0;c[h>>2]=s+4|0;a[s|0]=64;a[s+1|0]=1;b[s+2>>1]=0;c[j>>2]=1;t=0;i=l;return t|0}s=p>>>0>q>>>0?q:p;p=1;while(1){if(p>>>0>=q>>>0){break}if((b[m+(p<<1)>>1]|0)==0){p=p+1|0}else{break}}u=s>>>0<p>>>0?p:s;s=1;v=1;while(1){if(v>>>0>=16){break}w=(s<<1)-(e[m+(v<<1)>>1]|0)|0;if((w|0)<0){t=-1;r=1356;break}else{s=w;v=v+1|0}}if((r|0)==1356){i=l;return t|0}do{if((s|0)>0){if((d|0)!=0&(q|0)==1){break}else{t=-1}i=l;return t|0}}while(0);b[n+2>>1]=0;s=b[m+2>>1]|0;b[n+4>>1]=s;v=(b[m+4>>1]|0)+s&65535;b[n+6>>1]=v;s=(b[m+6>>1]|0)+v&65535;b[n+8>>1]=s;v=(b[m+8>>1]|0)+s&65535;b[n+10>>1]=v;s=(b[m+10>>1]|0)+v&65535;b[n+12>>1]=s;v=(b[m+12>>1]|0)+s&65535;b[n+14>>1]=v;s=(b[m+14>>1]|0)+v&65535;b[n+16>>1]=s;v=(b[m+16>>1]|0)+s&65535;b[n+18>>1]=v;s=(b[m+18>>1]|0)+v&65535;b[n+20>>1]=s;v=(b[m+20>>1]|0)+s&65535;b[n+22>>1]=v;s=(b[m+22>>1]|0)+v&65535;b[n+24>>1]=s;v=(b[m+24>>1]|0)+s&65535;b[n+26>>1]=v;s=(b[m+26>>1]|0)+v&65535;b[n+28>>1]=s;b[n+30>>1]=(b[m+28>>1]|0)+s&65535;L1834:do{if(!o){s=0;while(1){v=b[f+(s<<1)>>1]|0;if(v<<16>>16!=0){w=n+((v&65535)<<1)|0;v=b[w>>1]|0;b[w>>1]=v+1&65535;b[k+((v&65535)<<1)>>1]=s&65535}v=s+1|0;if((v|0)==(g|0)){break L1834}else{s=v}}}}while(0);do{if((d|0)==0){x=0;y=1<<u;z=19;A=k;B=k;C=0}else if((d|0)==1){g=1<<u;if(g>>>0>851){t=1}else{x=1;y=g;z=256;A=5243726;B=5243790;C=0;break}i=l;return t|0}else{g=1<<u;n=(d|0)==2;if(n&g>>>0>591){t=1}else{x=0;y=g;z=-1;A=5244368;B=5244432;C=n;break}i=l;return t|0}}while(0);d=y-1|0;n=u&255;g=c[h>>2]|0;o=-1;s=0;v=y;y=0;w=u;D=0;E=p;L1848:while(1){p=1<<w;F=s;G=D;H=E;while(1){I=H-y|0;J=I&255;K=b[k+(G<<1)>>1]|0;L=K&65535;do{if((L|0)<(z|0)){M=0;N=K}else{if((L|0)<=(z|0)){M=96;N=0;break}M=b[A+(L<<1)>>1]&255;N=b[B+(L<<1)>>1]|0}}while(0);L=1<<I;K=F>>>(y>>>0);O=p;while(1){P=O-L|0;Q=P+K|0;a[g+(Q<<2)|0]=M;a[g+(Q<<2)+1|0]=J;b[g+(Q<<2)+2>>1]=N;if((O|0)==(L|0)){break}else{O=P}}O=1<<H-1;while(1){if((O&F|0)==0){break}else{O=O>>>1}}if((O|0)==0){R=0}else{R=(O-1&F)+O|0}S=G+1|0;L=m+(H<<1)|0;K=(b[L>>1]|0)-1&65535;b[L>>1]=K;if(K<<16>>16==0){if((H|0)==(q|0)){break L1848}T=e[f+((e[k+(S<<1)>>1]|0)<<1)>>1]|0}else{T=H}if(T>>>0<=u>>>0){F=R;G=S;H=T;continue}U=R&d;if((U|0)==(o|0)){F=R;G=S;H=T}else{break}}H=(y|0)==0?u:y;G=g+(p<<2)|0;F=T-H|0;L1871:do{if(T>>>0<q>>>0){K=F;L=1<<F;I=T;while(1){P=L-(e[m+(I<<1)>>1]|0)|0;if((P|0)<1){V=K;break L1871}Q=K+1|0;W=Q+H|0;if(W>>>0<q>>>0){K=Q;L=P<<1;I=W}else{V=Q;break L1871}}}else{V=F}}while(0);F=(1<<V)+v|0;if(x&F>>>0>851|C&F>>>0>591){t=1;r=1360;break}a[(c[h>>2]|0)+(U<<2)|0]=V&255;a[(c[h>>2]|0)+(U<<2)+1|0]=n;p=c[h>>2]|0;b[p+(U<<2)+2>>1]=(G-p|0)>>>2&65535;g=G;o=U;s=R;v=F;y=H;w=V;D=S;E=T}if((r|0)==1360){i=l;return t|0}L1881:do{if((R|0)!=0){r=q;T=y;E=R;S=J;D=g;while(1){do{if((T|0)==0){X=D;Y=S;Z=0;_=r}else{if((E&d|0)==(o|0)){X=D;Y=S;Z=T;_=r;break}X=c[h>>2]|0;Y=n;Z=0;_=u}}while(0);V=E>>>(Z>>>0);a[X+(V<<2)|0]=64;a[X+(V<<2)+1|0]=Y;b[X+(V<<2)+2>>1]=0;V=1<<_-1;while(1){if((V&E|0)==0){break}else{V=V>>>1}}if((V|0)==0){break L1881}w=(V-1&E)+V|0;if((w|0)==0){break L1881}else{r=_;T=Z;E=w;S=Y;D=X}}}}while(0);c[h>>2]=(c[h>>2]|0)+(v<<2)|0;c[j>>2]=u;t=0;i=l;return t|0}function bi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aE=0,aF=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1314006]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=5256064+(h<<2)|0;j=5256064+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1314006]=e&(1<<g^-1)}else{if(l>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{ao();return 0;return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1314008]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=5256064+(p<<2)|0;m=5256064+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1314006]=e&(1<<r^-1)}else{if(l>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{ao();return 0;return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1314008]|0;if((l|0)!=0){q=c[1314011]|0;d=l>>>3;l=d<<1;f=5256064+(l<<2)|0;k=c[1314006]|0;h=1<<d;do{if((k&h|0)==0){c[1314006]=k|h;s=f;t=5256064+(l+2<<2)|0}else{d=5256064+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1314010]|0)>>>0){s=g;t=d;break}ao();return 0;return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1314008]=m;c[1314011]=e;n=i;return n|0}l=c[1314007]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[5256328+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1314010]|0;if(r>>>0<i>>>0){ao();return 0;return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){ao();return 0;return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L2073:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L2073}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){ao();return 0;return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){ao();return 0;return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){ao();return 0;return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{ao();return 0;return 0}}}while(0);L2095:do{if((e|0)!=0){f=d+28|0;i=5256328+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1314007]=c[1314007]&(1<<c[f>>2]^-1);break L2095}else{if(e>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L2095}}}while(0);if(v>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[1314008]|0;if((f|0)!=0){e=c[1314011]|0;i=f>>>3;f=i<<1;q=5256064+(f<<2)|0;k=c[1314006]|0;g=1<<i;do{if((k&g|0)==0){c[1314006]=k|g;y=q;z=5256064+(f+2<<2)|0}else{i=5256064+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1314010]|0)>>>0){y=l;z=i;break}ao();return 0;return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1314008]=p;c[1314011]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1314007]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[5256328+(A<<2)>>2]|0;L1903:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L1903}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L1903}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[5256328+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L1918:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L1918}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[1314008]|0)-g|0)>>>0){o=g;break}k=K;q=c[1314010]|0;if(k>>>0<q>>>0){ao();return 0;return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){ao();return 0;return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L1931:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L1931}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){ao();return 0;return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){ao();return 0;return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){ao();return 0;return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{ao();return 0;return 0}}}while(0);L1953:do{if((e|0)!=0){i=K+28|0;q=5256328+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[1314007]=c[1314007]&(1<<c[i>>2]^-1);break L1953}else{if(e>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L1953}}}while(0);if(L>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=5256064+(e<<2)|0;r=c[1314006]|0;j=1<<i;do{if((r&j|0)==0){c[1314006]=r|j;O=q;P=5256064+(e+2<<2)|0}else{i=5256064+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1314010]|0)>>>0){O=d;P=i;break}ao();return 0;return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=5256328+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[1314007]|0;l=1<<Q;if((q&l|0)==0){c[1314007]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=1512;break}else{l=l<<1;q=j}}if((T|0)==1512){if(S>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[1314010]|0;if(q>>>0<i>>>0){ao();return 0;return 0}if(j>>>0<i>>>0){ao();return 0;return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[1314008]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1314011]|0;if(S>>>0>15){R=J;c[1314011]=R+o|0;c[1314008]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1314008]=0;c[1314011]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1314009]|0;if(o>>>0<J>>>0){S=J-o|0;c[1314009]=S;J=c[1314012]|0;K=J;c[1314012]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1311054]|0)==0){J=an(8)|0;if((J-1&J|0)==0){c[1311056]=J;c[1311055]=J;c[1311057]=-1;c[1311058]=2097152;c[1311059]=0;c[1314117]=0;c[1311054]=aG(0)&-16^1431655768;break}else{ao();return 0;return 0}}}while(0);J=o+48|0;S=c[1311056]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1314116]|0;do{if((O|0)!=0){P=c[1314114]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L2162:do{if((c[1314117]&4|0)==0){O=c[1314012]|0;L2164:do{if((O|0)==0){T=1542}else{L=O;P=5256472;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=1542;break L2164}else{P=M}}if((P|0)==0){T=1542;break}L=R-(c[1314009]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=aC(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=1551;break}}while(0);do{if((T|0)==1542){O=aC(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1311055]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[1314114]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[1314116]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=aC($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=1551;break}}while(0);L2184:do{if((T|0)==1551){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=1562;break L2162}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1311056]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aC(O|0)|0)==-1){aC(q|0);W=Y;break L2184}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=1562;break L2162}}}while(0);c[1314117]=c[1314117]|4;ad=W;T=1559;break}else{ad=0;T=1559}}while(0);do{if((T|0)==1559){if(S>>>0>=2147483647){break}W=aC(S|0)|0;Z=aC(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=1562;break}}}while(0);do{if((T|0)==1562){ad=(c[1314114]|0)+aa|0;c[1314114]=ad;if(ad>>>0>(c[1314115]|0)>>>0){c[1314115]=ad}ad=c[1314012]|0;L2204:do{if((ad|0)==0){S=c[1314010]|0;if((S|0)==0|ab>>>0<S>>>0){c[1314010]=ab}c[1314118]=ab;c[1314119]=aa;c[1314121]=0;c[1314015]=c[1311054]|0;c[1314014]=-1;S=0;while(1){Y=S<<1;ac=5256064+(Y<<2)|0;c[5256064+(Y+3<<2)>>2]=ac;c[5256064+(Y+2<<2)>>2]=ac;ac=S+1|0;if((ac|0)==32){break}else{S=ac}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[1314012]=ab+ae|0;c[1314009]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[1314013]=c[1311058]|0}else{S=5256472;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=1574;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==1574){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[1314012]|0;Y=(c[1314009]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1314012]=Z+ai|0;c[1314009]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[1314013]=c[1311058]|0;break L2204}}while(0);if(ab>>>0<(c[1314010]|0)>>>0){c[1314010]=ab}S=ab+aa|0;Y=5256472;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=1584;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==1584){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[1314012]|0)){J=(c[1314009]|0)+K|0;c[1314009]=J;c[1314012]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[1314011]|0)){J=(c[1314008]|0)+K|0;c[1314008]=J;c[1314011]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L2249:do{if(X>>>0<256){U=c[ab+((al|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+al|0)>>2]|0;R=5256064+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}if((c[U+12>>2]|0)==(Z|0)){break}ao();return 0;return 0}}while(0);if((Q|0)==(U|0)){c[1314006]=c[1314006]&(1<<V^-1);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){am=q;break}ao();return 0;return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;q=c[ab+((al|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+al|0)>>2]|0;L2270:do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){ap=0;break L2270}else{aq=M;ar=e;break}}else{aq=L;ar=g}}while(0);while(1){g=aq+20|0;L=c[g>>2]|0;if((L|0)!=0){aq=L;ar=g;continue}g=aq+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{aq=L;ar=g}}if(ar>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[ar>>2]=0;ap=aq;break}}else{g=c[ab+((al|8)+aa|0)>>2]|0;if(g>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){ao();return 0;return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;ap=P;break}else{ao();return 0;return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+al|0)|0;U=5256328+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=ap;if((ap|0)!=0){break}c[1314007]=c[1314007]&(1<<c[P>>2]^-1);break L2249}else{if(q>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=ap}else{c[q+20>>2]=ap}if((ap|0)==0){break L2249}}}while(0);if(ap>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}c[ap+24>>2]=q;R=al|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[ap+16>>2]=P;c[P+24>>2]=ap;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[ap+20>>2]=P;c[P+24>>2]=ap;break}}}while(0);as=ab+(($|al)+aa|0)|0;at=$+K|0}else{as=Z;at=K}J=as+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=at|1;c[ab+(at+W|0)>>2]=at;J=at>>>3;if(at>>>0<256){V=J<<1;X=5256064+(V<<2)|0;P=c[1314006]|0;q=1<<J;do{if((P&q|0)==0){c[1314006]=P|q;au=X;av=5256064+(V+2<<2)|0}else{J=5256064+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1314010]|0)>>>0){au=U;av=J;break}ao();return 0;return 0}}while(0);c[av>>2]=_;c[au+12>>2]=_;c[ab+(W+8|0)>>2]=au;c[ab+(W+12|0)>>2]=X;break}V=ac;q=at>>>8;do{if((q|0)==0){aw=0}else{if(at>>>0>16777215){aw=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;aw=at>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5256328+(aw<<2)|0;c[ab+(W+28|0)>>2]=aw;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[1314007]|0;Q=1<<aw;if((X&Q|0)==0){c[1314007]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((aw|0)==31){ax=0}else{ax=25-(aw>>>1)|0}Q=at<<ax;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(at|0)){break}ay=X+16+(Q>>>31<<2)|0;q=c[ay>>2]|0;if((q|0)==0){T=1657;break}else{Q=Q<<1;X=q}}if((T|0)==1657){if(ay>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[ay>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[1314010]|0;if(X>>>0<$>>>0){ao();return 0;return 0}if(q>>>0<$>>>0){ao();return 0;return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=5256472;while(1){az=c[W>>2]|0;if(az>>>0<=Y>>>0){aA=c[W+4>>2]|0;aB=az+aA|0;if(aB>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=az+(aA-39|0)|0;if((W&7|0)==0){aE=0}else{aE=-W&7}W=az+((aA-47|0)+aE|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aF=0}else{aF=-_&7}_=(aa-40|0)-aF|0;c[1314012]=ab+aF|0;c[1314009]=_;c[ab+(aF+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[1314013]=c[1311058]|0;c[ac+4>>2]=27;bl(W|0,5256472,16);c[1314118]=ab;c[1314119]=aa;c[1314121]=0;c[1314120]=W;W=ac+28|0;c[W>>2]=7;L2368:do{if((ac+32|0)>>>0<aB>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aB>>>0){_=K}else{break L2368}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=5256064+(K<<2)|0;S=c[1314006]|0;q=1<<_;do{if((S&q|0)==0){c[1314006]=S|q;aH=Z;aI=5256064+(K+2<<2)|0}else{_=5256064+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[1314010]|0)>>>0){aH=Q;aI=_;break}ao();return 0;return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aJ=0}else{if(W>>>0>16777215){aJ=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aJ=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5256328+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1314007]|0;Q=1<<aJ;if((Z&Q|0)==0){c[1314007]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=W<<aK;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aL=Z+16+(Q>>>31<<2)|0;q=c[aL>>2]|0;if((q|0)==0){T=1692;break}else{Q=Q<<1;Z=q}}if((T|0)==1692){if(aL>>>0<(c[1314010]|0)>>>0){ao();return 0;return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[1314010]|0;if(Z>>>0<q>>>0){ao();return 0;return 0}if(W>>>0<q>>>0){ao();return 0;return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1314009]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[1314009]=W;ad=c[1314012]|0;Q=ad;c[1314012]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[aD()>>2]=12;n=0;return n|0}function bj(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function bk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function bl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function bm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return aI[a&15](b|0,c|0,d|0)|0}function bn(a,b){a=a|0;b=b|0;aJ[a&15](b|0)}function bo(a,b,c){a=a|0;b=b|0;c=c|0;aK[a&15](b|0,c|0)}function bp(a,b){a=a|0;b=b|0;return aL[a&15](b|0)|0}function bq(a){a=a|0;aM[a&15]()}function br(a,b,c){a=a|0;b=b|0;c=c|0;return aN[a&15](b|0,c|0)|0}function bs(a,b,c){a=a|0;b=b|0;c=c|0;_(0);return 0}function bt(a){a=a|0;_(1)}function bu(a,b){a=a|0;b=b|0;_(2)}function bv(a){a=a|0;_(3);return 0}function bw(){_(4)}function bx(a,b){a=a|0;b=b|0;_(5);return 0}
// EMSCRIPTEN_END_FUNCS
var aI=[bs,bs,bs,bs,bd,bs,bs,bs,bs,bs,bs,bs,bs,bs,bs,bs];var aJ=[bt,bt,bt,bt,bt,bt,bt,bt,bt,bt,bt,bt,bt,bt,bt,bt];var aK=[bu,bu,bu,bu,bu,bu,bu,bu,bu,bu,be,bu,bu,bu,bu,bu];var aL=[bv,bv,bv,bv,bv,bv,bv,bv,bv,bv,bv,bv,bv,bv,bv,bv];var aM=[bw,bw,bw,bw,bw,bw,bw,bw,bw,bw,bw,bw,bw,bw,bw,bw];var aN=[bx,bx,a4,bx,bx,bx,a7,bx,a3,bx,bx,bx,bx,bx,bx,bx];return{_malloc:bi,_strlen:bj,_memcpy:bl,_main:a1,_memset:bk,stackAlloc:aO,stackSave:aP,stackRestore:aQ,setThrew:aR,setTempRet0:aS,setTempRet1:aT,setTempRet2:aU,setTempRet3:aV,setTempRet4:aW,setTempRet5:aX,setTempRet6:aY,setTempRet7:aZ,setTempRet8:a_,setTempRet9:a$,dynCall_iiii:bm,dynCall_vi:bn,dynCall_vii:bo,dynCall_ii:bp,dynCall_v:bq,dynCall_iii:br}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, invoke_iiii: invoke_iiii, invoke_vi: invoke_vi, invoke_vii: invoke_vii, invoke_ii: invoke_ii, invoke_v: invoke_v, invoke_iii: invoke_iii, _strncmp: _strncmp, _llvm_lifetime_end: _llvm_lifetime_end, _sysconf: _sysconf, _abort: _abort, _fprintf: _fprintf, _printf: _printf, __reallyNegative: __reallyNegative, _fputc: _fputc, _puts: _puts, ___setErrNo: ___setErrNo, _fwrite: _fwrite, _write: _write, _fputs: _fputs, __formatString: __formatString, _free: _free, ___assert_func: ___assert_func, _pwrite: _pwrite, _sbrk: _sbrk, ___errno_location: ___errno_location, _llvm_lifetime_start: _llvm_lifetime_start, _llvm_bswap_i32: _llvm_bswap_i32, _time: _time, _strcmp: _strcmp, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, NaN: NaN, Infinity: Infinity }, buffer);
var _malloc = Module["_malloc"] = asm._malloc;
var _strlen = Module["_strlen"] = asm._strlen;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var _main = Module["_main"] = asm._main;
var _memset = Module["_memset"] = asm._memset;
var dynCall_iiii = Module["dynCall_iiii"] = asm.dynCall_iiii;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_vii = Module["dynCall_vii"] = asm.dynCall_vii;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
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
