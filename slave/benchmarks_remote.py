import json
import os
import socket
import subprocess
import sys
import time

sys.path.insert(1, '../driver')

import utils

class Benchmark:
    """ timeout is in minutes """
    def __init__(self, version, timeout=2, suite=None):
        self.suite = suite if suite is not None else self.name()
        self.version = self.suite + " " + version
        self.url = 'http://' + self.suite + ".localhost:8000"
        self.timeout = timeout

    def processResults(self, results):
        return results

    @staticmethod
    def injectData(path, data):
        return data

    @staticmethod
    def translatePath(path):
        # return "https/http", "host", "path"
        raise Exception("NYI")

    @staticmethod
    def name(self):
        raise Exception("NYI")

class Octane(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "2.0.1")

    def processResults(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

    @staticmethod
    def translatePath(path):
        if path == "" or path == "/":
            path = "/octane/index.html"
        return "http", "chromium.github.io", path

    @staticmethod
    def injectData(path, data):
        print "inject"
        if path == "/octane/index.html":
            return data.replace("</body>",
                                "<script>"
                                "   window.setTimeout(Run, 10000);"
                                "   var oldAddResult = AddResult;"
                                "   var results = {};"
                                "   AddScore = function(score) {"
                                "      results['total'] = score;"
                                "      location.href = 'http://localhost:8000/submit?results=' + "
                                "                          encodeURIComponent(JSON.stringify(results))"
                                "   };"
                                "   AddResult = function(name, result) {"
                                "      results[name] = result;"
                                "      oldAddResult(name, result);"
                                "   };"
                                "</script>"
                                "</body>");
        return data

    @staticmethod
    def name():
        return "octane"

class Dromaeo(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.0", 20)
        self.url = 'http://' + self.suite + ".localhost:8000/?recommended"

    def processResults(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

    @staticmethod
    def injectData(path, data):
        if path == "/webrunner.js":
            data = data.replace('function init(){',
                                """
                                function init(){
                                    setTimeout(function () {
                                        interval = true;
                                        dequeue();
                                    }, 10000);
                                """)
            return data.replace('} else if ( queue.length == 0 ) {',
                                 """
                                 } else if ( queue.length == 0 ) {;
                                    var results = {};
                                    for (var i=0; i<dataStore.length; i++) {
                                        results[dataStore[i].curID] = dataStore[i].mean
                                    }
                                    var summary = (runStyle === "runs/s" ? Math.pow(Math.E, maxTotal / maxTotalNum) : maxTotal).toFixed(2);
                                    results["total"] = summary;
                                    location.href = "http://localhost:8000/submit?results="+encodeURIComponent(JSON.stringify(results))
                                 """)
        return data

    @staticmethod
    def translatePath(path):
        return "http", "dromaeo.com", path

    @staticmethod
    def name():
        return "dromaeo"

class Massive(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.2", 9)

    def processResults(self, results):
        ret = []
        for item in results:
            if item == None:
                pass
            elif item["benchmark"] == "score":
                ret.append({'name': "__total__", 'time': item["result"]})
            else:
                ret.append({'name': item["benchmark"], 'time': item["result"]})
        return ret

    @staticmethod
    def injectData(path, data):
        if path == "/Massive/driver.js":
            return data.replace("job.calculate().toFixed(3)","normalize(job)")
        return data

    @staticmethod
    def translatePath(path):
        if path == "" or path == "/":
            path = "/Massive/?autoRun=true,postToURL=http://localhost:8000/submit"
        return "http", "kripken.github.io", path

    @staticmethod
    def name():
        return "massive"

class JetStream(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.0", 5)

    def processResults(self, results):
        ret = []
        for item in results:
            if item == "geomean":
                ret.append({'name': "__total__", 'time': results[item]["statistics"]["mean"]})
            else:
                ret.append({'name': item, 'time': results[item]["statistics"]["mean"]})
        return ret

    @staticmethod
    def injectData(path, data):
        if path == "/JetStream/":
            return data.replace("</body>",
                                "<script>"
                                "   window.setTimeout(JetStream.start, 10000);"
                                "</script>"
                                "</body>");
        if path == "/JetStream/JetStreamDriver.js":
            return data.replace("function end()",
                                "function end()"
                                "{"
                                "      location.href = 'http://localhost:8000/submit?results=' + "
                                "                          encodeURIComponent(JSON.stringify(computeRawResults()))"
                                "} "
                                "function foo()");
        return data

    @staticmethod
    def translatePath(path):
        if path == "" or path == "/":
            path = "/JetStream/"
        return "http", "browserbench.org", path

    @staticmethod
    def name():
        return "jetstream"

class Speedometer(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.0", 4)

    @staticmethod
    def injectData(path, data):
        if path == "/Speedometer/":
            return data.replace("</body>",
                                """
                                <script defer>
                                   window.setTimeout(function() {
                                       startTest()
                                       benchmarkClient._updateGaugeNeedle = function (rpm) {
                                          location.href = 'http://localhost:8000/submit?results=' +
                                                              encodeURIComponent(JSON.stringify([{'name': '__total__', 'time': rpm}]));
                                       };
                                   }, 10000);
                                </script>
                                </body>""");
        return data

    @staticmethod
    def translatePath(path):
        if path == "" or path == "/":
            path = "/Speedometer/"
        return "http", "browserbench.org", path

    @staticmethod
    def name():
        return "speedometer"

class SpeedometerMisc(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "0.1", 4)
        self.url = "http://speedometer-misc.local:8000/"

    def processResults(self, results):
        ret = []
        for category in results["tests"]:
            for test in results["tests"][category]["tests"]:
                ret.append({'name': category+"-"+test+"-sync", 'time': results["tests"][category]["tests"][test]["tests"]["Sync"]})
                ret.append({'name': category+"-"+test+"-async", 'time': results["tests"][category]["tests"][test]["tests"]["Async"]})

        ret.append({'name': "__total__", 'time': results["total"]})
        return ret

    @staticmethod
    def injectData(path, data):
        if path == "/InteractiveRunner.html":
            data = data.replace('if (queryParam !== undefined) {', 'if (true) {')
            return data.replace('for (var suiteName in measuredValues.tests) {',
                                """
                                location.href = "http://localhost:8000/submit?results="+encodeURIComponent(JSON.stringify(measuredValues))
                                for (var suiteName in measuredValues.tests) {
                                """)
        return data

    @staticmethod
    def translatePath(path):
        if path == "" or path == "/":
            path = "/InteractiveRunner.html"
        return "https", new_host, path

    @staticmethod
    def name():
        return "speedometer-misc"

class Kraken(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.1")

    def processResults(self, results):
        ret = []
        total = 0
        for item in results:
            if item == "v":
                continue

            avg = 0.0
            for score in results[item]:
                avg += score

            avg = avg / len(results[item])
            total += avg
            ret.append({'name': item, 'time': avg })

        ret.append({'name': "__total__", 'time': total })
        return ret

    @staticmethod
    def injectData(path, data):
        if path == "/kraken-1.1/driver.html":
            return data.replace('location = "results.html?" + encodeURI(outputString);',
                                'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
        return data

    @staticmethod
    def translatePath(path):
        if path == "" or path == "/":
            path = "/kraken-1.1/driver.html"
        return "http", "krakenbenchmark.mozilla.org", path

    @staticmethod
    def name():
        return "kraken"

class SunSpider(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.0.2", 1, suite="ss")
        self.url = "http://sunspider.localhost:8000/"

    def processResults(self, results):
        ret = []
        total = 0
        for item in results:
            if item == "v":
                continue

            avg = 0.0
            for score in results[item]:
                avg += score

            avg = avg / len(results[item])
            total += avg
            ret.append({'name': item, 'time': avg })

        ret.append({'name': "__total__", 'time': total })
        return ret

    @staticmethod
    def injectData(path, data):
        if path == "/perf/sunspider-1.0.2/sunspider-1.0.2/driver.html":
            return data.replace('location = "results.html?" + encodeURI(outputString);',
                                'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
        return data

    @staticmethod
    def translatePath(path):
        if path == "" or path == "/":
            path = "/perf/sunspider-1.0.2/sunspider-1.0.2/driver.html"
        return "http", "www.webkit.org", path

    @staticmethod
    def name():
        return "sunspider"

class EmberPerf(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "0.1", 20)

    def processResults(self, results):
        ret = []
        total = 0
        for item in results["results"]:
            avg = item["mean"]
            total += avg
            ret.append({'name': item["name"], 'time': avg })

        ret.append({'name': "__total__", 'time': total })
        return ret

    @staticmethod
    def injectData(path, data):
        if path == "/assets/ember-performance.js":
            return data.replace('this.newFlagName = null;',
                                """
			        this.newFlagName = null;
                                setTimeout(function() {
                                    var button = document.getElementsByTagName("button")[0];
                                    if (button.innerHTML == "Submit my Results") {
                                        button.click();
                                    } else {
                                        // Disable some tests that don't run to completion.
                                        document.getElementsByClassName("form-group")[0].getElementsByTagName("input")[7].click();
                                        document.getElementsByClassName("form-group")[0].getElementsByTagName("input")[8].click();
                                        document.getElementsByClassName("form-group")[0].getElementsByTagName("input")[9].click();
                                        document.getElementsByClassName("form-group")[0].getElementsByTagName("input")[12].click();
                                        document.getElementsByClassName("form-group")[0].getElementsByTagName("input")[15].click();

                                        setTimeout(function() {
                                            document.getElementsByClassName("footer")[0].getElementsByTagName("button")[0].click()
                                        }, 10000);
                                    }
				}, 4000);
				""").replace("http://perflogger.eviltrout.com/api/results",
                                             "http://localhost:8000/submit").replace("POST","GET")
        return data

    @staticmethod
    def translatePath(path):
        return "http", "emberperf.eviltrout.com", path

    @staticmethod
    def name():
        return "emberperf"

class Browsermark(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "2.1", 5)
        self.url = "http://browsermark.local:8082/"

    @staticmethod
    def injectData(path, data):
        ret = []
        for item in results["data"]:
            if item[0] == "Overall":
                ret.append({'name': "__total__", 'time': item[1]})
            else:
                ret.append({'name': item[0], 'time': item[1]})
        return ret

    @staticmethod
    def translatePath(path):
        return "http", "browsermark.local", path

    @staticmethod
    def name():
        return "browsermark"

class WasmMisc(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "0.5", timeout=5)
        self.url = "http://wasm.local:8000"

    @staticmethod
    def name():
        return "wasm"

KnownBenchmarks = [
    Octane,
    Dromaeo,
    Massive,
    JetStream,
    Speedometer,
    SpeedometerMisc,
    Kraken,
    SunSpider,
    Browsermark,
    WasmMisc,
    EmberPerf,
]

# TODO use this when showing execute.py's help.
def get_all_known_benchmark_names():
    return [b.name() for b in KnownBenchmarks]

def getBenchmark(name):
    for b in KnownBenchmarks:
        if name == b.name():
            return b()
    raise Exception("Unknown benchmark")

# Test if server is running and start server if needed.
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = s.connect_ex(("localhost", 8000))
s.close()
if result > 0:
    subprocess.Popen(["python", "server.py"])
