import subprocess
import socket
import os
import time
import json

class Benchmark:
    def __init__(self, suite, version, page):
        self.suite = suite
        self.version = suite+" "+version
        self.page = "http://localhost:8000/"+page
        self.browser = True

    def run(self, engine, submit):
        # Test if server is running and start server if needed.
        s =  socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = s.connect_ex(("localhost", 8000))
        s.close()
        if result > 0:
            subprocess.Popen(["python", "server.py"])

        # Run tests.
        for modeInfo in engine.modes:
            if os.path.exists("results"):
                os.unlink("results")

            engine.run(self.page)
            while not os.path.exists("results"):
                time.sleep(10)
            engine.kill()

            fp = open("results", "r")
            results = json.loads(fp.read())
            fp.close()

            results = self.processResults(results)
            submit.AddTests(results, self.suite, self.version, modeInfo["name"])

    def processResults(self, results):
        return results

class Octane(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "octane", "2.0.1", "desktop-driver/octane.html")

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
        Benchmark.__init__(self, "ss", "1.0.1", "desktop-driver/ss.html")

class Kraken(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "kraken", "1.1", "desktop-driver/kraken.html")

class WebGLSamples(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "webglsamples", "0.1", "desktop-driver/webglsamples.html")

Benchmarks = [Octane(), SunSpider(), Kraken(), WebGLSamples()]

