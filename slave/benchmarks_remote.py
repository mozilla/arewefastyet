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
    def name():
        return "octane"

class Dromaeo(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.0", 17)
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
    def name():
        return "jetstream"

class Speedometer(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "1.0", 4)

    @staticmethod
    def name():
        return "speedometer"

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
    def name():
        return "sunspider"

class Browsermark(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "2.1", 5)
        self.url = "http://browsermark.local:8082/"

    def processResults(self, results):
        ret = []
        for item in results["data"]:
            if item[0] == "Overall":
                ret.append({'name': "__total__", 'time': item[1]})
            else:
                ret.append({'name': item[0], 'time': item[1]})
        return ret

    @staticmethod
    def name():
        return "browsermark"

class WasmMisc(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "0.4", timeout=5)
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
    Kraken,
    SunSpider,
    Browsermark,
    WasmMisc,
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
