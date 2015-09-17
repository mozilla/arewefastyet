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
    def __init__(self, suite, version, folder):
        self.suite = suite
        self.version = suite+" "+version
        self.folder = folder

    def run(self, engine, submit):
        with utils.chdir(os.path.join(utils.config.BenchmarkPath, self.folder)):
            return self._run(engine, submit)

    def _run(self, engine, submit):

        for modInfo in engine.modes:
            try:
                tests = None
                print('Running ' + self.version + ' under ' + engine.shell() + ' ' + ' '.join(modInfo["args"]))
                tests = self.benchmark(engine.shell(), engine.env(), modInfo["args"])
            except Exception as e:
                print('Failed to run ' + self.version + '!')
                print("Exception: " +  repr(e))
                pass
            if tests:
                submit.AddTests(tests, self.suite, self.version, modInfo["name"])

class Octane(Benchmark):
    def __init__(self):
        super(Octane, self).__init__('octane', '2.0.1', 'octane')

    def benchmark(self, shell, env, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('run.js')

        print(os.getcwd())
        output = utils.RunTimedCheckOutput(full_args, env=env)

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
    def __init__(self, suite, version, folder, runs):
        super(SunSpiderBased, self).__init__(suite, version, folder)
        self.runs = runs

    def benchmark(self, shell, env, args):
        if args != None:
            args = '--args=' + ' '.join(args)
        else:
            args = ''

        output = utils.RunTimedCheckOutput(["./sunspider",
                                            "--shell=" + shell,
                                            "--runs=" + str(self.runs),
                                            args],
                                           env=env)
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
        super(SunSpider, self).__init__('ss', '1.0.1', 'SunSpider', 20)

class Kraken(SunSpiderBased):
    def __init__(self):
        super(Kraken, self).__init__('kraken', '1.1', 'kraken', 5)

class Assorted(SunSpiderBased):
    def __init__(self):
        super(Assorted, self).__init__('misc', '0.5', 'misc', 3)

class AsmJSBased(Benchmark):
    def __init__(self, suite, version, folder):
        super(AsmJSBased, self).__init__(suite, version, folder)

    """
    def _run(self, submit, native, modes):
        # Run the C++ mode.
        full_args = [utils.config.PythonName, 'harness.py', '--native']
        full_args += ['--cc="' + native.cc + '"']
        full_args += ['--cxx="' + native.cxx + '"']
        full_args += ['--'] + native.args
        output = utils.RunTimedCheckOutput(full_args)

        tests = self.parse(output)
        submit.AddTests(tests, self.suite, self.version, native.mode)

        # Run normal benchmarks.
        super(AsmJS, self)._run(submit, native, modes)
    """

    def benchmark(self, shell, env, args):
        full_args = [utils.config.PythonName, 'harness.py', shell, '--'] + args
        print(' '.join(full_args))

        output = utils.RunTimedCheckOutput(full_args, env=env)
        return self.parse(output)

    def parse(self, output):
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
        super(AsmJSMicro, self).__init__('asmjs-ubench', '0.4.3', 'asmjs-ubench')

class AsmJSApps(AsmJSBased):
    def __init__(self):
        super(AsmJSApps, self).__init__('asmjs-apps', '0.2', 'asmjs-apps')

class Dart(Benchmark):
    def __init__(self):
        super(Dart, self).__init__('dart', '0.1', 'dart')

    def benchmark(self, shell, env, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('run.js')

        print(os.getcwd())
        output = utils.RunTimedCheckOutput(full_args, env=env)

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
    raise Exception("Unknown benchmark")

def run(submit, native, modes):
    for benchmark in Benchmarks:
        benchmark.run(submit, native, modes)
    submit.Finish(1)

if __name__ == "__main__":
    remote.takerpc()
