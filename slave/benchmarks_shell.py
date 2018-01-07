import json
import logging
import os
import re
import socket
import subprocess
import sys
import time

sys.path.insert(1, '../driver')
import submitter
import utils

class Benchmark(object):
    def __init__(self, folder, suite=None):
        self.logger = logging.getLogger(self.__class__.__name__)
        if folder.endswith("/"):
            folder = folder[:-1]

        self.suite = suite if suite is not None else self.name()
        self.folder_ = folder

        with utils.chdir(os.path.join(utils.config.BenchmarkPath, self.folder_)):
            fp = open("VERSION", 'r')
            self.version = self.suite + " " + fp.read().strip("\r\n\r\n \t")
            fp.close()

    def folder(self):
        return self.folder_

    @staticmethod
    def name():
        """Returns the string name of the benchmark."""
        raise Exception("NYI")


class Octane(Benchmark):
    def __init__(self):
        super(Octane, self).__init__('octane/')

    @staticmethod
    def name():
        return "octane"

    def getCommand(self, shell, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('run.js')

        return full_args

    def process_results(self, output):
        tests = []
        lines = output.splitlines()

        for x in lines:
            m = re.search("(.+): (\d+)", x)
            if not m:
                continue
            name = m.group(1)
            score = m.group(2)
            if name[0:5] == "Score":
                name = "__total__"
            tests.append({ 'name': name, 'time': score})
            utils.log_info(self.logger, score + '    - ' + name)

        return tests

class SunSpiderBased(Benchmark):
    def __init__(self, folder, runs, suite=None):
        super(SunSpiderBased, self).__init__(folder, suite=suite)
        self.runs = runs

    def getCommand(self, shell, args):
        if args != None:
            args = '--args=' + ' '.join(args)
        else:
            args = ''

        return ["sunspider", "--shell=" + shell, "--runs=" + str(self.runs), args]

    def process_results(self, output):
        tests = []

        lines = output.splitlines()
        found = False
        for x in lines:
            if x == "--------------------------------------------" or \
               x == "-----------------------------------------------":
                found = True
            if x[0:5] == "Total":
                m = re.search(":\s+(\d+\.\d+)ms", x)
                tests.append({ 'name': '__total__', 'time': m.group(1)})
                utils.log_info(self.logger, m.group(1) + '    - __total__')
            elif found == True and x[0:4] == "    ":
                m = re.search("    (.+):\s+(\d+\.\d+)ms", x)
                if m != None:
                    tests.append({ 'name': m.group(1), 'time': m.group(2)})
                    utils.log_info(self.logger, m.group(2) + '    - ' + m.group(1))

        if found == False:
            utils.log_info(self.logger, output)
            raise Exception("output marker not found")

        return tests

class SunSpider(SunSpiderBased):
    def __init__(self):
        super(SunSpider, self).__init__('SunSpider/', 20, suite='ss')

    @staticmethod
    def name():
        return 'sunspider'

class Kraken(SunSpiderBased):
    def __init__(self):
        super(Kraken, self).__init__('kraken/', 5)

    @staticmethod
    def name():
        return 'kraken'

class Assorted(SunSpiderBased):
    def __init__(self):
        super(Assorted, self).__init__('misc/', 3, suite='misc')

    @staticmethod
    def name():
        return 'assorted'

class AsmJSBased(Benchmark):
    def __init__(self, folder, suite=None):
        super(AsmJSBased, self).__init__(folder, suite=suite)

    def getCommand(self, shell, args):
        full_args = ['./harness.sh', shell + " " + " ".join(args)]
        return full_args

    def process_results(self, output):
        total = 0.0
        tests = []
        for line in output.splitlines():
            m = re.search("(.+) - (\d+(\.\d+)?)", line)
            if not m:
                continue
            name = m.group(1)
            score = m.group(2)
            total += float(score)
            tests.append({ 'name': name, 'time': score })
        tests.append({ 'name': '__total__', 'time': total })
        return tests

class AsmJSMicro(AsmJSBased):
    def __init__(self):
        super(AsmJSMicro, self).__init__('asmjs-ubench/', suite='asmjs-ubench')

    @staticmethod
    def name():
        return 'asmjsmicro'

class AsmJSApps(AsmJSBased):
    def __init__(self):
        super(AsmJSApps, self).__init__('asmjs-apps/', suite='asmjs-apps')

    @staticmethod
    def name():
        return 'asmjsapps'

class Dart(Benchmark):
    def __init__(self):
        super(Dart, self).__init__('dart/')

    @staticmethod
    def name():
        return 'dart'

    def getCommand(self, shell, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('run.js')

        return full_args

    def process_results(self, output):
        tests = []
        lines = output.splitlines()

        total = 0.0
        for x in lines:
            m = re.search("(.+)\(RunTime\): (\d+\.\d+)", x)
            if not m:
                continue
            name = m.group(1)
            score = float(m.group(2))/1000
            total += score
            tests.append({ 'name': name, 'time': score})
            utils.log_info(self.logger, str(score) + '    - ' + name)
        tests.append({ 'name': '__total__', 'time': total })

        return tests

class SixSpeed(Benchmark):
    def __init__(self):
        super(SixSpeed, self).__init__('six-speed/', suite='six-speed')

    @staticmethod
    def name():
        return 'sixspeed'

    def getCommand(self, shell, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('test.js')

        return full_args

    def process_results(self, output):
        tests = []
        lines = output.splitlines()

        total = 0
        for x in lines:
            m = re.search("(.+): (\d+)", x)
            if not m:
                continue
            name = m.group(1)
            score = m.group(2)
            total += int(score)
            tests.append({ 'name': name, 'time': score})
            utils.log_info(self.logger, score + '    - ' + name)
        tests.append({ 'name': '__total__', 'time': total})
        utils.log_info(self.logger, str(total) + '    - __total__')

        return tests

class Ares6(Benchmark):
    def __init__(self):
        super(Ares6, self).__init__('ares6/')

    @staticmethod
    def name():
        return 'ares6'

    def getCommand(self, shell, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('cli.js')

        return full_args

    def _try_find_score(self, score_name, bench_name, line, scores):
        m = re.search(score_name + ':\s*(\d+\.?\d*?) (\+-)?.+', line)
        if not m:
            return False

        score = m.group(1)
        scores[bench_name] = scores.get(bench_name, {})
        scores[bench_name][score_name] = scores[bench_name].get(score_name, [])
        scores[bench_name][score_name].append(float(score))
        return True

    def process_results(self, output):
        tests = []
        lines = output.splitlines()

        bench_name = None
        last_summary = None
        scores = {}

        total = 0
        for line in lines:
            m = re.search("Running... (.+) \(.+\)", line)
            if m:
                bench_name = m.group(1)
                continue

            if self._try_find_score('firstIteration', bench_name, line, scores):
                continue

            if self._try_find_score('averageWorstCase', bench_name, line, scores):
                continue

            if self._try_find_score('steadyState', bench_name, line, scores):
                continue

            m = re.search('summary:\s*(\d+\.?\d*?) (\+-)?.+', line)
            if m:
                last_summary = float(m.group(1))

        for bench in scores:
            for key in scores[bench]:
                total = sum(scores[bench][key]) / len(scores[bench][key])
                test_name = "{}-{}".format(bench, key)
                tests.append({ 'name': test_name, 'time': total })

        if last_summary:
            tests.append({ 'name': '__total__', 'time': last_summary })

        return tests


class WebToolingBenchmark(Benchmark):
    def __init__(self):
        super(WebToolingBenchmark, self).__init__('web-tooling-benchmark/')

    @staticmethod
    def name():
        return "web-tooling-benchmark"

    def getCommand(self, shell, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('cli.js')

        return full_args

    def process_results(self, output):
        tests = []
        lines = output.splitlines()

        for x in lines:
            m = re.search(" +([a-zA-Z].+): +([.0-9]+) +runs/sec", x)
            if not m:
                continue
            name = m.group(1)
            score = m.group(2)
            if name == "mean":
                name = "__total__"
            tests.append({'name': name, 'time': score})
            utils.log_info(self.logger, score + '    - ' + name)

        return tests


Known = [
    Octane,
    SunSpider,
    Kraken,
    Assorted,
    AsmJSApps,
    AsmJSMicro,
    Dart,
    SixSpeed,
    Ares6,
    WebToolingBenchmark
]
