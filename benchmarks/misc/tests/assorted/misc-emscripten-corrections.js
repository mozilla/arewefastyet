var saved = {print: print, printErr: printErr};
print = function() {};
printErr = function() {};

var j = void 0, k = !0, m = null, n = !1, o = [], aa = "object" === typeof process, ba = "object" === typeof window, ca = "function" === typeof importScripts, da = !ba && !aa && !ca;

if (aa) {
  print = (function(a) {
    process.stdout.write(a + "\n");
  });
  printErr = (function(a) {
    process.stderr.write(a + "\n");
  });
  var ea = require("fs");
  read = (function(a) {
    var b = ea.readFileSync(a).toString();
    !b && "/" != a[0] && (a = __dirname.split("/").slice(0, -1).join("/") + "/src/" + a, b = ea.readFileSync(a).toString());
    return b;
  });
  load = (function(a) {
    fa(read(a));
  });
  o = process.argv.slice(2);
} else {
  if (da) {
    this.read || (this.read = (function(a) {
      snarf(a);
    })), o = this.arguments ? arguments : scriptArgs;
  } else {
    if (ba) {
      this.print = printErr = (function(a) {
        console.log(a);
      }), this.read = (function(a) {
        var b = new XMLHttpRequest;
        b.open("GET", a, n);
        b.send(m);
        return b.responseText;
      }), this.arguments && (o = arguments);
    } else {
      if (ca) {
        this.load = importScripts;
      } else {
        throw "Unknown runtime environment. Where are we?";
      }
    }
  }
}

function fa(a) {
  eval.call(m, a);
}

"undefined" == typeof load && "undefined" != typeof read && (this.load = (function(a) {
  fa(read(a));
}));

"undefined" === typeof printErr && (this.printErr = (function() {}));

"undefined" === typeof print && (this.print = printErr);

try {
  this.Module = Module;
} catch (ga) {
  this.Module = Module = {};
}

Module.arguments || (Module.arguments = o);

Module.print && (print = Module.print);

function ha(a) {
  if (1 == p) {
    return 1;
  }
  var b = {
    "%i1": 1,
    "%i8": 1,
    "%i16": 2,
    "%i32": 4,
    "%i64": 8,
    "%float": 4,
    "%double": 8
  }["%" + a];
  b || ("*" == a[a.length - 1] ? b = p : "i" == a[0] && (a = parseInt(a.substr(1)), r(0 == a % 8), b = a / 8));
  return b;
}

function ia(a) {
  var b = u;
  u += a;
  u = u + 3 >> 2 << 2;
  return b;
}

function ja(a) {
  var b = v;
  v += a;
  v = v + 3 >> 2 << 2;
  if (v >= w) {
    for (; w <= v; ) {
      w = 2 * w + 4095 >> 12 << 12;
    }
    var a = x, c = new ArrayBuffer(w);
    x = new Int8Array(c);
    y = new Int16Array(c);
    C = new Int32Array(c);
    D = new Uint8Array(c);
    E = new Uint16Array(c);
    G = new Uint32Array(c);
    H = new Float32Array(c);
    x.set(a);
  }
  return b;
}

var p = 4, ka = {}, J;

function K(a) {
  print(a + ":\n" + Error().stack);
  throw "Assertion: " + a;
}

function r(a, b) {
  a || K("Assertion failed: " + b);
}

var la = this;

Module.ccall = (function(a, b, c, d) {
  try {
    var e = eval("_" + a);
  } catch (g) {
    try {
      e = la.Module["_" + a];
    } catch (f) {}
  }
  r(e, "Cannot call unknown function " + a + " (perhaps LLVM optimizations or closure removed it?)");
  var i = 0, a = d ? d.map((function(a) {
    if ("string" == c[i++]) {
      var b = u;
      ia(a.length + 1);
      ma(a, b);
      a = b;
    }
    return a;
  })) : [];
  return (function(a, b) {
    return "string" == b ? na(a) : a;
  })(e.apply(m, a), b);
});

function oa(a, b, c) {
  c = c || "i8";
  "*" === c[c.length - 1] && (c = "i32");
  switch (c) {
   case "i1":
    x[a] = b;
    break;
   case "i8":
    x[a] = b;
    break;
   case "i16":
    y[a >> 1] = b;
    break;
   case "i32":
    C[a >> 2] = b;
    break;
   case "i64":
    C[a >> 2] = b;
    break;
   case "float":
    H[a >> 2] = b;
    break;
   case "double":
    H[a >> 2] = b;
    break;
   default:
    K("invalid type for setValue: " + c);
  }
}

Module.setValue = oa;

Module.getValue = (function(a, b) {
  b = b || "i8";
  "*" === b[b.length - 1] && (b = "i32");
  switch (b) {
   case "i1":
    return x[a];
   case "i8":
    return x[a];
   case "i16":
    return y[a >> 1];
   case "i32":
    return C[a >> 2];
   case "i64":
    return C[a >> 2];
   case "float":
    return H[a >> 2];
   case "double":
    return H[a >> 2];
   default:
    K("invalid type for setValue: " + b);
  }
  return m;
});

var pa = 1, L = 2;

Module.ALLOC_NORMAL = 0;

Module.ALLOC_STACK = pa;

Module.ALLOC_STATIC = L;

function M(a, b, c) {
  var d, e;
  "number" === typeof a ? (d = k, e = a) : (d = n, e = a.length);
  var g = "string" === typeof b ? b : m, c = [ qa, ia, ja ][c === j ? L : c](Math.max(e, g ? 1 : b.length));
  if (d) {
    b = c;
    a = e;
    e = 0;
    if (20 <= a) {
      for (a = b + a; b % 4; ) {
        x[b++] = e;
      }
      0 > e && (e += 256);
      b >>= 2;
      g = a >> 2;
      for (d = e | e << 8 | e << 16 | e << 24; b < g; ) {
        C[b++] = d;
      }
      for (b <<= 2; b < a; ) {
        x[b++] = e;
      }
    } else {
      for (; a--; ) {
        x[b++] = e;
      }
    }
    return c;
  }
  d = 0;
  for (var f; d < e; ) {
    var i = a[d];
    "function" === typeof i && (i = ka.w(i));
    f = g || b[d];
    0 === f ? d++ : ("i64" == f && (f = "i32"), oa(c + d, i, f), d += ha(f));
  }
  return c;
}

Module.allocate = M;

function na(a, b) {
  for (var c = "undefined" == typeof b, d = "", e = 0, g, f = String.fromCharCode(0); ; ) {
    g = String.fromCharCode(D[a + e]);
    if (c && g == f) {
      break;
    }
    d += g;
    e += 1;
    if (!c && e == b) {
      break;
    }
  }
  return d;
}

Module.Pointer_stringify = na;

Module.Array_stringify = (function(a) {
  for (var b = "", c = 0; c < a.length; c++) {
    b += String.fromCharCode(a[c]);
  }
  return b;
});

var N, x, D, y, E, C, G, H, u, O, v, ra = Module.TOTAL_STACK || 5242880, w = Module.TOTAL_MEMORY || 104857600;

r(!!Int32Array && !!Float64Array && !!(new Int32Array(1)).subarray && !!(new Int32Array(1)).set, "Cannot fallback to non-typed array case: Code is too specialized");

var P = new ArrayBuffer(w);

x = new Int8Array(P);

y = new Int16Array(P);

C = new Int32Array(P);

D = new Uint8Array(P);

E = new Uint16Array(P);

G = new Uint32Array(P);

H = new Float32Array(P);

C[0] = 255;

r(255 === D[0] && 0 === D[3], "Typed arrays 2 must be run on a little-endian system");

var R = Q("(null)");

v = R.length;

for (var S = 0; S < R.length; S++) {
  x[S] = R[S];
}

Module.HEAP = j;

Module.HEAP8 = x;

Module.HEAP16 = y;

Module.HEAP32 = C;

Module.HEAPU8 = D;

Module.HEAPU16 = E;

Module.HEAPU32 = G;

Module.HEAPF32 = H;

O = (u = 4 * Math.ceil(v / 4)) + ra;

var T = 8 * Math.ceil(O / 8);

x.subarray(T);

C.subarray(T >> 2);

H.subarray(T >> 2);

(new Float64Array(x.buffer)).subarray(T >> 3);

O = T + 8;

v = O + 4095 >> 12 << 12;

function sa(a) {
  for (; 0 < a.length; ) {
    var b = a.shift(), c = b.i;
    "number" === typeof c && (c = N[c]);
    c(b.s === j ? m : b.s);
  }
}

var ta = [], ua = [];

function va(a, b) {
  return Array.prototype.slice.call(x.subarray(a, a + b));
}

Module.Array_copy = va;

Module.TypedArray_copy = (function(a, b) {
  for (var c = new Uint8Array(b), d = 0; d < b; ++d) {
    c[d] = x[a + d];
  }
  return c.buffer;
});

function wa(a) {
  for (var b = 0; x[a + b]; ) {
    b++;
  }
  return b;
}

Module.String_len = wa;

function xa(a, b) {
  var c = wa(a);
  b && c++;
  var d = va(a, c);
  b && (d[c - 1] = 0);
  return d;
}

Module.String_copy = xa;

function Q(a, b) {
  for (var c = [], d = 0; d < a.length; ) {
    var e = a.charCodeAt(d);
    255 < e && (e &= 255);
    c.push(e);
    d += 1;
  }
  b || c.push(0);
  return c;
}

Module.intArrayFromString = Q;

Module.intArrayToString = (function(a) {
  for (var b = [], c = 0; c < a.length; c++) {
    var d = a[c];
    255 < d && (d &= 255);
    b.push(String.fromCharCode(d));
  }
  return b.join("");
});

function ma(a, b, c) {
  for (var d = 0; d < a.length; ) {
    var e = a.charCodeAt(d);
    255 < e && (e &= 255);
    x[b + d] = e;
    d += 1;
  }
  c || (x[b + d] = 0);
}

Module.writeStringToMemory = ma;

var ya = [];

function za(a, b) {
  return 0 <= a ? a : 32 >= b ? 2 * Math.abs(1 << b - 1) + a : Math.pow(2, b) + a;
}

function Aa(a, b) {
  if (0 >= a) {
    return a;
  }
  var c = 32 >= b ? Math.abs(1 << b - 1) : Math.pow(2, b - 1);
  if (a >= c && (32 >= b || a > c)) {
    a = -2 * c + a;
  }
  return a;
}

function Ba() {
  for (var a = 0, b = 0, c = 0; ; ) {
    for (var d = c % 5 + 1 | 0, e = c % 3 + 1 | 0, g = a, a = 0; ; ) {
      var f = a / d + g | 0, f = 1e3 < f >>> 0 ? Math.floor((f >>> 0) / (e >>> 0)) : f;
      if (0 == (a & 3 | 0)) {
        var i = Ca(a | 0), f = (f >>> 0) + i * (0 == (a & 7 | 0) ? 1 : -1), f = 0 <= f ? Math.floor(f) : Math.ceil(f);
      }
      var i = f << 16 >> 16, i = i * i % 256 + (b & 65535) | 0, q = i & 65535, a = a + 1 | 0;
      if (4100 == (a | 0)) {
        break;
      }
      g = f;
      b = q;
    }
    c = c + 1 | 0;
    if (4100 == (c | 0)) {
      break;
    }
    a = f;
    b = q;
  }
  d = (J = u, u += 8, C[J >> 2] = f, C[J + 4 >> 2] = i & 65535, J);
  c = C[U >> 2];
  b = Da(d);
  d = u;
  e = M(b, "i8", pa);
  b = 1 * b.length;
  0 != b && -1 == Ea(c, e, b) && V[c] && (V[c].error = k);
  u = d;
  return 1;
}

Module._main = Ba;

var Ca = Math.sqrt, W = 13, Fa = 9, Ga = 22, Ha = 5, Ia = 21, Ja = 6;

function X(a) {
  Ka || (Ka = M([ 0 ], "i32", L));
  C[Ka >> 2] = a;
}

var Ka, La = 0, U = 0, Ma = 0, Na = 2, V = [ m ], Oa = k;

function Pa(a, b) {
  if ("string" !== typeof a) {
    return m;
  }
  b === j && (b = "/");
  a && "/" == a[0] && (b = "");
  for (var c = (b + "/" + a).split("/").reverse(), d = [ "" ]; c.length; ) {
    var e = c.pop();
    "" == e || "." == e || (".." == e ? 1 < d.length && d.pop() : d.push(e));
  }
  return 1 == d.length ? "/" : d.join("/");
}

function Qa(a, b, c) {
  var d = {
    v: n,
    g: n,
    error: 0,
    name: m,
    path: m,
    object: m,
    l: n,
    n: m,
    m: m
  }, a = Pa(a);
  if ("/" == a) {
    d.v = k, d.g = d.l = k, d.name = "/", d.path = d.n = "/", d.object = d.m = Y;
  } else {
    if (a !== m) {
      for (var c = c || 0, a = a.slice(1).split("/"), e = Y, g = [ "" ]; a.length; ) {
        1 == a.length && e.b && (d.l = k, d.n = 1 == g.length ? "/" : g.join("/"), d.m = e, d.name = a[0]);
        var f = a.shift();
        if (e.b) {
          if (e.p) {
            if (!e.a.hasOwnProperty(f)) {
              d.error = 2;
              break;
            }
          } else {
            d.error = W;
            break;
          }
        } else {
          d.error = 20;
          break;
        }
        e = e.a[f];
        if (e.link && !(b && 0 == a.length)) {
          if (40 < c) {
            d.error = 40;
            break;
          }
          d = Pa(e.link, g.join("/"));
          return Qa([ d ].concat(a).join("/"), b, c + 1);
        }
        g.push(f);
        0 == a.length && (d.g = k, d.path = g.join("/"), d.object = e);
      }
    }
  }
  return d;
}

function Ra(a) {
  Sa();
  a = Qa(a, j);
  if (a.g) {
    return a.object;
  }
  X(a.error);
  return m;
}

function Ta(a, b, c, d, e) {
  a || (a = "/");
  "string" === typeof a && (a = Ra(a));
  if (!a) {
    throw X(W), Error("Parent path must exist.");
  }
  if (!a.b) {
    throw X(20), Error("Parent must be a folder.");
  }
  if (!a.write && !Oa) {
    throw X(W), Error("Parent folder must be writeable.");
  }
  if (!b || "." == b || ".." == b) {
    throw X(2), Error("Name must not be empty.");
  }
  if (a.a.hasOwnProperty(b)) {
    throw X(17), Error("Can't overwrite object.");
  }
  a.a[b] = {
    p: d === j ? k : d,
    write: e === j ? n : e,
    timestamp: Date.now(),
    u: Na++
  };
  for (var g in c) {
    c.hasOwnProperty(g) && (a.a[b][g] = c[g]);
  }
  return a.a[b];
}

function Ua(a, b) {
  return Ta(a, b, {
    b: k,
    d: n,
    a: {}
  }, k, k);
}

function Va() {
  var a = "dev/shm/tmp", b = Ra("/");
  if (b === m) {
    throw Error("Invalid parent.");
  }
  for (a = a.split("/").reverse(); a.length; ) {
    var c = a.pop();
    c && (b.a.hasOwnProperty(c) || Ua(b, c), b = b.a[c]);
  }
}

function Z(a, b, c, d) {
  if (!c && !d) {
    throw Error("A device must have at least one callback defined.");
  }
  var e = {
    d: k,
    input: c,
    c: d
  };
  e.b = n;
  return Ta(a, b, e, Boolean(c), Boolean(d));
}

function Sa() {
  Y || (Y = {
    p: k,
    write: k,
    b: k,
    d: n,
    timestamp: Date.now(),
    u: 1,
    a: {}
  });
}

function Wa() {
  var a, b, c;
  r(!$, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  $ = k;
  Sa();
  a || (a = (function() {
    if (!a.f || !a.f.length) {
      var b;
      "undefined" != typeof window && "function" == typeof window.prompt ? b = window.prompt("Input: ") : "function" == typeof readline && (b = readline());
      b || (b = "");
      a.f = Q(b + "\n", k);
    }
    return a.f.shift();
  }));
  b || (b = (function(a) {
    a === m || 10 === a ? (b.o(b.buffer.join("")), b.buffer = []) : b.buffer.push(String.fromCharCode(a));
  }));
  b.o || (b.o = print);
  b.buffer || (b.buffer = []);
  c || (c = b);
  Ua("/", "tmp");
  var d = Ua("/", "dev"), e = Z(d, "stdin", a), g = Z(d, "stdout", m, b);
  c = Z(d, "stderr", m, c);
  Z(d, "tty", a, b);
  V[1] = {
    path: "/dev/stdin",
    object: e,
    position: 0,
    k: k,
    e: n,
    j: n,
    error: n,
    h: n,
    q: []
  };
  V[2] = {
    path: "/dev/stdout",
    object: g,
    position: 0,
    k: n,
    e: k,
    j: n,
    error: n,
    h: n,
    q: []
  };
  V[3] = {
    path: "/dev/stderr",
    object: c,
    position: 0,
    k: n,
    e: k,
    j: n,
    error: n,
    h: n,
    q: []
  };
  La = M([ 1 ], "void*", L);
  U = M([ 2 ], "void*", L);
  Ma = M([ 3 ], "void*", L);
  Va();
  V[La] = V[1];
  V[U] = V[2];
  V[Ma] = V[3];
  M([ M([ 0, 0, 0, 0, La, 0, 0, 0, U, 0, 0, 0, Ma, 0, 0, 0 ], "void*", L) ], "void*", L);
}

var $, Y;

function Ea(a, b, c) {
  var d = V[a];
  if (d) {
    if (d.e) {
      if (0 > c) {
        return X(Ga), -1;
      }
      if (d.object.d) {
        if (d.object.c) {
          for (var e = 0; e < c; e++) {
            try {
              d.object.c(x[b + e]);
            } catch (g) {
              return X(Ha), -1;
            }
          }
          d.object.timestamp = Date.now();
          return e;
        }
        X(Ja);
        return -1;
      }
      e = d.position;
      a = V[a];
      if (!a || a.object.d) {
        X(Fa), b = -1;
      } else {
        if (a.e) {
          if (a.object.b) {
            X(Ia), b = -1;
          } else {
            if (0 > c || 0 > e) {
              X(Ga), b = -1;
            } else {
              for (var f = a.object.a; f.length < e; ) {
                f.push(0);
              }
              for (var i = 0; i < c; i++) {
                f[e + i] = D[b + i];
              }
              a.object.timestamp = Date.now();
              b = i;
            }
          }
        } else {
          X(W), b = -1;
        }
      }
      -1 != b && (d.position += b);
      return b;
    }
    X(W);
    return -1;
  }
  X(Fa);
  return -1;
}

function Da(a) {
  function b(b) {
    var c;
    "double" === b ? c = H[a + d >> 2] : "i64" == b ? c = [ C[a + d >> 2], C[a + d + 4 >> 2] ] : (b = "i32", c = C[a + d >> 2]);
    d += Math.max(ha(b), p);
    return c;
  }
  for (var c = ya.r | 0, d = 0, e = [], g, f; ; ) {
    var i = c;
    g = x[c];
    if (0 === g) {
      break;
    }
    f = x[c + 1];
    if (37 == g) {
      var q = n, z = n, A = n, F = n;
      a : for (;;) {
        switch (f) {
         case 43:
          q = k;
          break;
         case 45:
          z = k;
          break;
         case 35:
          A = k;
          break;
         case 48:
          if (F) {
            break a;
          } else {
            F = k;
            break;
          }
         default:
          break a;
        }
        c++;
        f = x[c + 1];
      }
      var B = 0;
      if (42 == f) {
        B = b("i32"), c++, f = x[c + 1];
      } else {
        for (; 48 <= f && 57 >= f; ) {
          B = 10 * B + (f - 48), c++, f = x[c + 1];
        }
      }
      var I = n;
      if (46 == f) {
        var s = 0, I = k;
        c++;
        f = x[c + 1];
        if (42 == f) {
          s = b("i32"), c++;
        } else {
          for (;;) {
            f = x[c + 1];
            if (48 > f || 57 < f) {
              break;
            }
            s = 10 * s + (f - 48);
            c++;
          }
        }
        f = x[c + 1];
      } else {
        s = 6;
      }
      var l;
      switch (String.fromCharCode(f)) {
       case "h":
        f = x[c + 2];
        104 == f ? (c++, l = 1) : l = 2;
        break;
       case "l":
        f = x[c + 2];
        108 == f ? (c++, l = 8) : l = 4;
        break;
       case "L":
       case "q":
       case "j":
        l = 8;
        break;
       case "z":
       case "t":
       case "I":
        l = 4;
        break;
       default:
        l = m;
      }
      l && c++;
      f = x[c + 1];
      if (-1 != "d,i,u,o,x,X,p".split(",").indexOf(String.fromCharCode(f))) {
        i = 100 == f || 105 == f;
        l = l || 4;
        g = b("i" + 8 * l);
        8 == l && (g = 117 == f ? (g[0] >>> 0) + 4294967296 * (g[1] >>> 0) : (g[0] >>> 0) + 4294967296 * (g[1] | 0));
        4 >= l && (g = (i ? Aa : za)(g & Math.pow(256, l) - 1, 8 * l));
        var t = Math.abs(g), h, i = "";
        if (100 == f || 105 == f) {
          h = Aa(g, 8 * l).toString(10);
        } else {
          if (117 == f) {
            h = za(g, 8 * l).toString(10), g = Math.abs(g);
          } else {
            if (111 == f) {
              h = (A ? "0" : "") + t.toString(8);
            } else {
              if (120 == f || 88 == f) {
                i = A ? "0x" : "";
                if (0 > g) {
                  g = -g;
                  h = (t - 1).toString(16);
                  A = [];
                  for (t = 0; t < h.length; t++) {
                    A.push((15 - parseInt(h[t], 16)).toString(16));
                  }
                  for (h = A.join(""); h.length < 2 * l; ) {
                    h = "f" + h;
                  }
                } else {
                  h = t.toString(16);
                }
                88 == f && (i = i.toUpperCase(), h = h.toUpperCase());
              } else {
                112 == f && (0 === t ? h = "(nil)" : (i = "0x", h = t.toString(16)));
              }
            }
          }
        }
        if (I) {
          for (; h.length < s; ) {
            h = "0" + h;
          }
        }
        for (q && (i = 0 > g ? "-" + i : "+" + i); i.length + h.length < B; ) {
          z ? h += " " : F ? h = "0" + h : i = " " + i;
        }
        h = i + h;
        h.split("").forEach((function(a) {
          e.push(a.charCodeAt(0));
        }));
      } else {
        if (-1 != "f,F,e,E,g,G".split(",").indexOf(String.fromCharCode(f))) {
          g = b("double");
          if (isNaN(g)) {
            h = "nan", F = n;
          } else {
            if (isFinite(g)) {
              I = n;
              l = Math.min(s, 20);
              if (103 == f || 71 == f) {
                I = k, s = s || 1, l = parseInt(g.toExponential(l).split("e")[1], 10), s > l && -4 <= l ? (f = (103 == f ? "f" : "F").charCodeAt(0), s -= l + 1) : (f = (103 == f ? "e" : "E").charCodeAt(0), s--), l = Math.min(s, 20);
              }
              if (101 == f || 69 == f) {
                h = g.toExponential(l), /[eE][-+]\d$/.test(h) && (h = h.slice(0, -1) + "0" + h.slice(-1));
              } else {
                if (102 == f || 70 == f) {
                  h = g.toFixed(l);
                }
              }
              i = h.split("e");
              if (I && !A) {
                for (; 1 < i[0].length && -1 != i[0].indexOf(".") && ("0" == i[0].slice(-1) || "." == i[0].slice(-1)); ) {
                  i[0] = i[0].slice(0, -1);
                }
              } else {
                for (A && -1 == h.indexOf(".") && (i[0] += "."); s > l++; ) {
                  i[0] += "0";
                }
              }
              h = i[0] + (1 < i.length ? "e" + i[1] : "");
              69 == f && (h = h.toUpperCase());
              q && 0 <= g && (h = "+" + h);
            } else {
              h = (0 > g ? "-" : "") + "inf", F = n;
            }
          }
          for (; h.length < B; ) {
            h = z ? h + " " : F && ("-" == h[0] || "+" == h[0]) ? h[0] + "0" + h.slice(1) : (F ? "0" : " ") + h;
          }
          97 > f && (h = h.toUpperCase());
          h.split("").forEach((function(a) {
            e.push(a.charCodeAt(0));
          }));
        } else {
          if (115 == f) {
            (q = b("i8*")) ? (q = xa(q), I && q.length > s && (q = q.slice(0, s))) : q = Q("(null)", k);
            if (!z) {
              for (; q.length < B--; ) {
                e.push(32);
              }
            }
            e = e.concat(q);
            if (z) {
              for (; q.length < B--; ) {
                e.push(32);
              }
            }
          } else {
            if (99 == f) {
              for (z && e.push(b("i8")); 0 < --B; ) {
                e.push(32);
              }
              z || e.push(b("i8"));
            } else {
              if (110 == f) {
                z = b("i32*"), C[z >> 2] = e.length;
              } else {
                if (37 == f) {
                  e.push(g);
                } else {
                  for (t = i; t < c + 2; t++) {
                    e.push(x[t]);
                  }
                }
              }
            }
          }
        }
      }
      c += 2;
    } else {
      e.push(g), c += 1;
    }
  }
  return e;
}

function qa(a) {
  ptr = ja(a + 8);
  return ptr + 8 & 4294967288;
}

ta.unshift({
  i: (function() {
    Oa = n;
    $ || Wa();
  })
});

ua.push({
  i: (function() {
    $ && (0 < V[2].object.c.buffer.length && V[2].object.c(10), 0 < V[3].object.c.buffer.length && V[3].object.c(10));
  })
});

X(0);

Module.t = (function(a) {
  function b() {
    for (var a = 0; 3 > a; a++) {
      d.push(0);
    }
  }
  var c = a.length + 1, d = [ M(Q("/bin/this.program"), "i8", L) ];
  b();
  for (var e = 0; e < c - 1; e += 1) {
    d.push(M(Q(a[e]), "i8", L)), b();
  }
  d.push(0);
  d = M(d, "i32", L);
  return Ba();
});

ya.r = M([ 102, 105, 110, 97, 108, 58, 32, 37, 100, 58, 37, 100, 46, 10, 0 ], "i8", L);

N = [ 0, 0 ];

Module.FUNCTION_TABLE = N;

function Xa(a) {
  a = a || Module.arguments;
  sa(ta);
  var b = m;
  Module._main && (b = Module.t(a), sa(ua));
  return b;
}

Module.run = Xa;

Module.preRun && Module.preRun();

Module.noInitialRun || Xa();

Module.postRun && Module.postRun();

print = saved.print;
printErr = saved.printErr;