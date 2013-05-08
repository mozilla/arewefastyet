#!/usr/bin/python
# vim: set ts=4 sw=4 tw=99 et:
import os
import sys
import subprocess
from optparse import OptionParser

Benchmarks = ['box2d',
              'bullet',
              'zlib']

def Exec(vec):
    o = subprocess.check_output(vec, stderr=subprocess.STDOUT, env=os.environ)
    return o.decode("utf-8")

def BenchmarkJavaScript(options, args):
    for benchmark in Benchmarks:
        for factor in range(1, 5):
            # Don't overwrite args!
            argv = [] + args
            argv.extend(['run.js', '--', benchmark + '.js', str(factor)])
            t = Exec(argv)
            t = t.strip()
            print(benchmark + '-workload' + str(factor) + ' - ' + t)

def main(argv):
    parser = OptionParser()
    (options, args) = parser.parse_args(argv)

    args = args[1:]

    if len(args) < 1:
        print("Usage: <shell> [-- options]")
        return sys.exit(1)

    BenchmarkJavaScript(options, args)

if __name__ == "__main__":
    main(sys.argv)

