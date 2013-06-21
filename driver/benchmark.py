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
import ConfigParser
import submitter
import utils

class Benchmark(object):
    def __init__(self, name, folder):
        self.name = name
        self.folder = folder

    def run(self, submit, native, modes):
        with utils.chdir(self.folder):
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
                print('Running ' + self.name + ' under ' + mode.shell + ' ' + ' '.join(mode.args))
                tests = self.benchmark(mode.shell, mode.env, mode.args)
            except:
                print('Failed to run ' + self.name + '!')
                pass
            if tests:
                submit.AddTests(tests, self.name, mode.name)

class AsmJS(Benchmark):
    def __init__(self, name, folder):
        super(AsmJS, self).__init__(name, folder)

    def omit(self, mode):
        if mode.name == 'noasmjs':
            return False
        return super(AsmJS, self).omit(mode)

    def _run(self, submit, native, modes):
        # Run the C++ mode.
        full_args = ['python', 'harness.py', '--native']
        full_args += ['--cc="' + native.cc + '"']
        full_args += ['--cxx="' + native.cxx + '"']
        full_args += ['--'] + native.args
        print(' '.join(full_args))

        p = subprocess.Popen(full_args, stdout=subprocess.PIPE, env=os.environ)
        output = p.communicate()[0]
        print(output)
        tests = self.parse(output)
        submit.AddTests(tests, self.name, native.mode)

        # Run normal benchmarks.
        super(AsmJS, self)._run(submit, native, modes)

    def benchmark(self, shell, env, args):
        full_args = ['python', 'harness.py', shell, '--'] + args
        print(' '.join(full_args))
        
        p = subprocess.Popen(full_args, stdout=subprocess.PIPE, env=env)
        output = p.communicate()[0]
        print(output)
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
        super(AsmJSMicro, self).__init__('asmjs-ubench', 'asmjs-ubench')

class AsmJSApps(AsmJS):
    def __init__(self):
        super(AsmJSApps, self).__init__('asmjs-apps', 'asmjs-apps')

class Octane(Benchmark):
    def __init__(self):
        super(Octane, self).__init__('octane', 'octane')

    def benchmark(self, shell, env, args):
        full_args = [shell]
        if args:
            full_args.extend(args)
        full_args.append('run.js')

        print(os.getcwd())
        p = subprocess.Popen(full_args, stdout=subprocess.PIPE, env=env)
        output = p.communicate()[0]

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

class SunSpider(Benchmark):
    def __init__(self, name, folder, suite, runs):
        super(SunSpider, self).__init__(name, folder)
        self.suite = suite
        self.runs = runs

    def benchmark(self, shell, env, args):
        if args != None:
            args = '--args=' + ' '.join(args)
        else:
            args = ''

        if self.suite == "assorted":
            p = subprocess.Popen(["hg", "pull", "-u"], stdout=subprocess.PIPE)
            p.communicate()

        p = subprocess.Popen(["./sunspider",
                              "--shell=" + shell,
                              "--runs=" + str(self.runs),
                              "--suite=" + self.suite,
                              args],
                              stdout=subprocess.PIPE,
                              env=env)
        output = p.communicate()[0]

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

Benchmarks = [AsmJSApps(),
              AsmJSMicro(),
              SunSpider('ss', 'SunSpider', 'sunspider-0.9.1', 20),
              SunSpider('kraken', 'kraken', 'kraken-1.1', 5),
              SunSpider('misc', 'Assorted', 'assorted', 3),
              Octane(),
             ]
