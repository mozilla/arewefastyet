import json
import os
import socket
import subprocess
import sys
import time

import utils

class Benchmark:
    """ timeout is in minutes """
    def __init__(self, folder, page, timeout=2):
        if folder.endswith("/"):
            folder = folder[:-1]

        self.suite = self.name()
        self.page = "benchmarks/" + folder + "/" + page
        self.timeout = timeout

        with utils.chdir(os.path.join(utils.config.BenchmarkPath, folder)):
            fp = open("VERSION", 'r')
            self.version = self.suite + " " + fp.read().strip("\r\n\r\n \t")
            fp.close()

        host = utils.config.get('main', 'serverUrl')
        if host[-1] != "/":
            host += "/"
        self.url = host + self.page

    def run(self, engine, submit):
        run_at_least_once = False
        for mode_info in engine.modes:
            if os.path.exists("results"):
                os.unlink("results")

            host = utils.config.get('main', 'serverUrl')
            if host[-1] != "/":
                host += "/"
            engine.run(host + self.page, mode_info)

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

            results = self.process_results(results)
            submit.AddTests(results, self.suite, self.version, mode_info["name"])

            run_at_least_once = True
        return run_at_least_once

    def process_results(self, results):
        return results

    @staticmethod
    def name():
        """Returns the string name of the benchmark."""
        raise Exception("NYI")

class AssortedDOM(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "misc-desktop/", "hosted/assorted/driver.html", 1)
        with utils.chdir(os.path.join(utils.config.BenchmarkPath, "misc-desktop")):
            print subprocess.check_output(["python", "make-hosted.py"])

    @staticmethod
    def name():
        return "assorteddom"

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

class WebGLSamples(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "webglsamples/", "test.html", 1)

    @staticmethod
    def name():
        return "webglsamples"

class WebAudio(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "webaudio/", "index.html", 2)

    def process_results(self, results):
        ret = []
        total = 0
        for item in results:
            if item['name'] == "Geometric Mean":
                item['name'] = "__total__"
            ret.append({'name': item['name'], 'time': item['duration'] })
        return ret

    @staticmethod
    def name():
        return "webaudio"

class UnityWebGL(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "unity-webgl/", "index.html",  6)

    @staticmethod
    def name():
        return "unity-webgl"

    def process_results(self, results):
        ret = []
        total = 0
        for item in results:
            if item['benchmark'] == "Geometric Mean":
                item['benchmark'] = "__total__"
            ret.append({'name': item['benchmark'], 'time': item['result'] })
        return ret

Known = [
    AssortedDOM,
    WebGLSamples,
    WebAudio,
    UnityWebGL,
]
