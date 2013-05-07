#!/usr/bin/python
# vim: set ts=4 sw=4 tw=99 et:
import os
import sys
import subprocess
from optparse import OptionParser

Benchmarks = ['copy',
              'corrections',
              'fannkuch',
              'fasta',
              'life',
              'memops',
              'primes',
              'skinning']

RunFactor = '4'

def BuildNative(options, args, benchmark):
    try:
        os.remove('run-' + benchmark)
    except:
        pass

    if os.path.isfile(benchmark + '.cpp'):
        argv = options.cxx.strip('"').split(' ')
        argv += [benchmark + '.cpp']
    else:
        argv = options.cc.strip('"').split(' ')
        argv += [benchmark + '.c', '-std=gnu99']

    if len(args) == 0:
        args = ['-O2']

    argv.extend(args)
    argv.extend(['-o', 'run-' + benchmark])

    subprocess.check_call(argv)

def BenchmarkNative(options, args):
    for benchmark in Benchmarks:
        BuildNative(options, args, benchmark)

    for benchmark in Benchmarks:
        with open('/dev/null', 'w') as fp:
            before = os.times()[4]
            subprocess.check_call(['./run-' + benchmark, RunFactor], stdout=fp)
            after = os.times()[4]
            print(benchmark + ' - ' + str((after - before) * 1000))

def Exec(vec):
    o = subprocess.check_output(vec, stderr=subprocess.STDOUT)
    return o.decode("utf-8")

def BenchmarkJavaScript(options, args):
    for benchmark in Benchmarks:
        # Don't overwrite args!
        argv = [] + args
        argv.extend(['ubench.js', '--', benchmark + '.js', RunFactor])
        t = Exec(argv)
        t = t.strip()
        print(benchmark + ' - ' + t)

def main(argv):
    parser = OptionParser()
    parser.add_option('--native', action='store_true', dest='native')
    parser.add_option('--cc', type='string', dest='cc', default='cc')
    parser.add_option('--cxx', type='string', dest='cxx', default='c++')

    (options, args) = parser.parse_args(argv)

    args = args[1:]

    if len(args) < 1 and not options.native:
        print("Usage: ")
        print("  --native [--cc=] [--cxx] [-- flags]")
        print("  <shell> [-- options]")
        return sys.exit(1)

    if options.native:
        BenchmarkNative(options, args)
    else:
        BenchmarkJavaScript(options, args)

if __name__ == "__main__":
    main(sys.argv)

