# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import os
import sys
import urllib2
import StringIO
import subprocess
import signal
import pickle

import ConfigParser
import submitter
import utils

class Benchmark(object):
    def __init__(self, suite, version, folder):
        self.suite = suite
        self.version = suite+" "+version
        self.folder = folder

    def run(self, submit, native, modes):
        with utils.chdir(os.path.join(utils.config.BenchmarkPath, self.folder)):
            return self._run(submit, native, modes)

    def omit(self, mode):
        if mode.name == 'noasmjs':
            return True

    def _run(self, submit, native, modes):
        for mode in modes:
            if self.omit(mode):
                continue
            try:
                tests = None
                print('Running ' + self.version + ' under ' + mode.shell + ' ' + ' '.join(mode.args))
                tests = self.benchmark(mode.shell, mode.env, mode.args)
            except Exception as e:
                print('Failed to run ' + self.version + '!')
                print("Exception: " +  repr(e))
                pass
            if tests:
                submit.AddTests(tests, self.suite, self.version, mode.name)

class AsmJS(Benchmark):
    def __init__(self, suite, version, folder):
        super(AsmJS, self).__init__(suite, version, folder)

    def omit(self, mode):
        if mode.name == 'noasmjs':
            return False
        return super(AsmJS, self).omit(mode)

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

class AsmJSMicro(AsmJS):
    def __init__(self):
        super(AsmJSMicro, self).__init__('asmjs-ubench', '0.4.2', 'asmjs-ubench')

class AsmJSApps(AsmJS):
    def __init__(self):
        super(AsmJSApps, self).__init__('asmjs-apps', '0.2', 'asmjs-apps')

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
            m = re.search("(.+): (\d+\.\d+)", x)
            if not m:
                continue
            name = m.group(1)
            score = float(m.group(2))/1000
            total += score
            tests.append({ 'name': name, 'time': score})
            print(str(score) + '    - ' + name)
        tests.append({ 'name': '__total__', 'time': total })

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
        super(Assorted, self).__init__('misc', '0.4', 'misc', 3)

class Shumway(Benchmark):
    def __init__(self):
        super(Shumway, self).__init__('shumway', '0.1', 'shumway')

        # Only update harness once a day:
        from datetime import datetime
        date = datetime.now().strftime("%Y-%m-%d")
        utils.getOrDownload("/tmp/", "shumway", date,
                            "http://mozilla.github.io/shumway/shell/shumway-shell.zip",
                            "/tmp/shumway-shell.zip")
        utils.unzip("/tmp/", "shumway-shell.zip")

    def omit(self, mode):
        if "shumway_interp" not in mode.name:
            # JIT is broken atm. Disable running
            return True
        elif mode.name not in ["jsc_shumway_interp", "jmim_shumway_interp", "v8_shumway_interp"]:
            # Only run interpreter for some modes
            return True

    def _run(self, submit, native, modes):
        # Run the full shumway jit.
        super(Shumway, self)._run(submit, native, modes)

        # Run the shumway interpreter.
        interp_modes = []
        for mode in modes:
            interp_modes.append(mode._replace(name = mode.name+"_shumway_interp"))
        super(Shumway, self)._run(submit, native, interp_modes)


    def benchmark(self, shell, env, args):
        with utils.chdir("/tmp/"):
            full_args = [shell]
            if args:
                full_args.extend(args)
            full_args.append('build/ts/shell.js')
            if "WebKit" in shell:
                full_args.append('--')
            if "v8" in shell:
                full_args.append('--')
            full_args.append('-x')

            tests = []
            totalscore = 0
            bench_path = os.path.join(utils.config.BenchmarkPath, self.folder)
            for name in ["crypto", "deltablue", "raytrace", "richards", "splay"]:
                output = utils.RunTimedCheckOutput(full_args +
                             [os.path.join(bench_path, name+".swf")], env=env)

                lines = output.splitlines()

                for x in lines:
                    m = re.search("NotifyScore (\d+)", x)
                    if not m:
                        continue
                    score = m.group(1)
                    totalscore += int(score)
                    tests.append({ 'name': name, 'time': score})
                    print(score + '    - ' + name)

            if len(tests) > 0:
                tests.append({ 'name': '__total__', 'time': totalscore / len(tests)})
            return tests

Benchmarks = [AsmJSApps(),
              AsmJSMicro(),
              SunSpider(),
              Kraken(),
              Assorted(),
              Octane(),
              Shumway(),
              Dart()
             ]

def run(submit, native, modes):
    for benchmark in Benchmarks:
        benchmark.run(submit, native, modes)
    submit.Finish(1)

#def run(slave, submit, native, modes):
#    slave.rpc(sys.modules[__name__], submit, native, modes, async=True)
#
#default_function = run_
if __name__ == "__main__":
    remote.takerpc()
