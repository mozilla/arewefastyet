import logging
import sys
import time

sys.path.insert(1, '../driver')


class Benchmark:
    """ timeout is in minutes """
    def __init__(self, timeout=2, suite=None):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.suite = suite if suite is not None else self.name()
        self.version = self.suite + " " + self.static_version()
        self.url = 'http://' + self.suite + ".localhost:8000"
        self.timeout = timeout

    def process_results(self, results):
        return results

    @staticmethod
    def inject_data(path, data):
        return data

    @staticmethod
    def translate_path(path):
        """Returns a triplet of the form (protocol, host, path)"""
        raise Exception("NYI")

    @staticmethod
    def name():
        """Returns the string name of the benchmark."""
        raise Exception("NYI")

    @staticmethod
    def static_version():
        """Returns a string version of the current benchmark, reused for
        caching."""
        raise Exception("NYI")

class Octane(Benchmark):
    def __init__(self):
        Benchmark.__init__(self)

    def process_results(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

    @staticmethod
    def translate_path(path):
        if path == "" or path == "/":
            path = "/octane/index.html"
        return "http", "chromium.github.io", path

    @staticmethod
    def inject_data(path, data):
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
    def static_version():
        return "2.0.1"

    @staticmethod
    def name():
        return "octane"

class Dromaeo(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 20)
        self.url = 'http://' + self.suite + ".localhost:8000/?recommended"

    def process_results(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

    @staticmethod
    def inject_data(path, data):
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
    def translate_path(path):
        return "http", "dromaeo.com", path

    @staticmethod
    def static_version():
        return "1.0"

    @staticmethod
    def name():
        return "dromaeo"

class Massive(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 9)

    def process_results(self, results):
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
    def inject_data(path, data):
        if path == "/Massive/driver.js":
            return data.replace("job.calculate().toFixed(3)","normalize(job)")
        return data

    @staticmethod
    def translate_path(path):
        if path == "" or path == "/":
            path = "/Massive/?autoRun=true,postToURL=http://localhost:8000/submit"
        return "http", "kripken.github.io", path

    @staticmethod
    def static_version():
        return "1.2"

    @staticmethod
    def name():
        return "massive"

class JetStream(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 5)

    def process_results(self, results):
        ret = []
        for item in results:
            if item == "geomean":
                ret.append({'name': "__total__", 'time': results[item]["statistics"]["mean"]})
            else:
                ret.append({'name': item, 'time': results[item]["statistics"]["mean"]})
        return ret

    @staticmethod
    def inject_data(path, data):
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
    def translate_path(path):
        if path == "" or path == "/":
            path = "/JetStream/"
        return "http", "browserbench.org", path

    @staticmethod
    def static_version():
        return "1.0"

    @staticmethod
    def name():
        return "jetstream"

class Speedometer(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 4)

    @staticmethod
    def inject_data(path, data):
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
    def translate_path(path):
        if path == "" or path == "/":
            path = "/Speedometer/"
        return "http", "browserbench.org", path

    @staticmethod
    def static_version():
        return "1.0"

    @staticmethod
    def name():
        return "speedometer"

class Speedometer2(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 40)
        self.url = "http://speedometer-misc.local:8000/"

    def process_results(self, results):
        ret = []
        for category in results["tests"]:
            for test in results["tests"][category]["tests"]:
                ret.append({'name': category+"-"+test+"-sync", 'time': results["tests"][category]["tests"][test]["tests"]["Sync"]})
                ret.append({'name': category+"-"+test+"-async", 'time': results["tests"][category]["tests"][test]["tests"]["Async"]})

        ret.append({'name': "__total__", 'time': results["total"]})
        ret.append({'name': "score", 'time': results["score"]})
        return ret

    @staticmethod
    def inject_data(path, data):
        if path == "/arewefastyet-speedometer/2.0/" or path == "/arewefastyet-speedometer/2.0/index.html":
            # Inject the script that will auto-click the start button.
            data = data.replace('</body>', """</body>
<script>
    setTimeout(function() {
        document.getElementById('home').getElementsByTagName('button')[0].click();
    }, 3000);
</script>""")

        elif path == "/arewefastyet-speedometer/2.0/resources/main.js":
            # When the index.html benchmark is done, continue to InteractiveRunner.html.
            data = data.replace("var arithmeticMean = sum / values.length;", """
var arithmeticMean = sum / values.length;
location.href = "http://speedometer-misc.local:8000/arewefastyet-speedometer/2.0/InteractiveRunner.html?score=" + encodeURIComponent(arithmeticMean);
""")

        elif path.startswith("/arewefastyet-speedometer/2.0/InteractiveRunner.html"):
            # Automatically start the interactive runner.
            data = data.replace("if (parseQueryString['startAutomatically'] !== undefined)", "if (true)")

            # Submit the results to the final page.
            data = data.replace('for (var suiteName in measuredValues.tests) {',
                                """
                                measuredValues.score = location.search.substr(1).split('=')[1];
                                location.href = "http://localhost:8000/submit?results="+encodeURIComponent(JSON.stringify(measuredValues))
                                for (var suiteName in measuredValues.tests) {
                                """)
        return data

    @staticmethod
    def translate_path(path):
        if path == "" or path == "/":
            path = "/arewefastyet-speedometer/2.0/"
        return "http", "mozilla.github.io", path

    @staticmethod
    def static_version():
        return "2.0-r221659"

    @staticmethod
    def name():
        return "speedometer-misc"

class Kraken(Benchmark):
    def __init__(self):
        Benchmark.__init__(self)

    def process_results(self, results):
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
    def inject_data(path, data):
        if path == "/kraken-1.1/driver.html":
            return data.replace('location = "results.html?" + encodeURI(outputString);',
                                'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
        return data

    @staticmethod
    def translate_path(path):
        if path == "" or path == "/":
            path = "/kraken-1.1/driver.html"
        return "http", "krakenbenchmark.mozilla.org", path

    @staticmethod
    def static_version():
        return "1.1"

    @staticmethod
    def name():
        return "kraken"

class SunSpider(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 1, suite="ss")
        self.url = "http://sunspider.localhost:8000/"

    def process_results(self, results):
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
    def inject_data(path, data):
        if path == "/perf/sunspider-1.0.2/sunspider-1.0.2/driver.html":
            return data.replace('location = "results.html?" + encodeURI(outputString);',
                                'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
        return data

    @staticmethod
    def translate_path(path):
        if path == "" or path == "/":
            path = "/perf/sunspider-1.0.2/sunspider-1.0.2/driver.html"
        return "http", "www.webkit.org", path

    @staticmethod
    def static_version():
        return "1.0.2"

    @staticmethod
    def name():
        return "sunspider"

class EmberPerf(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 20)

    def process_results(self, results):
        ret = []
        total = 0
        for item in results["results"]:
            avg = 1000.0 / item["mean"]
            total += item["mean"]
            ret.append({'name': item["name"], 'time': avg })

        ret.append({'name': "__total__", 'time': 1000 / total })
        return ret

    @staticmethod
    def inject_data(path, data):
        if path == "/assets/ember-performance.js":
            return data.replace('this.newFlagName = null;',
                                """
                                this.newFlagName = null;
                                setTimeout(function() {
                                    var button = document.getElementsByTagName("button")[0];
                                    if (button.innerHTML == "Submit my Results") {
                                        button.click();
                                    } else {
                                        // Select a fixed release.
                                        var FIXED_RELEASE = '2.13.0';
                                        var versions = document.querySelectorAll('.form-group')[1];

                                        var checkboxes = versions.querySelectorAll('input[type=checkbox]');
                                        checkboxes.forEach(function(checkbox) {
                                            if (checkbox.parentElement.textContent.trim() === FIXED_RELEASE) {
                                                // Click the targeted release checkbox, so Ember updates
                                                // internal state.
                                                if (!checkbox.checked)
                                                    checkbox.click();
                                            } else {
                                                // Unselect other pre-checked checkboxes.
                                                if (checkbox.checked)
                                                    checkbox.click();
                                            }
                                        });

                                        // Click the "Run tests" button after some time.
                                        setTimeout(function() {
                                            document.getElementsByClassName("footer")[0].getElementsByTagName("button")[0].click();
                                        }, 3000);
                                    }
                                }, 4000);
                                """).replace("http://perflogger.eviltrout.com/api/results",
                                             "http://localhost:8000/submit").replace("POST","GET")
        return data

    @staticmethod
    def translate_path(path):
        return "http", "emberperf.eviltrout.com", path

    @staticmethod
    def static_version():
        return "0.2"

    @staticmethod
    def name():
        return "emberperf"

class Browsermark(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, 5)
        self.url = "http://browsermark.local:8082/"

    def process_results(self, results):
        ret = []
        for item in results["data"]:
            if item[0] == "Overall":
                ret.append({'name': "__total__", 'time': item[1]})
            else:
                ret.append({'name': item[0], 'time': item[1]})
        return ret

    @staticmethod
    def translate_path(path):
        return "http", "browsermark.local", path

    @staticmethod
    def static_version():
        return "2.1"

    @staticmethod
    def name():
        return "browsermark"

class WasmMisc(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, timeout=5)
        self.url = "http://wasm.local:8000"

    @staticmethod
    def translate_path(path):
        return "http", "wasm.local", path

    @staticmethod
    def static_version():
        return "0.5"

    @staticmethod
    def name():
        return "wasm"

class MotionMark(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, timeout=10)

    @staticmethod
    def translate_path(path):
        if not path.startswith('/MotionMark'):
            prefix = '/MotionMark'
            if path != '/':
                prefix += '/'
            path = prefix + path

        return "http", "browserbench.org", path

    def process_results(self, results):
        return [{ 'name': key, 'time': value } for key, value in results.items()]

    @staticmethod
    def inject_data(path, data):
        if path == '/MotionMark/':
            data = data.replace('</body>', '''<script>
                var interval = setInterval(function() {
                    if (typeof benchmarkController === 'undefined' ||
                        typeof BenchmarkRunner === 'undefined')
                    {
                        return;
                    }
                    clearInterval(interval);
                    setTimeout(function() {
                        benchmarkController.startBenchmark();
                    }, 0);
                }, 100);
            </script></body>''')

        elif path == '/MotionMark/resources/runner/animometer.js':
            data = data.replace(
'''
    showResults: function()
''', '''
    showResults: function() {
        var results = benchmarkRunnerClient.results;

        var scores = {};
        scores['__total__'] = results.score;

        var subtests = results._results.iterationsResults[0].testsResults.Animometer;
        for (var name in subtests) {
            scores[name] = subtests[name].score;
        }

        scores = encodeURIComponent(JSON.stringify(scores));
        location.href = 'http://localhost:8000/submit?results=' + scores;
    },

    __unusedShowResults: function()''')

        return data

    @staticmethod
    def static_version():
        return "0.1"

    @staticmethod
    def name():
        return "motionmark"


Known = [
    Octane,
    Dromaeo,
    Massive,
    JetStream,
    Speedometer,
    Speedometer2,
    Kraken,
    SunSpider,
    Browsermark,
    WasmMisc,
    EmberPerf,
    MotionMark,
]
