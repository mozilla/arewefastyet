import subprocess
import socket
import os
import time
import json
import sys

sys.path.insert(1, '../driver')
import utils

class Benchmark:
    def __init__(self, suite, version, page):
        self.suite = suite
        self.version = suite+" "+version
        self.page = page

    def run(self, engine, submit):
        # Run tests.
        runOneBenchmark = False
        for modeInfo in engine.modes:
            if os.path.exists("results"):
                os.unlink("results")

            engine.run(utils.config.get('main', 'serverURL')+self.page)
            timeout = int(utils.config.get('main', 'timeout')) * 60
            while not os.path.exists("results") and timeout > 0:
                time.sleep(10)
                timeout -= 10
            engine.kill()

            if timeout <= 0:
                print "Running benchmark timed out"
                continue

            fp = open("results", "r")
            results = json.loads(fp.read())
            fp.close()

            results = self.processResults(results)
            submit.AddTests(results, self.suite, self.version, modeInfo["name"])

            runOneBenchmark = True
        return runOneBenchmark

    def processResults(self, results):
        return results

class Octane(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "octane", "2.0.1", "browser-driver/octane.html")

    def processResults(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

class SunSpider(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "ss", "1.0.1", "browser-driver/ss.html")

class Kraken(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "kraken", "1.1", "browser-driver/kraken.html")

class WebGLSamples(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "webglsamples", "0.1", "browser-driver/webglsamples.html")

class Dromaeo(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "dromaeo", "1.0", "desktop-driver/dromaeo.html")
        
    def processResults(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

if utils.config.get('main', 'slaveType') == "android":
    Benchmarks = [Octane(), SunSpider(), Kraken(), WebGLSamples()]
else:
    Benchmarks = [Octane(), SunSpider(), Kraken(), Dromaeo(), WebGLSamples()]

# Test if server is running and start server if needed.
s =  socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = s.connect_ex(("localhost", 8000))
s.close()
if result > 0:
    subprocess.Popen(["python", "server.py"])
