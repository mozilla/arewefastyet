# vim: set ts=4 sw=4 tw=99 et:
import os
import sys
import awfy
import data
import json
import time
import os.path

#def ExportHeaders(cx):
#    with open(os.path.join(awfy.path, 'header.json'), 'w') as fp:
#        vendors = [v.export() for v in cx.vendors]
#        modes = [m.export() for m in cx.modes]
#        J = { "version": awfy.version,
#              "vendors": vendors,
#              "modes": modes
#            }
#        json.dump(J, fp)

Machines = [8, 9, 10, 11, 12]

def dump(cx, machine, runs, benchmarks):
    j = { "vendors": [v.export() for v in cx.vendors],
          "modes": [m.export() for m in cx.modes],
          "version": awfy.version,
          "machine": machine
        }
    j['runlist'] = [ ]
    for run in runs.runs:
        o = { "fullDate": time.strftime("%b %e, %Y %H:%S"),
              "shortDate": time.strftime("%b %e")
            }
        j['runlist'].append(o)
    for graph in benchmarks:
        displays = []
        # Build a list of data points for each line.
        for point in graph[1]:
            runid = point[0]
            mode = point[1]
            score = point[2]
            if not runs.contains(runid):
                continue

def main(argv):
    cx = data.Context()
    for machine in Machines:
        runs = data.Runs(machine)
        results = [ ]
        for benchmark in cx.benchmarks:
            # the real v8 is v8real. this is the sunspider harness one.
            if benchmark.name == 'v8':
                continue
            # we don't care about this on the front page.
            if benchmark.name == 'misc':
                continue
            points = data.graph(cx, runs, benchmark.suite_id)
            results.append((benchmark, points))
        dump(cx, machine, runs, results)

#    vendors = [v.export() for v in cx.vendors]
#    modes = [m.export() for m in cx.modes]

if __name__ == '__main__':
    main(sys.argv[1:])

