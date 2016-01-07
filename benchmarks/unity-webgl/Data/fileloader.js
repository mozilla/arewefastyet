
var Module;
if (typeof Module === 'undefined') Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    }
    var PACKAGE_NAME = 'WebGLBenchmarks.data';
    var REMOTE_PACKAGE_BASE = 'WebGLBenchmarks.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      Module.printErr('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = typeof Module['locateFile'] === 'function' ?
                              Module['locateFile'](REMOTE_PACKAGE_BASE) :
                              ((Module['filePackagePrefixURL'] || '') + REMOTE_PACKAGE_BASE);
    var REMOTE_PACKAGE_SIZE = 57347072;
    var PACKAGE_UUID = 'd3a37ad4-fe75-4ac2-b5d5-3688b941cfbd';
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onload = function(event) {
        var packageData = xhr.response;
        callback(packageData);
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
      var fetched = null, fetchedCallback = null;
      fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);
    
  function runWithFS() {

function assert(check, msg) {
  if (!check) throw msg + new Error().stack;
}
Module['FS_createPath']('/', 'Resources', true, true);

    function DataRequest(start, end, crunched, audio) {
      this.start = start;
      this.end = end;
      this.crunched = crunched;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);

          this.finish(byteArray);

      },
      finish: function(byteArray) {
        var that = this;
        Module['FS_createPreloadedFile'](this.name, null, byteArray, true, true, function() {
          Module['removeRunDependency']('fp ' + that.name);
        }, function() {
          if (that.audio) {
            Module['removeRunDependency']('fp ' + that.name); // workaround for chromium bug 124926 (still no audio with this, but at least we don't hang)
          } else {
            Module.printErr('Preloading file ' + that.name + ' failed');
          }
        }, false, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
        this.requests[this.name] = null;
      },
    };
      new DataRequest(0, 6760, 0, 0).open('GET', '/level0');
    new DataRequest(6760, 13612, 0, 0).open('GET', '/level1');
    new DataRequest(13612, 23652, 0, 0).open('GET', '/level10');
    new DataRequest(23652, 161668, 0, 0).open('GET', '/level11');
    new DataRequest(161668, 299684, 0, 0).open('GET', '/level12');
    new DataRequest(299684, 437700, 0, 0).open('GET', '/level13');
    new DataRequest(437700, 3490412, 0, 0).open('GET', '/level14');
    new DataRequest(3490412, 3497408, 0, 0).open('GET', '/level2');
    new DataRequest(3497408, 3504516, 0, 0).open('GET', '/level3');
    new DataRequest(3504516, 3511340, 0, 0).open('GET', '/level4');
    new DataRequest(3511340, 3518428, 0, 0).open('GET', '/level5');
    new DataRequest(3518428, 3525188, 0, 0).open('GET', '/level6');
    new DataRequest(3525188, 3535692, 0, 0).open('GET', '/level7');
    new DataRequest(3535692, 3545732, 0, 0).open('GET', '/level8');
    new DataRequest(3545732, 3555772, 0, 0).open('GET', '/level9');
    new DataRequest(3555772, 3590312, 0, 0).open('GET', '/mainData');
    new DataRequest(3590312, 8268264, 0, 0).open('GET', '/sharedassets0.assets');
    new DataRequest(8268264, 11903296, 0, 0).open('GET', '/sharedassets1.assets');
    new DataRequest(11903296, 11908256, 0, 0).open('GET', '/sharedassets10.assets');
    new DataRequest(11908256, 11913208, 0, 0).open('GET', '/sharedassets11.assets');
    new DataRequest(11913208, 12229888, 0, 0).open('GET', '/sharedassets12.assets');
    new DataRequest(12229888, 12300504, 0, 0).open('GET', '/sharedassets13.assets');
    new DataRequest(12300504, 13109008, 0, 0).open('GET', '/sharedassets14.assets');
    new DataRequest(13109008, 38895080, 0, 0).open('GET', '/sharedassets15.assets');
    new DataRequest(38895080, 38923728, 0, 0).open('GET', '/sharedassets2.assets');
    new DataRequest(38923728, 43145728, 0, 0).open('GET', '/sharedassets3.assets');
    new DataRequest(43145728, 43150160, 0, 0).open('GET', '/sharedassets4.assets');
    new DataRequest(43150160, 43172040, 0, 0).open('GET', '/sharedassets5.assets');
    new DataRequest(43172040, 45577216, 0, 0).open('GET', '/sharedassets6.assets');
    new DataRequest(45577216, 46308512, 0, 0).open('GET', '/sharedassets7.assets');
    new DataRequest(46308512, 52533016, 0, 0).open('GET', '/sharedassets8.assets');
    new DataRequest(52533016, 56103216, 0, 0).open('GET', '/sharedassets9.assets');
    new DataRequest(56103216, 56774736, 0, 0).open('GET', '/Resources/unity_default_resources');
    new DataRequest(56774736, 57347072, 0, 0).open('GET', '/Resources/unity_builtin_extra');

    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
      // Reuse the bytearray from the XHR as the source for file reads.
      DataRequest.prototype.byteArray = byteArray;
          DataRequest.prototype.requests["/level0"].onload();
          DataRequest.prototype.requests["/level1"].onload();
          DataRequest.prototype.requests["/level10"].onload();
          DataRequest.prototype.requests["/level11"].onload();
          DataRequest.prototype.requests["/level12"].onload();
          DataRequest.prototype.requests["/level13"].onload();
          DataRequest.prototype.requests["/level14"].onload();
          DataRequest.prototype.requests["/level2"].onload();
          DataRequest.prototype.requests["/level3"].onload();
          DataRequest.prototype.requests["/level4"].onload();
          DataRequest.prototype.requests["/level5"].onload();
          DataRequest.prototype.requests["/level6"].onload();
          DataRequest.prototype.requests["/level7"].onload();
          DataRequest.prototype.requests["/level8"].onload();
          DataRequest.prototype.requests["/level9"].onload();
          DataRequest.prototype.requests["/mainData"].onload();
          DataRequest.prototype.requests["/sharedassets0.assets"].onload();
          DataRequest.prototype.requests["/sharedassets1.assets"].onload();
          DataRequest.prototype.requests["/sharedassets10.assets"].onload();
          DataRequest.prototype.requests["/sharedassets11.assets"].onload();
          DataRequest.prototype.requests["/sharedassets12.assets"].onload();
          DataRequest.prototype.requests["/sharedassets13.assets"].onload();
          DataRequest.prototype.requests["/sharedassets14.assets"].onload();
          DataRequest.prototype.requests["/sharedassets15.assets"].onload();
          DataRequest.prototype.requests["/sharedassets2.assets"].onload();
          DataRequest.prototype.requests["/sharedassets3.assets"].onload();
          DataRequest.prototype.requests["/sharedassets4.assets"].onload();
          DataRequest.prototype.requests["/sharedassets5.assets"].onload();
          DataRequest.prototype.requests["/sharedassets6.assets"].onload();
          DataRequest.prototype.requests["/sharedassets7.assets"].onload();
          DataRequest.prototype.requests["/sharedassets8.assets"].onload();
          DataRequest.prototype.requests["/sharedassets9.assets"].onload();
          DataRequest.prototype.requests["/Resources/unity_default_resources"].onload();
          DataRequest.prototype.requests["/Resources/unity_builtin_extra"].onload();
          Module['removeRunDependency']('datafile_WebGLBenchmarks.data');

    };
    Module['addRunDependency']('datafile_WebGLBenchmarks.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

})();
