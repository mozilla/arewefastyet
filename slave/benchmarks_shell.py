import subprocess
import socket
import os
import time
import json
import sys
import re

sys.path.insert(1, '../driver')
import submitter
import utils

class Benchmark(object):
    def __init__(self, suite, folder):
        if folder.endswith("/"):
            folder = folder[:-1]

        self.suite = suite
        self.folder_ = folder

        with utils.chdir(os.path.join(utils.config.BenchmarkPath, self.folder_)):
            fp = open("VERSION", 'r')
            self.version = suite + " " + fp.read().strip("\r\n\r\n \t")
            fp.close()

    def folder(self):
        return self.folder_

class Octane(Benchmark):
    def __init__(self):
        super(Octane, self).__init__('octane', 'octane/')

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
            print(score + '    - ' + name)

        return tests

class SunSpiderBased(Benchmark):
    def __init__(self, suite, folder, runs):
        super(SunSpiderBased, self).__init__(suite, folder)
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
                print(m.group(1) + '    - __total__')
            elif found == True and x[0:4] == "    ":
                m = re.search("    (.+):\s+(\d+\.\d+)ms", x)
                if m != None:
                    tests.append({ 'name': m.group(1), 'time': m.group(2)})
                    print(m.group(2) + '    - ' + m.group(1))

        if found == False:
            print(output)
            raise Exception("output marker not found")

        return tests

class SunSpider(SunSpiderBased):
    def __init__(self):
        super(SunSpider, self).__init__('ss', 'SunSpider/', 20)

class Kraken(SunSpiderBased):
    def __init__(self):
        super(Kraken, self).__init__('kraken', 'kraken/', 5)

class Assorted(SunSpiderBased):
    def __init__(self):
        super(Assorted, self).__init__('misc', 'misc/', 3)

class AsmJSBased(Benchmark):
    def __init__(self, suite, folder):
        super(AsmJSBased, self).__init__(suite, folder)

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
        super(AsmJSMicro, self).__init__('asmjs-ubench', 'asmjs-ubench/')

class AsmJSApps(AsmJSBased):
    def __init__(self):
        super(AsmJSApps, self).__init__('asmjs-apps', 'asmjs-apps/')

class Dart(Benchmark):
    def __init__(self):
        super(Dart, self).__init__('dart', 'dart/')

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
            print(str(score) + '    - ' + name)
        tests.append({ 'name': '__total__', 'time': total })

        return tests

class SixSpeed(Benchmark):
    def __init__(self):
        super(SixSpeed, self).__init__('six-speed', 'six-speed/')

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
            print(score + '    - ' + name)
        tests.append({ 'name': '__total__', 'time': total})
        print(str(total) + '    - __total__')

        return tests

def getBenchmark(name):
    if name == "octane":
        return Octane()
    if name == "sunspider":
        return SunSpider()
    if name == "kraken":
        return Kraken()
    if name == "assorted":
        return Assorted()
    if name == "asmjsapps":
        return AsmJSApps()
    if name == "asmjsmicro":
        return AsmJSMicro()
    if name == "dart":
        return Dart()
    if name == "sixspeed":
        return SixSpeed()
    raise Exception("Unknown benchmark")
