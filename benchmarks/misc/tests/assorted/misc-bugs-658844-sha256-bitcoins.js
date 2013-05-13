jsMiner = {};
if (typeof jsMiner == "undefined") var jsMiner = {};
var self = this;
var window = this;
jsMiner.Util = {
    hex_to_uint32_array: function (a)
    {
        var b = [];
        for (var c = 0, d = a.length; c < d; c += 8) b.push(parseInt(a.substring(c, c + 8), 16));
        return b
    },
    uint32_array_to_hex: function (a)
    {
        var b = "";
        for (var c = 0; c < a.length; c++) b += jsMiner.Util.byte_to_hex(a[c] >>> 24), b += jsMiner.Util.byte_to_hex(a[c] >>> 16), b += jsMiner.Util.byte_to_hex(a[c] >>> 8), b += jsMiner.Util.byte_to_hex(a[c]);
        return b
    },
    byte_to_hex: function (a)
    {
        var b = "0123456789abcdef";
        a = a & 255;
        return b.charAt(a / 16) + b.charAt(a % 16)
    },
    reverseBytesInWord: function (a)
    {
        return a << 24 & 4278190080 | a << 8 & 16711680 | a >>> 8 & 65280 | a >>> 24 & 255
    },
    reverseBytesInWords: function (a)
    {
        var b = [];
        for (var c = 0; c < a.length; c++) b.push(jsMiner.Util.reverseBytesInWord(a[c]));
        return b
    },
    fromPoolString: function (a)
    {
        return jsMiner.Util.reverseBytesInWords(jsMiner.Util.hex_to_uint32_array(a))
    },
    toPoolString: function (a)
    {
        return jsMiner.Util.uint32_array_to_hex(jsMiner.Util.reverseBytesInWords(a))
    }
};
var module;
module = module || {}, module.exports = jsMiner.Util, Sha256 = function (a, b)
{
    var c = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298],
        d = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225],
        e = function (a, b)
        {
            var c = (a & 65535) + (b & 65535),
                d = (a >> 16) + (b >> 16) + (c >> 16);
            return d << 16 | c & 65535
        },
        f = function ()
        {
            var a = arguments[0];
            for (var b = 1; b < arguments.length; b++) a = e(a, arguments[b]);
            return a
        },
        g = function (a, b)
        {
            for (var c = 0; c < 8; c++) a[c] = b[c]
        },
        h = function (a, b)
        {
            for (var c = 0; c < 16; c++) a[c] = b[c];
            b = a;
            for (var c = 16; c < 64; c++)
            {
                var d = i(b[c - 15], 7) ^ i(b[c - 15], 18) ^ j(b[c - 15], 3),
                    e = i(b[c - 2], 17) ^ i(b[c - 2], 19) ^ j(b[c - 2], 10);
                b[c] = f(b[c - 16], d, b[c - 7], e)
            }
            return b
        },
        i = function (a, b)
        {
            return a >>> b | a << 32 - b
        },
        j = function (a, b)
        {
            return a >>> b
        };
    this.state = [0, 0, 0, 0, 0, 0, 0, 0], g(this.state, d), this.work = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], this.hex = function ()
    {
        return jsMiner.Util.uint32_array_to_hex(this.state)
    }, this.reset = function ()
    {
        g(this.state, d);
        return this
    }, this.update = function (a, b)
    {
        b || (b = a, a = null), typeof a == "string" && (a = jsMiner.Util.hex_to_uint32_array(a)), a && g(this.state, a), typeof b == "string" && (b = jsMiner.Util.hex_to_uint32_array(b));
        var d = h(this.work, b),
            j = this.state,
            k = j[0],
            l = j[1],
            m = j[2],
            n = j[3],
            o = j[4],
            p = j[5],
            q = j[6],
            r = j[7];
        for (var s = 0; s < 64; s++)
        {
            var t = i(k, 2) ^ i(k, 13) ^ i(k, 22),
                u = k & l ^ k & m ^ l & m,
                v = e(t, u),
                w = i(o, 6) ^ i(o, 11) ^ i(o, 25),
                x = o & p ^ ~o & q,
                y = f(r, w, x, c[s], d[s]);
            r = q, q = p, p = o, o = e(n, y), n = m, m = l, l = k, k = e(y, v)
        }
        j[0] = e(j[0], k), j[1] = e(j[1], l), j[2] = e(j[2], m), j[3] = e(j[3], n), j[4] = e(j[4], o), j[5] = e(j[5], p), j[6] = e(j[6], q), j[7] = e(j[7], r);
        return this
    }, a && this.update(a, b)
};
var module;
module = module || {}, module.exports = Sha256, jsMiner.engine = function (options)
{
    this.publisherId = "", this.delayBetweenNonce = 30, this.sha = new Sha256, this.hashRate = 0, this.workerRunning = !1, this.forceUIThread = !1, this.autoStart = !0, this.workerTimeout = 30, options && (options.hasOwnProperty("clientId") && (this.clientId = options.clientId), options.hasOwnProperty("delay") && (this.delayBetweenNonce = options.delay), options.hasOwnProperty("forceUIThread") && (this.forceUIThread = options.forceUIThread), options.hasOwnProperty("autoStart") && (this.autoStart = options.autoStart), options.hasOwnProperty("workerTimeout") && (this.workerTimeout = options.workerTimeout)), this.loadMoreWork = function (a)
    {
        var b = "/work?client_id=" + this.clientId;
        this.hashRate > 0 && (b = b + "&hash_rate=" + this.hashRate);
        var c = this,
            d;
        c.handleGetWorkResponse('{"first_nonce":1620049920,"last_nonce":1621098495,"hash1":"00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000","data":"00000001ed32681ec1adcf7d1645ed8385151fcab8484959fd0b3e040000264c00000000c4f7330607111142abda5b9611cc69038f8f7afd202916e9cafa325429366b454dda144a1a44b9f200000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000","midstate":"61dd6f4d9e9dd02ca8d9f02e8af37abd67e78daf283238abd6fe56c400c4f9ad","target":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000"}');
        
    }, this.handleGetWorkResponse = function (response)
    {
        var work = eval("(" + response + ")"),
            midstate = jsMiner.Util.fromPoolString(work.midstate),
            half = work.data.substring(0, 128),
            data = work.data.substring(128, 256);
        data = jsMiner.Util.fromPoolString(data), half = jsMiner.Util.fromPoolString(half);
        var hash1 = jsMiner.Util.fromPoolString(work.hash1),
            target = jsMiner.Util.fromPoolString(work.target);
        this.workerEntry(midstate, half, data, hash1, target, work.first_nonce, work.last_nonce)
    }, this.webWorkerEntry = function (a, b, c, d, e, f, g)
    {
        var h = this,
            i = (new Date).getTime();
        this.webWorker || (this.webWorker = new Worker("jsMiner.js")), this.webWorker.onmessage = function (a)
        {
            var b = (new Date).getTime();
            h.workerRunning = !1, h.hashRate = (a.data.lastNonce - f) / (b - i) * 1e3, h.loadMoreWork(a.data.data)
        }, this.webWorker.postMessage(
        {
            midstate: a,
            half: b,
            data: c,
            hash1: d,
            target: e,
            startNonce: f,
            endNonce: g,
            pubId: this.publisherId,
            timeout: this.workerTimeout
        })
    }, this.workerEntry = function (a, b, c, d, e, f, g)
    {
        function n()
        {
          for (var i = 0; i < 10; i++) {
            for (var f = 0; f != 100 && h < g; f++)
            {
                var k = j.tryHash(a, b, c, d, e, h);
                if (k != null)
                {
                    m(k);
                    return
                }
                h++
            }
          }
          //h++ < g && (new Date).getTime() <= l ? n() : m(null)
        }
        if ( !! window.Worker && !this.forceUIThread) this.webWorkerEntry(a, b, c, d, e, f, g);
        else
        {
            var h = f,
                i = this.delayBetweenNonce,
                j = this,
                k = (new Date).getTime(),
                l = k + this.workerTimeout * 1e3;
            this.workerRunning = !0;
            var m = function (a)
                {
                    var b = (new Date).getTime();
                    //j.workerRunning = !1, j.hashRate = (h - f) / (b - k) * 1e3, j.loadMoreWork(a);
                };
            n();
            //XXXsetTimeout(n, i)
        }
    }, this.tryHash = function (a, b, c, d, e, f)
    {
        c[3] = f, this.sha.reset();
        var g = this.sha.update(a, c).state;
        for (var h = 0; h < 8; h++) d[h] = g[h];
        this.sha.reset();
        var i = this.sha.update(d).state;
        if (i[7] == 0)
        {
            var j = [];
            for (var h = 0; h < b.length; h++) j.push(b[h]);
            for (var h = 0; h < c.length; h++) j.push(c[h]);
            return j
        }
        return null
    }, this.autoStart && this.loadMoreWork()
}, typeof window == "undefined" && (self.onmessage = function (a)
{
    var b = (new Date).getTime(),
        c = b + a.data.timeout * 1e3,
        d = new jsMiner.engine(
        {
            pubId: a.data.pubId,
            autoStart: !1
        });
    for (var e = a.data.startNonce; e != a.data.endNonce; e++)
    {
        var f = d.tryHash(a.data.midstate, a.data.half, a.data.data, a.data.hash1, a.data.target, e);
        if (f)
        {
            postMessage(
            {
                data: f,
                lastNonce: e
            });
            return
        }
        if (e % 100 && (new Date).getTime() >= c)
        {
            postMessage(
            {
                data: null,
                lastNonce: e
            });
            return
        }
    }
    postMessage(
    {
        data: null,
        lastNonce: a.data.endNonce
    })
});


var engine = new jsMiner.engine({workerTimeout: 1, clientId: "homepage", forceUIThread: true});
