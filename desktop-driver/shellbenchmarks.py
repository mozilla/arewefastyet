import subprocess
import socket
import os
import time
import json

class Benchmark(object):
    def __init__(self, suite, version, folder):
        self.suite = suite
        self.version = suite+" "+version
        self.folder = folder

    def run(self, engine, submit):
        with utils.chdir(os.path.join(utils.BenchmarkPath, self.folder)):
            return self._run(engine, submit)

    def _run(self, engine, submit):

        for modInfo in engine.modes:
            try:
                tests = None
                print('Running ' + self.version + ' under ' + engine.shell() + ' ' + ' '.join(engine.args))
                tests = self.benchmark(engine.shell(), engine.env(), mode.args)
            except Exception as e:
                print('Failed to run ' + self.version + '!')
                print("Exception: " +  repr(e))
                pass
            if tests:
                submit.AddTests(tests, self.suite, self.version, modInfo.name)

class Octane(Benchmark):
    def __init__(self):
        super(Octane, self).__init__('octane', '2.0', 'octane')

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
        super(Assorted, self).__init__('misc', '0.1', 'misc', 3)

Benchmarks = [SunSpider(),
              Kraken(),
              Octane(),
             ]

def run(submit, native, modes):
    for benchmark in Benchmarks:
        benchmark.run(submit, native, modes)
    submit.Finish(1)

if __name__ == "__main__":
    remote.takerpc()
