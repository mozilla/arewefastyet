import subprocess
import socket
import os
import time
import json
import sys
import utils

class Benchmark:
    """ timeout is in minutes """
    def __init__(self, suite, folder, page, timeout=2):
        if folder.endswith("/"):
            folder = folder[:-1]

        self.suite = suite
        self.page = "benchmarks/" + folder + "/" + page
        self.timeout = timeout

        with utils.chdir(os.path.join(utils.config.BenchmarkPath, folder)):
            fp = open("VERSION", 'r')
            self.version = suite + " " + fp.read().strip("\r\n\r\n \t")
            fp.close()

        host = utils.config.get('main', 'serverUrl')
        if host[-1] != "/":
            host += "/"
        self.url = host + self.page

    def run(self, engine, submit):
        # Run tests.
        runOneBenchmark = False
        for modeInfo in engine.modes:
            if os.path.exists("results"):
                os.unlink("results")

            host = utils.config.get('main', 'serverUrl')
            if host[-1] != "/":
                host += "/"
            engine.run(host+self.page, modeInfo)

            timeout = self.timeout * 60
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

class AssortedDOM(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "assorteddom", "misc-desktop/", "hosted/assorted/driver.html", 1)
        with utils.FolderChanger(os.path.join(utils.config.BenchmarkPath, "misc-desktop")):
            print subprocess.check_output(["python", "make-hosted.py"])

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

class WebGLSamples(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "webglsamples", "webglsamples/", "test.html", 1)

class WebAudio(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "webaudio", "webaudio/", "index.html", 2)

    def processResults(self, results):
        ret = []
        total = 0
        for item in results:
            if item['name'] == "Geometric Mean":
                item['name'] = "__total__"
            ret.append({'name': item['name'], 'time': item['duration'] })
        return ret

class UnityWebGL(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "unity-webgl", "unity-webgl/", "index.html",  6)

    def processResults(self, results):
        ret = []
        total = 0
        for item in results:
            if item['benchmark'] == "Geometric Mean":
                item['benchmark'] = "__total__"
            ret.append({'name': item['benchmark'], 'time': item['result'] })
        return ret

def getBenchmark(name):
    if name == "webglsamples":
        return WebGLSamples()
    if name == "assorteddom":
        return AssortedDOM()
    if name == "webaudio":
        return WebAudio()
    if name == "unity-webgl":
        return UnityWebGL()
    raise Exception("Unknown benchmark")
