# vim: set ts=4 sw=4 tw=99 et:
import re
import os
import sys
import urllib2
import StringIO
import subprocess
import ConfigParser
import submitter
import utils

def ss_v8(shell, env, args):
    return run_sunspider('SunSpider', 'v8-v7', 5, shell, env, args)

def ss_SunSpider(shell, env, args):
    return run_sunspider('SunSpider', 'sunspider-0.9.1', 20, shell, env, args)

def ss_Kraken(shell, env, args):
    return run_sunspider('kraken', 'kraken-1.1', 5, shell, env, args)

def ss_Assorted(shell, env, args):
    return run_sunspider('Assorted', 'assorted', 3, shell, env, args)

def run_sunspider(folder, suite, runs, shell, env, args):
    with utils.chdir(folder):
        return _sunspider(suite, runs, shell, env, args)

def v8_v8(shell, env, args):
    with utils.chdir('v8-v7'):
        return _v8(shell, env, args)

def v8_octane(shell, env, args):
    with utils.chdir('octane'):
        return _v8(shell, env, args)

def _v8(shell, env, args):
    full_args = [shell]
    if args:
        full_args.extend(args)
    full_args.append('run.js')

    p = subprocess.Popen(full_args, stdout=subprocess.PIPE, env=env)
    output = p.communicate()[0]

    tests = []
    lines = output.splitlines()

    for x in lines:
        m = re.search("(.+): (\d+)", x)
        if m != None:
            name = m.group(1)
            score = m.group(2)
            if name[0:5] == "Score":
                name = "__total__"
            tests.append({ 'name': name, 'time': score})
            print(score + '    - ' + name)

    return tests

def _sunspider(suite, runs, shell, env, args):
    if args != None:
        args = '--args=' + ' '.join(args)
    else:
        args = ''

    if suite == "assorted":
        p = subprocess.Popen(["hg", "pull", "-u"], stdout=subprocess.PIPE)
        p.communicate()

    p = subprocess.Popen(["./sunspider",
                          "--shell=" + shell,
                          "--runs=" + str(runs),
                          "--suite=" + suite,
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
        raise Exception("output marker not found")

    return tests

Benchmarks = { 
               'v8real': v8_v8,
               'kraken': ss_Kraken,
               'ss': ss_SunSpider,
               #'v8': ss_v8,
               'misc': ss_Assorted,
               'octane': v8_octane
             }
                
def RunAndSubmitAll(shell, env, args, submitter, mode):
    for suite in Benchmarks:
        args_ = args
        if not args:
            args_ = []
        print('Running ' + suite + ' under ' + shell + ' ' + ' '.join(args_))
        fun = Benchmarks[suite]
        try:
            tests = fun(shell, env, args)
            submitter.AddTests(tests, suite, mode)
        except:
            pass

