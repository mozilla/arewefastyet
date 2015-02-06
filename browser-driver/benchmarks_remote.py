import subprocess
import socket
import os
import time
import json
import sys

sys.path.insert(1, '../driver')
import utils

class Benchmark:
    def __init__(self, suite, version):
        self.suite = suite
        self.version = suite+" "+version
        self.url = 'http://' + self.suite + ".localhost:8000"

    def run(self, engine, submit):
        # Run tests.
        runOneBenchmark = False
        for modeInfo in engine.modes:
            if os.path.exists("results"):
                os.unlink("results")

            engine.run(self.url, modeInfo)
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
        Benchmark.__init__(self, "octane", "2.0.1")

    def processResults(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

class Dromaeo(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "dromaeo", "1.0")
        self.url = 'http://' + self.suite + ".localhost:8000/?recommended"

    def processResults(self, results):
        ret = []
        for key in results:
            if key == "total":
                ret.append({'name': "__total__", 'time': results[key]})
            else:
                ret.append({'name': key, 'time': results[key]})
        return ret

class Massive(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "massive", "1.0")

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

class JetStream(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "jetstream", "1.0")

    def processResults(self, results):
        ret = []
        for item in results:
            if item == "geomean":
                ret.append({'name': "__total__", 'time': results[item]["statistics"]["mean"]})
            else:
                ret.append({'name': item, 'time': results[item]["statistics"]["mean"]})
        return ret

class Speedometer(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "speedometer", "1.0")

class Kraken(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "kraken", "1.1")

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

class SunSpider(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "ss", "1.0.2")
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

class Browsermark(Benchmark):
    def __init__(self):
        Benchmark.__init__(self, "browsermark", "2.1")
        self.url = "http://browsermark.local/"

    def processResults(self, results):
        ret = []
        for item in results["data"]:
            if item[0] == "Overall":
                ret.append({'name': "__total__", 'time': item[1]})
            else:
                ret.append({'name': item[0], 'time': item[1]})
        return ret

def getBenchmark(name):
    if name == "octane":
        return Octane()
    if name == "dromaeo":
        return Dromaeo()
    if name == "massive":
        return Massive()
    if name == "jetstream":
        return JetStream()
    if name == "speedometer":
        return Speedometer()
    if name == "kraken":
        return Kraken()
    if name == "sunspider":
        return SunSpider()
    if name == "browsermark":
        return Browsermark()
    raise Exception("Unknown benchmark")

# Test if server is running and start server if needed.
s =  socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = s.connect_ex(("localhost", 8000))
s.close()
if result > 0:
    subprocess.Popen(["python", "server.py"])
